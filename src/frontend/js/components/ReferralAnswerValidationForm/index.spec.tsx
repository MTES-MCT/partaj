import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import { pick } from 'lodash-es';
import React from 'react';
import { IntlProvider } from 'react-intl';
import { QueryClient, QueryClientProvider } from 'react-query';
import { MemoryRouter, Route, useLocation } from 'react-router-dom';

import { CurrentUserContext } from 'data/useCurrentUser';
import * as types from 'types';
import { Deferred } from 'utils/test/Deferred';
import * as factories from 'utils/test/factories';
import { ReferralAnswerValidationForm } from '.';

describe('<ReferralAnswerValidationForm />', () => {
  const LocationDisplay = () => {
    const location = useLocation();
    return <div data-testid="location-display">{location.pathname}</div>;
  };

  afterEach(() => fetchMock.restore());

  it('includes a form where the validator can validate the answer', async () => {
    const queryClient = new QueryClient();
    const user = factories.UserFactory.generate();
    const referral: types.Referral = factories.ReferralFactory.generate();
    referral.units[0].members[1] = user;
    const answer: types.ReferralAnswer = factories.ReferralAnswerFactory.generate();
    answer.created_by = referral.units[0].members[0];
    referral.answers = [answer];
    referral.state = types.ReferralState.IN_VALIDATION;

    const validationRequest = factories.ReferralAnswerValidationRequestFactory.generate();
    validationRequest.validator = pick(user, ['first_name', 'id', 'last_name']);

    const validationRequestsDeferred = new Deferred();
    fetchMock.get(
      `/api/referralanswervalidationrequests/?answer=${answer.id}&limit=999`,
      validationRequestsDeferred.promise,
    );

    const answersDeferred = new Deferred();
    fetchMock.post(`/api/referralanswers/`, answersDeferred.promise);

    render(
      <MemoryRouter
        initialEntries={[
          `/unit/${referral.units[0].id}/referral-detail/${referral.id}/draft-answers/${answer.id}/validation/${validationRequest.id}`,
        ]}
      >
        <IntlProvider locale="en">
          <QueryClientProvider client={queryClient}>
            <CurrentUserContext.Provider value={{ currentUser: user }}>
              <Route
                path={
                  '/unit/:unitId/referral-detail/:referralId/draft-answers/:answerId/validation/:validationRequestId'
                }
              >
                <ReferralAnswerValidationForm referral={referral} />
              </Route>
              <LocationDisplay />
            </CurrentUserContext.Provider>
          </QueryClientProvider>
        </IntlProvider>
      </MemoryRouter>,
    );

    await act(async () =>
      validationRequestsDeferred.resolve({
        count: 1,
        next: null,
        previous: null,
        results: [validationRequest],
      }),
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

    await act(async () => deferred.resolve({}));
    expect(screen.getByTestId('location-display')).toHaveTextContent(
      `/unit/${referral.units[0].id}/referral-detail/${referral.id}/draft-answers/${answer.id}`,
    );
  });

  it('includes a form for the validator where they can request changes for the answer', async () => {
    const queryClient = new QueryClient();
    const user = factories.UserFactory.generate();
    const referral: types.Referral = factories.ReferralFactory.generate();
    referral.units[0].members[1] = user;
    const answer: types.ReferralAnswer = factories.ReferralAnswerFactory.generate();
    answer.created_by = referral.units[0].members[0];
    referral.answers = [answer];
    referral.state = types.ReferralState.IN_VALIDATION;

    const validationRequest = factories.ReferralAnswerValidationRequestFactory.generate();
    validationRequest.validator = pick(user, ['first_name', 'id', 'last_name']);

    const validationRequestsDeferred = new Deferred();
    fetchMock.get(
      `/api/referralanswervalidationrequests/?answer=${answer.id}&limit=999`,
      validationRequestsDeferred.promise,
    );

    const answersDeferred = new Deferred();
    fetchMock.post(`/api/referralanswers/`, answersDeferred.promise);

    render(
      <MemoryRouter
        initialEntries={[
          `/unit/${referral.units[0].id}/referral-detail/${referral.id}/draft-answers/${answer.id}/validation/${validationRequest.id}`,
        ]}
      >
        <IntlProvider locale="en">
          <QueryClientProvider client={queryClient}>
            <CurrentUserContext.Provider value={{ currentUser: user }}>
              <Route
                path={
                  '/unit/:unitId/referral-detail/:referralId/draft-answers/:answerId/validation/:validationRequestId'
                }
              >
                <ReferralAnswerValidationForm referral={referral} />
              </Route>
              <LocationDisplay />
            </CurrentUserContext.Provider>
          </QueryClientProvider>
        </IntlProvider>
      </MemoryRouter>,
    );

    await act(async () =>
      validationRequestsDeferred.resolve({
        count: 1,
        next: null,
        previous: null,
        results: [validationRequest],
      }),
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

    await act(async () => deferred.resolve({}));
    expect(screen.getByTestId('location-display')).toHaveTextContent(
      `/unit/${referral.units[0].id}/referral-detail/${referral.id}/draft-answers/${answer.id}`,
    );
  });

  it('includes a form for the validator even if they are not a member of the unit', async () => {
    const queryClient = new QueryClient();
    const user = factories.UserFactory.generate();
    const referral: types.Referral = factories.ReferralFactory.generate();
    const answer: types.ReferralAnswer = factories.ReferralAnswerFactory.generate();
    answer.created_by = referral.units[0].members[0];
    referral.answers = [answer];
    referral.state = types.ReferralState.IN_VALIDATION;

    const validationRequest = factories.ReferralAnswerValidationRequestFactory.generate();
    validationRequest.validator = pick(user, ['first_name', 'id', 'last_name']);

    const validationRequestsDeferred = new Deferred();
    fetchMock.get(
      `/api/referralanswervalidationrequests/?answer=${answer.id}&limit=999`,
      validationRequestsDeferred.promise,
    );

    const answersDeferred = new Deferred();
    fetchMock.post(`/api/referralanswers/`, answersDeferred.promise);

    render(
      <MemoryRouter
        initialEntries={[
          `/unit/${referral.units[0].id}/referral-detail/${referral.id}/draft-answers/${answer.id}/validation/${validationRequest.id}`,
        ]}
      >
        <IntlProvider locale="en">
          <QueryClientProvider client={queryClient}>
            <CurrentUserContext.Provider value={{ currentUser: user }}>
              <Route
                path={
                  '/unit/:unitId/referral-detail/:referralId/draft-answers/:answerId/validation/:validationRequestId'
                }
              >
                <ReferralAnswerValidationForm referral={referral} />
              </Route>
              <LocationDisplay />
            </CurrentUserContext.Provider>
          </QueryClientProvider>
        </IntlProvider>
      </MemoryRouter>,
    );

    await act(async () =>
      validationRequestsDeferred.resolve({
        count: 1,
        next: null,
        previous: null,
        results: [validationRequest],
      }),
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

    await act(async () => deferred.resolve({}));
    expect(screen.getByTestId('location-display')).toHaveTextContent(
      `/unit/${referral.units[0].id}/referral-detail/${referral.id}/draft-answers/${answer.id}`,
    );
  });

  it('shows an error message when the validation cannot be performed', async () => {
    const queryClient = new QueryClient();
    const user = factories.UserFactory.generate();
    const referral: types.Referral = factories.ReferralFactory.generate();
    referral.units[0].members[1] = user;
    const answer: types.ReferralAnswer = factories.ReferralAnswerFactory.generate();
    answer.created_by = referral.units[0].members[0];
    referral.answers = [answer];
    referral.state = types.ReferralState.IN_VALIDATION;

    const validationRequest = factories.ReferralAnswerValidationRequestFactory.generate();
    validationRequest.validator = pick(user, ['first_name', 'id', 'last_name']);

    const validationRequestsDeferred = new Deferred();
    fetchMock.get(
      `/api/referralanswervalidationrequests/?answer=${answer.id}&limit=999`,
      validationRequestsDeferred.promise,
    );

    const answersDeferred = new Deferred();
    fetchMock.post(`/api/referralanswers/`, answersDeferred.promise);

    render(
      <MemoryRouter
        initialEntries={[
          `/unit/${referral.units[0].id}/referral-detail/${referral.id}/draft-answers/${answer.id}/validation/${validationRequest.id}`,
        ]}
      >
        <IntlProvider locale="en">
          <QueryClientProvider client={queryClient}>
            <CurrentUserContext.Provider value={{ currentUser: user }}>
              <Route
                path={
                  '/unit/:unitId/referral-detail/:referralId/draft-answers/:answerId/validation/:validationRequestId'
                }
              >
                <ReferralAnswerValidationForm referral={referral} />
              </Route>
              <LocationDisplay />
            </CurrentUserContext.Provider>
          </QueryClientProvider>
        </IntlProvider>
      </MemoryRouter>,
    );

    await act(async () =>
      validationRequestsDeferred.resolve({
        count: 1,
        next: null,
        previous: null,
        results: [validationRequest],
      }),
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
