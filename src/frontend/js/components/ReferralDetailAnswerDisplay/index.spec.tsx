import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import filesize from 'filesize';
import React from 'react';
import { IntlProvider } from 'react-intl';

import { ShowAnswerFormContext } from 'components/ReferralDetail';
import { CurrentUserContext } from 'data/useCurrentUser';
import * as types from 'types';
import { Context } from 'types/context';
import { Deferred } from 'utils/test/Deferred';
import * as factories from 'utils/test/factories';
import { getUserFullname } from 'utils/user';
import { ReferralDetailAnswerDisplay } from '.';
import { pick } from 'lodash-es';

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
    const dropdownButton = screen.getByRole('button', { name: 'More options' });
    userEvent.click(dropdownButton);
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
    const dropdownButton = screen.getByRole('button', { name: 'More options' });
    userEvent.click(dropdownButton);
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
    const dropdownButton = screen.getByRole('button', { name: 'More options' });
    userEvent.click(dropdownButton);
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

  describe('validation request form', () => {
    const georgesAbitbol: types.UserLite = {
      first_name: 'Georges',
      id: '1bcb8026-bde4-4c2c-9ddb-260449b9ae1f ',
      last_name: 'Abitbol',
    };

    const georgesHenri: types.UserLite = {
      first_name: 'Georges',
      id: 'bc9688f7-8ffd-4c56-bf9e-2232dd4c2d9a',
      last_name: 'Henri',
    };

    it('shows the form and allows unit members to request validations when it is possible', async () => {
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

      render(
        <IntlProvider locale="en">
          <ShowAnswerFormContext.Provider
            value={{ showAnswerForm: null, setShowAnswerForm: jest.fn() }}
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

      // The Validations component is displayed, with no existing validations
      screen.getByRole('heading', { name: 'Validations' });
      screen.getByText('No validations have been requested yet.');
      // The form to add a validator is displayed as the user is part of the unit
      screen.getByRole('form', { name: 'Add validations for this answer' });
      const input = screen.getByRole('textbox', {
        name: 'Start typing a validator name',
      });
      const requestBtn = screen.getByRole('button', {
        name: 'Request a validation',
      });
      expect(requestBtn).toHaveAttribute('aria-busy', 'false');
      expect(requestBtn).toHaveAttribute('aria-disabled', 'true');
      // User opens the validator search combobox
      userEvent.click(input);
      const response = {
        count: 2,
        next: null,
        previous: null,
        results: [georgesAbitbol, georgesHenri],
      };
      // User starts typing the name of a validator
      const usersLiteDeferred1 = new Deferred();
      fetchMock.get(
        '/api/users/?limit=999&query=G',
        usersLiteDeferred1.promise,
      );
      userEvent.type(input, 'G');
      expect(fetchMock.calls('/api/users/?limit=999&query=G').length).toEqual(
        1,
      );
      await act(async () => usersLiteDeferred1.resolve(response));
      screen.getByRole('option', { name: 'Georges Abitbol' });
      screen.getByRole('option', { name: 'Georges Henri' });
      // User types one more letter in the name of a validator
      const usersLiteDeferred2 = new Deferred();
      fetchMock.get(
        '/api/users/?limit=999&query=Ge',
        usersLiteDeferred2.promise,
      );
      userEvent.type(input, 'e');
      expect(fetchMock.calls('/api/users/?limit=999&query=Ge').length).toEqual(
        1,
      );
      await act(async () => usersLiteDeferred2.resolve(response));
      const abitbolOption = screen.getByRole('option', {
        name: 'Georges Abitbol',
      });
      screen.getByRole('option', { name: 'Georges Henri' });
      // User picks a validator and adds them
      const addValidatorDeferred = new Deferred();
      fetchMock.post(
        `/api/referrals/${referral.id}/request_answer_validation/`,
        addValidatorDeferred.promise,
      );
      userEvent.click(abitbolOption);
      expect(requestBtn).toHaveAttribute('aria-busy', 'false');
      expect(requestBtn).toHaveAttribute('aria-disabled', 'false');
      userEvent.click(requestBtn);
      expect(requestBtn).toHaveAttribute('aria-busy', 'true');
      expect(requestBtn).toHaveAttribute('aria-disabled', 'true');
      expect(requestBtn).toContainHTML('spinner');
      expect(
        fetchMock.calls(
          `/api/referrals/${referral.id}/request_answer_validation/`,
        ).length,
      ).toEqual(1);

      await act(async () => addValidatorDeferred.resolve({}));
      expect(requestBtn).toHaveAttribute('aria-busy', 'false');
      expect(requestBtn).toHaveAttribute('aria-disabled', 'true');
      expect(requestBtn).not.toContainHTML('spinner');
      expect(
        fetchMock.calls(
          `/api/referralanswervalidationrequests/?answer=${answer.id}&limit=999`,
        ).length,
      ).toEqual(2);
    });

    it('shows an error message when the user clicks on the button without typing a validator name', async () => {
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

      render(
        <IntlProvider locale="en">
          <ShowAnswerFormContext.Provider
            value={{ showAnswerForm: null, setShowAnswerForm: jest.fn() }}
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

      // The Validations component is displayed, with no existing validations
      screen.getByRole('heading', { name: 'Validations' });
      screen.getByText('No validations have been requested yet.');
      // The form to add a validator is displayed as the user is part of the unit
      screen.getByRole('form', { name: 'Add validations for this answer' });
      screen.getByRole('textbox', {
        name: 'Start typing a validator name',
      });
      const requestBtn = screen.getByRole('button', {
        name: 'Request a validation',
      });
      // User clicks on the button to add validators
      userEvent.click(requestBtn);
      // NB: for some reason testing library does not find the message in this div
      const errorMessage = screen.getByRole('alert');
      expect(errorMessage.innerHTML).toEqual(
        'Select a validator using the search box before attempting to request a validation.',
      );
    });

    it('shows an error message when the validation request fails to be created', async () => {
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

      render(
        <IntlProvider locale="en">
          <ShowAnswerFormContext.Provider
            value={{ showAnswerForm: null, setShowAnswerForm: jest.fn() }}
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

      // The Validations component is displayed, with no existing validations
      screen.getByRole('heading', { name: 'Validations' });
      screen.getByText('No validations have been requested yet.');
      // The form to add a validator is displayed as the user is part of the unit
      screen.getByRole('form', { name: 'Add validations for this answer' });
      const input = screen.getByRole('textbox', {
        name: 'Start typing a validator name',
      });
      const requestBtn = screen.getByRole('button', {
        name: 'Request a validation',
      });
      // User opens the validator search combobox
      userEvent.click(input);
      const response = {
        count: 2,
        next: null,
        previous: null,
        results: [georgesAbitbol, georgesHenri],
      };
      // User starts typing the name of a validator
      const usersLiteDeferred1 = new Deferred();
      fetchMock.get(
        '/api/users/?limit=999&query=G',
        usersLiteDeferred1.promise,
      );
      userEvent.type(input, 'G');
      expect(fetchMock.calls('/api/users/?limit=999&query=G').length).toEqual(
        1,
      );
      await act(async () => usersLiteDeferred1.resolve(response));
      const abitbolOption = screen.getByRole('option', {
        name: 'Georges Abitbol',
      });
      screen.getByRole('option', { name: 'Georges Henri' });
      // User picks a validator and attempts adds them
      const addValidatorDeferred = new Deferred();
      fetchMock.post(
        `/api/referrals/${referral.id}/request_answer_validation/`,
        addValidatorDeferred.promise,
      );
      userEvent.click(abitbolOption);
      userEvent.click(requestBtn);
      expect(
        fetchMock.calls(
          `/api/referrals/${referral.id}/request_answer_validation/`,
        ).length,
      ).toEqual(1);

      await act(async () => addValidatorDeferred.resolve(500));
      expect(
        fetchMock.calls(
          `/api/referralanswervalidationrequests/?answer=${answer.id}&limit=999`,
        ).length,
      ).toEqual(2);
      // NB: for some reason testing library does not find the message in this div
      const errorMessage = screen.getByRole('alert');
      expect(errorMessage.innerHTML).toEqual(
        'Something went wrong, the validation could not be requested.',
      );
    });

    it('shows the validations component but not the form when it is not possible to add validations', async () => {
      const user = factories.UserFactory.generate();
      const referral: types.Referral = factories.ReferralFactory.generate();
      referral.topic.unit.members[1] = user;
      const answer: types.ReferralAnswer = factories.ReferralAnswerFactory.generate();
      answer.created_by = referral.topic.unit.members[0];
      referral.answers = [answer];
      referral.state = types.ReferralState.ANSWERED;

      const validationRequestsDeferred = new Deferred();
      fetchMock.get(
        `/api/referralanswervalidationrequests/?answer=${answer.id}&limit=999`,
        validationRequestsDeferred.promise,
      );

      const answersDeferred = new Deferred();
      fetchMock.post(`/api/referralanswers/`, answersDeferred.promise);

      render(
        <IntlProvider locale="en">
          <ShowAnswerFormContext.Provider
            value={{ showAnswerForm: null, setShowAnswerForm: jest.fn() }}
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

      screen.getByRole('status', { name: 'Loading answer validations...' });

      const validationRequests = factories.ReferralAnswerValidationRequestFactory.generate(
        3,
      );
      validationRequests[1].response = factories.ReferralAnswerValidationResponseFactory.generate();
      validationRequests[1].response.state =
        types.ReferralAnswerValidationResponseState.VALIDATED;
      validationRequests[1].response.comment = 'Response #1 comment';
      validationRequests[2].response = factories.ReferralAnswerValidationResponseFactory.generate();
      validationRequests[2].response.state =
        types.ReferralAnswerValidationResponseState.NOT_VALIDATED;
      validationRequests[2].response.comment = 'Response #2 comment';
      await act(async () =>
        validationRequestsDeferred.resolve({
          count: 3,
          next: null,
          previous: null,
          results: validationRequests,
        }),
      );
      expect(
        screen.queryByRole('status', { name: 'Loading answer validations...' }),
      ).toBeNull();

      // The Validations component is displayed, without the form
      screen.getByRole('heading', { name: 'Validations' });
      expect(
        screen.queryByRole('form', { name: 'Add validations for this answer' }),
      ).toBeNull();
      // Existing validations are shown
      screen.getByRole('list', { name: 'Validations' });
      screen.getByText(
        `${getUserFullname(
          validationRequests[0].validator,
        )} has not validated this answer yet`,
      );
      screen.getByText(
        `${getUserFullname(
          validationRequests[1].validator,
        )} validated this answer`,
      );
      screen.getByText('Response #1 comment');
      screen.getByText(
        `${getUserFullname(
          validationRequests[2].validator,
        )} requested changes to this answer`,
      );
      screen.getByText('Response #2 comment');
    });

    it('does not show the validations component to the referral linked user', async () => {
      const user = factories.UserFactory.generate();
      const referral: types.Referral = factories.ReferralFactory.generate();
      const answer: types.ReferralAnswer = factories.ReferralAnswerFactory.generate();
      answer.created_by = referral.topic.unit.members[0];
      referral.answers = [answer];
      referral.state = types.ReferralState.ASSIGNED;

      fetchMock.get(
        `/api/referralanswervalidationrequests/?answer=${answer.id}&limit=999`,
        {},
      );

      const answersDeferred = new Deferred();
      fetchMock.post(`/api/referralanswers/`, answersDeferred.promise);

      render(
        <IntlProvider locale="en">
          <ShowAnswerFormContext.Provider
            value={{ showAnswerForm: null, setShowAnswerForm: jest.fn() }}
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
      expect(
        fetchMock.calls(
          `/api/referralanswervalidationrequests/?answer=${answer.id}&limit=999`,
        ).length,
      ).toEqual(0);
      expect(screen.queryByRole('heading', { name: 'Validations' })).toBeNull();
    });

    it('includes a form for the validator where they can validate the answer', async () => {
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

      render(
        <IntlProvider locale="en">
          <ShowAnswerFormContext.Provider
            value={{ showAnswerForm: null, setShowAnswerForm: jest.fn() }}
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

      const validationRequest = factories.ReferralAnswerValidationRequestFactory.generate();
      validationRequest.validator = pick(user, [
        'first_name',
        'id',
        'last_name',
      ]);
      await act(async () =>
        validationRequestsDeferred.resolve({
          count: 1,
          next: null,
          previous: null,
          results: [validationRequest],
        }),
      );

      // The Validations component is displayed, with no existing validations
      screen.getByRole('heading', { name: 'Validations' });
      screen.getByText(
        `${getUserFullname(user)} has not validated this answer yet`,
      );
      // The user was asked to validate, they should see the validation form
      screen.getByRole('form', { name: 'Validate this answer' });
      const approveRadio = screen.getByRole('radio', {
        name: 'Validate the draft',
      });
      screen.getByRole('radio', { name: 'Request changes' });
      const textbox = screen.getByRole('textbox', {
        name: 'Validation comment (optional)',
      });
      const btn = screen.getByRole('button', { name: 'Validate' });

      const deferred = new Deferred();
      fetchMock.post(
        `/api/referrals/${referral.id}/perform_answer_validation/`,
        deferred.promise,
      );
      // The validator fills out the form, approving the answer
      userEvent.click(approveRadio);
      userEvent.click(textbox);
      userEvent.type(textbox, 'Some review comment');
      userEvent.click(btn);
      // The button goes through a loading state
      expect(btn).toHaveAttribute('aria-busy', 'true');
      expect(btn).toHaveAttribute('aria-disabled', 'true');
      expect(btn).toContainHTML('spinner');
      expect(
        fetchMock.calls(
          `/api/referrals/${referral.id}/perform_answer_validation/`,
          {
            method: 'POST',
            body: {
              validation_request: validationRequest.id,
              comment: 'Some review comment',
              state: types.ReferralAnswerValidationResponseState.VALIDATED,
            },
          },
        ).length,
      ).toEqual(1);

      const validationRequestsDeferred2 = new Deferred();
      fetchMock.get(
        `/api/referralanswervalidationrequests/?answer=${answer.id}&limit=999`,
        validationRequestsDeferred2.promise,
        { overwriteRoutes: true },
      );

      await act(async () => deferred.resolve({}));
      expect(btn).toHaveAttribute('aria-busy', 'false');
      expect(btn).toHaveAttribute('aria-disabled', 'false');
      expect(btn).not.toContainHTML('spinner');

      await act(async () =>
        validationRequestsDeferred2.resolve({
          count: 1,
          next: null,
          previous: null,
          results: [
            {
              ...validationRequest,
              response: {
                comment: 'Some review comment',
                id: '64d4ea5f-e368-4db3-80a4-501423e98a1e',
                state: types.ReferralAnswerValidationResponseState.VALIDATED,
              },
            },
          ],
        }),
      );
      screen.getByText(`${getUserFullname(user)} validated this answer`);
      screen.getByText('Some review comment');
    });

    it('includes a form for the validator where they can request changes for the answer', async () => {
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

      render(
        <IntlProvider locale="en">
          <ShowAnswerFormContext.Provider
            value={{ showAnswerForm: null, setShowAnswerForm: jest.fn() }}
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

      const validationRequest = factories.ReferralAnswerValidationRequestFactory.generate();
      validationRequest.validator = pick(user, [
        'first_name',
        'id',
        'last_name',
      ]);
      await act(async () =>
        validationRequestsDeferred.resolve({
          count: 1,
          next: null,
          previous: null,
          results: [validationRequest],
        }),
      );

      // The Validations component is displayed, with no existing validations
      screen.getByRole('heading', { name: 'Validations' });
      screen.getByText(
        `${getUserFullname(user)} has not validated this answer yet`,
      );
      // The user was asked to validate, they should see the validation form
      screen.getByRole('form', { name: 'Validate this answer' });
      screen.getByRole('radio', {
        name: 'Validate the draft',
      });
      const denyRadio = screen.getByRole('radio', { name: 'Request changes' });
      const textbox = screen.getByRole('textbox', {
        name: 'Validation comment (optional)',
      });
      const btn = screen.getByRole('button', { name: 'Validate' });

      const deferred = new Deferred();
      fetchMock.post(
        `/api/referrals/${referral.id}/perform_answer_validation/`,
        deferred.promise,
      );
      // The validator fills out the form, approving the answer
      userEvent.click(denyRadio);
      userEvent.click(textbox);
      userEvent.type(textbox, 'Some review comment');
      userEvent.click(btn);
      // The button goes through a loading state
      expect(btn).toHaveAttribute('aria-busy', 'true');
      expect(btn).toHaveAttribute('aria-disabled', 'true');
      expect(btn).toContainHTML('spinner');
      expect(
        fetchMock.calls(
          `/api/referrals/${referral.id}/perform_answer_validation/`,
          {
            method: 'POST',
            body: {
              validation_request: validationRequest.id,
              comment: 'Some review comment',
              state: types.ReferralAnswerValidationResponseState.NOT_VALIDATED,
            },
          },
        ).length,
      ).toEqual(1);

      const validationRequestsDeferred2 = new Deferred();
      fetchMock.get(
        `/api/referralanswervalidationrequests/?answer=${answer.id}&limit=999`,
        validationRequestsDeferred2.promise,
        { overwriteRoutes: true },
      );

      await act(async () => deferred.resolve({}));
      expect(btn).toHaveAttribute('aria-busy', 'false');
      expect(btn).toHaveAttribute('aria-disabled', 'false');
      expect(btn).not.toContainHTML('spinner');

      await act(async () =>
        validationRequestsDeferred2.resolve({
          count: 1,
          next: null,
          previous: null,
          results: [
            {
              ...validationRequest,
              response: {
                comment: 'Some review comment',
                id: '64d4ea5f-e368-4db3-80a4-501423e98a1e',
                state:
                  types.ReferralAnswerValidationResponseState.NOT_VALIDATED,
              },
            },
          ],
        }),
      );
      screen.getByText(
        `${getUserFullname(user)} requested changes to this answer`,
      );
      screen.getByText('Some review comment');
    });

    it('shows an error message when the validation cannot be performed', async () => {
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

      render(
        <IntlProvider locale="en">
          <ShowAnswerFormContext.Provider
            value={{ showAnswerForm: null, setShowAnswerForm: jest.fn() }}
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

      const validationRequest = factories.ReferralAnswerValidationRequestFactory.generate();
      validationRequest.validator = pick(user, [
        'first_name',
        'id',
        'last_name',
      ]);
      await act(async () =>
        validationRequestsDeferred.resolve({
          count: 1,
          next: null,
          previous: null,
          results: [validationRequest],
        }),
      );

      // The Validations component is displayed, with no existing validations
      screen.getByRole('heading', { name: 'Validations' });
      screen.getByText(
        `${getUserFullname(user)} has not validated this answer yet`,
      );
      // The user was asked to validate, they should see the validation form
      screen.getByRole('form', { name: 'Validate this answer' });
      const approveRadio = screen.getByRole('radio', {
        name: 'Validate the draft',
      });
      screen.getByRole('radio', { name: 'Request changes' });
      const textbox = screen.getByRole('textbox', {
        name: 'Validation comment (optional)',
      });
      const btn = screen.getByRole('button', { name: 'Validate' });
      expect(screen.queryByRole('alert')).toBeNull();

      const deferred = new Deferred();
      fetchMock.post(
        `/api/referrals/${referral.id}/perform_answer_validation/`,
        deferred.promise,
      );
      // The validator fills out the form, approving the answer
      userEvent.click(approveRadio);
      userEvent.click(textbox);
      userEvent.type(textbox, 'Some review comment');
      userEvent.click(btn);
      // The button goes through a loading state
      expect(btn).toHaveAttribute('aria-busy', 'true');
      expect(btn).toHaveAttribute('aria-disabled', 'true');
      expect(btn).toContainHTML('spinner');
      expect(
        fetchMock.calls(
          `/api/referrals/${referral.id}/perform_answer_validation/`,
          {
            method: 'POST',
            body: {
              validation_request: validationRequest.id,
              comment: 'Some review comment',
              state: types.ReferralAnswerValidationResponseState.VALIDATED,
            },
          },
        ).length,
      ).toEqual(1);

      await act(async () => deferred.resolve(500));
      expect(btn).toHaveAttribute('aria-busy', 'false');
      expect(btn).toHaveAttribute('aria-disabled', 'false');
      expect(btn).not.toContainHTML('spinner');

      const errorMessage = screen.getByRole('alert');
      expect(errorMessage).toContainHTML(
        'Something went wrong. Failed to send your validation review.',
      );
    });
  });
});
