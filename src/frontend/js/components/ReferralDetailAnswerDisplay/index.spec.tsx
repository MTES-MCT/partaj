import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import filesize from 'filesize';
import React from 'react';
import { IntlProvider } from 'react-intl';

import { CurrentUserContext } from 'data/useCurrentUser';
import * as types from 'types';
import { Context } from 'types/context';
import { Deferred } from 'utils/test/Deferred';
import * as factories from 'utils/test/factories';
import { ReferralDetailAnswerDisplay } from '.';
import { ShowAnswerFormContext } from 'components/ReferralDetail';

describe('<ReferralDetailAnswerDisplay />', () => {
  const context: Context = {
    assets: { icons: '/example/icons.svg' },
    csrftoken: 'the csrf token',
    environment: 'test',
    sentry_dsn: 'https://sentry.dsn/0',
    token: 'the auth token',
  };

  const size = filesize.partial({ locale: 'en-US' });

  afterEach(() => fetchMock.restore());

  it('shows the published answer to the referral', async () => {
    // Create a referral and force a unit member's name
    const referral: types.Referral = factories.ReferralFactory.generate();
    referral.topic.unit.members[0].first_name = 'Wang';
    referral.topic.unit.members[0].last_name = 'Miao';
    // Add an answer authored by our chosen unit member
    const answer: types.ReferralAnswer = factories.ReferralAnswerFactory.generate();
    answer.created_by = referral.topic.unit.members[0];
    answer.content = 'The answer content';
    answer.state = types.ReferralAnswerState.PUBLISHED;

    const deferred = new Deferred();
    fetchMock.get(
      `/api/referralanswervalidationrequests/?answer=${answer.id}&limit=999`,
      deferred.promise,
    );

    render(
      <IntlProvider locale="en">
        <CurrentUserContext.Provider
          value={{ currentUser: referral.topic.unit.members[0] }}
        >
          <ReferralDetailAnswerDisplay
            answer={answer}
            context={context}
            referral={{
              ...referral,
              answers: [answer],
              state: types.ReferralState.ANSWERED,
            }}
          />
        </CurrentUserContext.Provider>
      </IntlProvider>,
    );

    screen.getByRole('article', { name: 'Referral answer' });
    screen.getByText(`By Wang Miao, ${referral.topic.unit.name}`);
    screen.getByText('The answer content');
    screen.getByRole('heading', { name: 'Attachments' });
    screen.getByRole('group', { name: 'Attachments' });
    for (let attachment of answer.attachments) {
      screen.getByRole('link', {
        name: `${attachment.name_with_extension} — ${size(attachment.size)}`,
      });
    }
    screen.getByRole('status', { name: 'Loading answer validations...' });

    expect(screen.queryByRole('button', { name: 'Modify' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Revise' })).toBeNull();
    expect(
      screen.queryByRole('button', { name: 'Send to requester' }),
    ).toBeNull();

    await act(async () =>
      deferred.resolve({ count: 0, next: null, previous: null, results: [] }),
    );

    expect(screen.queryByRole('heading', { name: 'Validations' })).toBeNull();
  });

  it('shows a button to revise the answer when revision is possible', async () => {
    // The current user is allowed to revise the answer and it is not published yet
    const user = factories.UserFactory.generate();
    const referral: types.Referral = factories.ReferralFactory.generate();
    referral.topic.unit.members[1] = user;
    const answer: types.ReferralAnswer = factories.ReferralAnswerFactory.generate();
    answer.created_by = referral.topic.unit.members[0];
    referral.answers = [answer];
    referral.state = types.ReferralState.ASSIGNED;

    const validationRequestsDeferred = new Deferred();
    fetchMock.get(
      `/api/referralanswervalidationrequests/?answer=${answer.id}&limit=999`,
      validationRequestsDeferred.promise,
    );

    const answersDeferred = new Deferred();
    fetchMock.post(`/api/referralanswers/`, answersDeferred.promise);

    const setShowAnswerForm = jest.fn();

    render(
      <IntlProvider locale="en">
        <ShowAnswerFormContext.Provider
          value={{ showAnswerForm: null, setShowAnswerForm }}
        >
          <CurrentUserContext.Provider value={{ currentUser: user }}>
            <ReferralDetailAnswerDisplay
              {...{
                answer,
                context,
                referral,
              }}
            />
          </CurrentUserContext.Provider>
        </ShowAnswerFormContext.Provider>
      </IntlProvider>,
    );

    await act(async () =>
      validationRequestsDeferred.resolve({
        count: 0,
        next: null,
        previous: null,
        results: [],
      }),
    );

    screen.getByRole('article', { name: 'Referral answer draft' });
    screen.getByRole('heading', { name: 'Validations' });
    const button = screen.getByRole('button', { name: 'Revise' });
    expect(screen.queryByRole('button', { name: 'Modify' })).toBeNull();

    await userEvent.click(button);
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button).toHaveAttribute('aria-disabled', 'true');
    expect(button).toContainHTML('spinner');
    expect(
      fetchMock.calls('/api/referralanswers/', {
        headers: { Authorization: 'Token the auth token' },
        method: 'POST',
      }).length,
    ).toEqual(1);
    expect(fetchMock.lastCall('/api/referralanswers/')?.[1]?.body).toEqual(
      JSON.stringify({
        attachments: answer.attachments,
        content: answer.content,
        referral: referral.id,
      }),
    );

    const newAnswer = {
      ...answer,
      id: '157f38f3-85a5-47b7-9c90-511fb4b440c2',
    };
    await act(async () => answersDeferred.resolve(newAnswer));

    expect(screen.queryByRole('button', { name: 'Revise' })).toBeNull();
    expect(setShowAnswerForm).toHaveBeenCalledWith(
      '157f38f3-85a5-47b7-9c90-511fb4b440c2',
    );
  });

  it('shows an error message when it fails to create a revision for the answer', async () => {
    // The current user is allowed to revise the answer and it is not published yet
    const user = factories.UserFactory.generate();
    const referral: types.Referral = factories.ReferralFactory.generate();
    referral.topic.unit.members[1] = user;
    const answer: types.ReferralAnswer = factories.ReferralAnswerFactory.generate();
    answer.created_by = referral.topic.unit.members[0];
    referral.answers = [answer];
    referral.state = types.ReferralState.ASSIGNED;

    fetchMock.get(
      `/api/referralanswervalidationrequests/?answer=${answer.id}&limit=999`,
      {
        count: 0,
        next: null,
        previous: null,
        results: [],
      },
    );

    const deferred = new Deferred();
    fetchMock.post(`/api/referralanswers/`, deferred.promise);

    const setShowAnswerForm = jest.fn();

    render(
      <IntlProvider locale="en">
        <ShowAnswerFormContext.Provider
          value={{ showAnswerForm: null, setShowAnswerForm }}
        >
          <CurrentUserContext.Provider value={{ currentUser: user }}>
            <ReferralDetailAnswerDisplay
              {...{
                answer,
                context,
                referral,
              }}
            />
          </CurrentUserContext.Provider>
        </ShowAnswerFormContext.Provider>
      </IntlProvider>,
    );

    screen.getByRole('article', { name: 'Referral answer draft' });
    const button = screen.getByRole('button', { name: 'Revise' });
    expect(screen.queryByRole('button', { name: 'Modify' })).toBeNull();

    await userEvent.click(button);
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button).toHaveAttribute('aria-disabled', 'true');
    expect(button).toContainHTML('spinner');

    await act(async () => deferred.resolve(400));
    expect(button).toHaveAttribute('aria-busy', 'false');
    expect(button).toHaveAttribute('aria-disabled', 'false');
    expect(button).not.toContainHTML('spinner');
    screen.getByText(
      'An error occurred while trying to create a revision for this answer.',
    );
  });

  it('shows a button to modify the answer when modification is possible', () => {
    // The current user is allowed to revise the answer and it is not published yet
    const referral: types.Referral = factories.ReferralFactory.generate();
    const answer: types.ReferralAnswer = factories.ReferralAnswerFactory.generate();
    answer.created_by = referral.topic.unit.members[0];

    fetchMock.get(
      `/api/referralanswervalidationrequests/?answer=${answer.id}&limit=999`,
      {
        count: 0,
        next: null,
        previous: null,
        results: [],
      },
    );

    const setShowAnswerForm = jest.fn();

    render(
      <IntlProvider locale="en">
        <ShowAnswerFormContext.Provider
          value={{ showAnswerForm: null, setShowAnswerForm }}
        >
          <CurrentUserContext.Provider
            value={{ currentUser: referral.topic.unit.members[0] }}
          >
            <ReferralDetailAnswerDisplay
              answer={answer}
              context={context}
              referral={{
                ...referral,
                answers: [answer],
                state: types.ReferralState.ASSIGNED,
              }}
            />
          </CurrentUserContext.Provider>
        </ShowAnswerFormContext.Provider>
      </IntlProvider>,
    );

    screen.getByRole('article', { name: 'Referral answer draft' });
    screen.getByRole('button', { name: 'Revise' });
    const button = screen.getByRole('button', { name: 'Modify' });

    userEvent.click(button);
    expect(setShowAnswerForm).toHaveBeenCalledWith(answer.id);
  });

  it('shows a button to publish the answer when publication is possible', async () => {
    // The current user is allowed to publish the answer and it is not published yet
    const referral: types.Referral = factories.ReferralFactory.generate();
    const answer: types.ReferralAnswer = factories.ReferralAnswerFactory.generate();
    answer.created_by = referral.topic.unit.members[0];

    fetchMock.get(
      `/api/referralanswervalidationrequests/?answer=${answer.id}&limit=999`,
      {
        count: 0,
        next: null,
        previous: null,
        results: [],
      },
    );

    const deferred = new Deferred();
    fetchMock.post(
      `/api/referrals/${referral.id}/publish_answer/`,
      deferred.promise,
    );

    const { rerender } = render(
      <IntlProvider locale="en">
        <CurrentUserContext.Provider
          value={{ currentUser: referral.topic.unit.members[0] }}
        >
          <ReferralDetailAnswerDisplay
            answer={answer}
            context={context}
            referral={{
              ...referral,
              answers: [answer],
              state: types.ReferralState.ASSIGNED,
            }}
          />
        </CurrentUserContext.Provider>
      </IntlProvider>,
    );

    screen.getByRole('article', { name: 'Referral answer draft' });
    const openModalButton = screen.getByRole('button', {
      name: 'Answer the referral',
    });

    // Open the modal and inspect its contents
    await userEvent.click(openModalButton);
    screen.getByRole('heading', { name: `Referral #${referral.id}` });
    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    screen.getByRole('button', { name: 'Send the answer' });

    // Close and reopen the modal to make sure everything works smoothly
    await userEvent.click(cancelButton);
    expect(
      screen.queryByRole('heading', { name: `Referral #${referral.id}` }),
    ).toBeNull();
    {
      const openModalButton = screen.getByRole('button', {
        name: 'Answer the referral',
      });
      await userEvent.click(openModalButton);
    }

    const sendButton = screen.getByRole('button', { name: 'Send the answer' });
    await userEvent.click(sendButton);
    expect(sendButton).toHaveAttribute('aria-busy', 'true');
    expect(sendButton).toHaveAttribute('aria-disabled', 'true');
    expect(sendButton).toContainHTML('spinner');
    expect(
      fetchMock.calls(`/api/referrals/${referral.id}/publish_answer/`, {
        body: { answer: answer.id },
        headers: { Authorization: 'Token the auth token' },
        method: 'POST',
      }).length,
    ).toEqual(1);

    const updatedReferral = {
      ...referral,
      state: types.ReferralState.ANSWERED,
    };
    await act(async () => deferred.resolve(updatedReferral));

    rerender(
      <IntlProvider locale="en">
        <CurrentUserContext.Provider
          value={{ currentUser: referral.topic.unit.members[0] }}
        >
          <ReferralDetailAnswerDisplay
            answer={answer}
            context={context}
            referral={updatedReferral}
          />
        </CurrentUserContext.Provider>
      </IntlProvider>,
    );

    expect(
      screen.queryByRole('button', { name: 'Send to requester' }),
    ).toBeNull();
  });

  it('shows an error message when it fails to publish the answer', async () => {
    const referral: types.Referral = factories.ReferralFactory.generate();
    const answer: types.ReferralAnswer = factories.ReferralAnswerFactory.generate();
    answer.created_by = referral.topic.unit.members[0];

    fetchMock.get(
      `/api/referralanswervalidationrequests/?answer=${answer.id}&limit=999`,
      {
        count: 0,
        next: null,
        previous: null,
        results: [],
      },
    );

    const deferred = new Deferred();
    fetchMock.post(
      `/api/referrals/${referral.id}/publish_answer/`,
      deferred.promise,
    );

    render(
      <IntlProvider locale="en">
        <CurrentUserContext.Provider
          value={{ currentUser: referral.topic.unit.members[0] }}
        >
          <ReferralDetailAnswerDisplay
            answer={answer}
            context={context}
            referral={{
              ...referral,
              answers: [answer],
              state: types.ReferralState.ASSIGNED,
            }}
          />
        </CurrentUserContext.Provider>
      </IntlProvider>,
    );

    screen.getByRole('article', { name: 'Referral answer draft' });
    const openModalButton = screen.getByRole('button', {
      name: 'Answer the referral',
    });

    // Open the modal and inspect its contents
    await userEvent.click(openModalButton);
    screen.getByRole('heading', { name: `Referral #${referral.id}` });
    screen.getByRole('button', { name: 'Cancel' });
    screen.getByRole('button', { name: 'Send the answer' });

    const sendButton = screen.getByRole('button', { name: 'Send the answer' });
    await userEvent.click(sendButton);
    expect(sendButton).toHaveAttribute('aria-busy', 'true');
    expect(sendButton).toHaveAttribute('aria-disabled', 'true');
    expect(sendButton).toContainHTML('spinner');
    expect(
      fetchMock.calls(`/api/referrals/${referral.id}/publish_answer/`, {
        body: { answer: answer.id },
        headers: { Authorization: 'Token the auth token' },
        method: 'POST',
      }).length,
    ).toEqual(1);

    await act(async () => deferred.resolve(400));
    expect(sendButton).toHaveAttribute('aria-busy', 'false');
    expect(sendButton).toHaveAttribute('aria-disabled', 'false');
    expect(sendButton).not.toContainHTML('spinner');
    screen.getByText(
      'An error occurred while trying to send the answer to the requester.',
    );
  });
});
