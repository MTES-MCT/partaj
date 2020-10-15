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

describe('<ReferralDetailAnswerDisplay />', () => {
  const context: Context = {
    assets: { icons: '/example/icons.svg' },
    csrftoken: 'the csrf token',
    environment: 'test',
    sentry_dsn: 'https://sentry.dsn/0',
    token: 'the auth token',
  };

  const size = filesize.partial({ locale: 'en-US' });

  it('shows the published answer to the referral', () => {
    // Create a referral and force a unit member's name
    const referral: types.Referral = factories.ReferralFactory.generate();
    referral.topic.unit.members[0].first_name = 'Wang';
    referral.topic.unit.members[0].last_name = 'Miao';
    // Add an answer authored by our chosen unit member
    const answer: types.ReferralAnswer = factories.ReferralAnswerFactory.generate();
    answer.created_by = referral.topic.unit.members[0];
    answer.content = 'The answer content';
    answer.state = types.ReferralAnswerState.PUBLISHED;

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

    expect(screen.queryByRole('button', { name: 'Modify' })).toBeNull();
    expect(
      screen.queryByRole('button', { name: 'Create a revision' }),
    ).toBeNull();
    expect(
      screen.queryByRole('button', { name: 'Send to requester' }),
    ).toBeNull();
  });

  it('shows a button to revise the answer when revision is possible', () => {
    // The current user is allowed to revise the answer and it is not published yet
    const user = factories.UserFactory.generate();
    const referral: types.Referral = factories.ReferralFactory.generate();
    referral.topic.unit.members[1] = user;
    const answer: types.ReferralAnswer = factories.ReferralAnswerFactory.generate();
    answer.created_by = referral.topic.unit.members[0];

    render(
      <IntlProvider locale="en">
        <CurrentUserContext.Provider value={{ currentUser: user }}>
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
    screen.getByRole('button', { name: 'Create a revision' });
    expect(screen.queryByRole('button', { name: 'Modify' })).toBeNull();
  });

  it('shows a button to modify the answer when modification is possible', () => {
    // The current user is allowed to revise the answer and it is not published yet
    const referral: types.Referral = factories.ReferralFactory.generate();
    const answer: types.ReferralAnswer = factories.ReferralAnswerFactory.generate();
    answer.created_by = referral.topic.unit.members[0];

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
    screen.getByRole('button', { name: 'Create a revision' });
    screen.getByRole('button', { name: 'Modify' });
  });

  it('shows a button to publish the answer when publication is possible', async () => {
    // The current user is allowed to publish the answer and it is not published yet
    const referral: types.Referral = factories.ReferralFactory.generate();
    const answer: types.ReferralAnswer = factories.ReferralAnswerFactory.generate();
    answer.created_by = referral.topic.unit.members[0];

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
    const button = screen.getByRole('button', { name: 'Send to requester' });
    await userEvent.click(button);
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button).toHaveAttribute('aria-disabled', 'true');
    expect(button).toContainHTML('spinner');
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
    const button = screen.getByRole('button', { name: 'Send to requester' });
    await userEvent.click(button);
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button).toHaveAttribute('aria-disabled', 'true');
    expect(button).toContainHTML('spinner');
    expect(
      fetchMock.calls(`/api/referrals/${referral.id}/publish_answer/`, {
        body: { answer: answer.id },
        headers: { Authorization: 'Token the auth token' },
        method: 'POST',
      }).length,
    ).toEqual(1);

    await act(async () => deferred.resolve(400));
    expect(button).toHaveAttribute('aria-busy', 'false');
    expect(button).toHaveAttribute('aria-disabled', 'false');
    expect(button).not.toContainHTML('spinner');
    screen.getByText(
      'An error occurred while trying to send the answer to the requester.',
    );
  });
});
