import { act, render, screen } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import React from 'react';
import { IntlProvider } from 'react-intl';
import { QueryClient, QueryClientProvider } from 'react-query';
import { MemoryRouter } from 'react-router-dom';

import { CurrentUserContext } from 'data/useCurrentUser';
import * as types from 'types';
import * as factories from 'utils/test/factories';
import { Deferred } from 'utils/test/Deferred';
import userEvent from '@testing-library/user-event';
import { getUserFullname } from 'utils/user';
import { ReferralAnswerValidationsList } from '.';

describe('<ReferralAnswerValidationsList />', () => {
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

  afterEach(() => fetchMock.restore());

  it('shows a form that allows unit members to request validations when it is possible', async () => {
    const queryClient = new QueryClient();
    const user = factories.UserFactory.generate();
    const referral: types.Referral = factories.ReferralFactory.generate();
    referral.units[0].members[1] = user;
    const answer: types.ReferralAnswer = factories.ReferralAnswerFactory.generate();
    answer.created_by = referral.units[0].members[0];
    referral.answers = [answer];
    referral.state = types.ReferralState.PROCESSING;

    const validationRequestsDeferred = new Deferred();
    fetchMock.get(
      `/api/referralanswervalidationrequests/?answer=${answer.id}&limit=999`,
      validationRequestsDeferred.promise,
    );

    const answersDeferred = new Deferred();
    fetchMock.post(`/api/referralanswers/`, answersDeferred.promise);

    render(
      <MemoryRouter>
        <IntlProvider locale="en">
          <QueryClientProvider client={queryClient}>
            <CurrentUserContext.Provider value={{ currentUser: user }}>
              <ReferralAnswerValidationsList
                answerId={answer.id}
                referral={referral}
              />
            </CurrentUserContext.Provider>
          </QueryClientProvider>
        </IntlProvider>
      </MemoryRouter>,
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
    screen.getByRole('table', { name: 'Validations' });
    screen.getByRole('cell', {
      name: 'No validations have been requested yet.',
    });
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
    fetchMock.get('/api/users/?limit=999&query=G', usersLiteDeferred1.promise);
    userEvent.type(input, 'G');
    expect(fetchMock.calls('/api/users/?limit=999&query=G').length).toEqual(1);
    await act(async () => usersLiteDeferred1.resolve(response));
    screen.getByRole('option', { name: 'Georges Abitbol' });
    screen.getByRole('option', { name: 'Georges Henri' });
    // User types one more letter in the name of a validator
    const usersLiteDeferred2 = new Deferred();
    fetchMock.get('/api/users/?limit=999&query=Ge', usersLiteDeferred2.promise);
    userEvent.type(input, 'e');
    expect(fetchMock.calls('/api/users/?limit=999&query=Ge').length).toEqual(1);
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
    ).toEqual(3);
  });

  it('shows an error message when the user clicks on the button without typing a validator name', async () => {
    const queryClient = new QueryClient();
    const user = factories.UserFactory.generate();
    const referral: types.Referral = factories.ReferralFactory.generate();
    referral.units[0].members[1] = user;
    const answer: types.ReferralAnswer = factories.ReferralAnswerFactory.generate();
    answer.created_by = referral.units[0].members[0];
    referral.answers = [answer];
    referral.state = types.ReferralState.PROCESSING;

    const validationRequestsDeferred = new Deferred();
    fetchMock.get(
      `/api/referralanswervalidationrequests/?answer=${answer.id}&limit=999`,
      validationRequestsDeferred.promise,
    );

    const answersDeferred = new Deferred();
    fetchMock.post(`/api/referralanswers/`, answersDeferred.promise);

    render(
      <MemoryRouter>
        <IntlProvider locale="en">
          <QueryClientProvider client={queryClient}>
            <CurrentUserContext.Provider value={{ currentUser: user }}>
              <ReferralAnswerValidationsList
                answerId={answer.id}
                referral={referral}
              />
            </CurrentUserContext.Provider>
          </QueryClientProvider>
        </IntlProvider>
      </MemoryRouter>,
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
    screen.getByRole('table', { name: 'Validations' });
    screen.getByRole('cell', {
      name: 'No validations have been requested yet.',
    });
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
    const queryClient = new QueryClient();
    const user = factories.UserFactory.generate();
    const referral: types.Referral = factories.ReferralFactory.generate();
    referral.units[0].members[1] = user;
    const answer: types.ReferralAnswer = factories.ReferralAnswerFactory.generate();
    answer.created_by = referral.units[0].members[0];
    referral.answers = [answer];
    referral.state = types.ReferralState.PROCESSING;

    const validationRequestsDeferred = new Deferred();
    fetchMock.get(
      `/api/referralanswervalidationrequests/?answer=${answer.id}&limit=999`,
      validationRequestsDeferred.promise,
    );

    const answersDeferred = new Deferred();
    fetchMock.post(`/api/referralanswers/`, answersDeferred.promise);

    render(
      <MemoryRouter>
        <IntlProvider locale="en">
          <QueryClientProvider client={queryClient}>
            <CurrentUserContext.Provider value={{ currentUser: user }}>
              <ReferralAnswerValidationsList
                answerId={answer.id}
                referral={referral}
              />
            </CurrentUserContext.Provider>
          </QueryClientProvider>
        </IntlProvider>
      </MemoryRouter>,
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
    screen.getByRole('table', { name: 'Validations' });
    screen.getByRole('cell', {
      name: 'No validations have been requested yet.',
    });
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
    fetchMock.get('/api/users/?limit=999&query=G', usersLiteDeferred1.promise);
    userEvent.type(input, 'G');
    expect(fetchMock.calls('/api/users/?limit=999&query=G').length).toEqual(1);
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

  it('shows the validations list but not the form when it is not possible to add validations', async () => {
    const queryClient = new QueryClient();
    const user = factories.UserFactory.generate();
    const referral: types.Referral = factories.ReferralFactory.generate();
    referral.units[0].members[1] = user;
    const answer: types.ReferralAnswer = factories.ReferralAnswerFactory.generate();
    answer.created_by = referral.units[0].members[0];
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
      <MemoryRouter>
        <IntlProvider locale="en">
          <QueryClientProvider client={queryClient}>
            <CurrentUserContext.Provider value={{ currentUser: user }}>
              <ReferralAnswerValidationsList
                answerId={answer.id}
                referral={referral}
              />
            </CurrentUserContext.Provider>
          </QueryClientProvider>
        </IntlProvider>
      </MemoryRouter>,
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
    expect(
      screen.queryByRole('form', { name: 'Add validations for this answer' }),
    ).toBeNull();
    // Existing validations are shown
    screen.getByRole('table', { name: 'Validations' });
    const row1 = screen.getByRole('row', {
      name: (name) =>
        name.includes(getUserFullname(validationRequests[0].validator)),
    });
    expect(row1).toContainHTML('Pending');
    const row2 = screen.getByRole('row', {
      name: (name) =>
        name.includes(getUserFullname(validationRequests[1].validator)),
    });
    expect(row2).toContainHTML('Validated');
    expect(row2).toContainHTML('Response #1 comment');
    const row3 = screen.getByRole('row', {
      name: (name) =>
        name.includes(getUserFullname(validationRequests[2].validator)),
    });
    expect(row3).toContainHTML('Changes requested');
    expect(row3).toContainHTML('Response #2 comment');
  });
});
