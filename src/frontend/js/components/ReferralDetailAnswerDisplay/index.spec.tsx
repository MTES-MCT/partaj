import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import filesize from 'filesize';
import React from 'react';
import { IntlProvider } from 'react-intl';
import { QueryClient, QueryClientProvider } from 'react-query';
import { MemoryRouter, Route, useLocation } from 'react-router-dom';

import { CurrentUserContext } from 'data/useCurrentUser';
import * as types from 'types';
import { Deferred } from 'utils/test/Deferred';
import * as factories from 'utils/test/factories';
import { ReferralDetailAnswerDisplay } from '.';

describe('<ReferralDetailAnswerDisplay />', () => {
  const size = filesize.partial({ locale: 'en-US' });

  const LocationDisplay = () => {
    const location = useLocation();
    return <div data-testid="location-display">{location.pathname}</div>;
  };

  afterEach(() => fetchMock.restore());

  it('shows the published answer to the referral', async () => {
    const queryClient = new QueryClient();
    // Create a referral and force a unit member's name
    const referral: types.Referral = factories.ReferralFactory.generate();
    referral.units[0].members[0].first_name = 'Wang';
    referral.units[0].members[0].last_name = 'Miao';
    // Add an answer authored by our chosen unit member
    const answer: types.ReferralAnswer = factories.ReferralAnswerFactory.generate();
    answer.created_by = referral.units[0].members[0];
    answer.content = 'The answer content';
    answer.state = types.ReferralAnswerState.PUBLISHED;

    render(
      <MemoryRouter>
        <IntlProvider locale="en">
          <QueryClientProvider client={queryClient}>
            <ReferralDetailAnswerDisplay
              answer={answer}
              referral={{
                ...referral,
                answers: [answer],
                state: types.ReferralState.ANSWERED,
              }}
            />
          </QueryClientProvider>
        </IntlProvider>
      </MemoryRouter>,
    );

    screen.getByRole('article', { name: 'Referral answer' });
    screen.getByText(`By Wang Miao, ${referral.units[0].name}`);
    screen.getByText('The answer content');
    screen.getByRole('heading', { name: 'Attachments' });
    screen.getByRole('group', { name: 'Attachments' });
    for (let attachment of answer.attachments) {
      screen.getByRole('link', {
        name: `${attachment.name_with_extension} — ${size(attachment.size)}`,
      });
    }

    expect(screen.queryByRole('button', { name: 'Modify' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Revise' })).toBeNull();
    expect(
      screen.queryByRole('button', { name: 'Send to requester' }),
    ).toBeNull();
  });

  it('shows a button to revise the answer when revision is possible', async () => {
    const queryClient = new QueryClient();
    // The current user is allowed to revise the answer and it is not published yet
    const user = factories.UserFactory.generate();
    const referral: types.Referral = factories.ReferralFactory.generate();
    referral.units[0].members[1] = user;
    const answer: types.ReferralAnswer = factories.ReferralAnswerFactory.generate();
    answer.created_by = referral.units[0].members[0];
    referral.answers = [answer];
    referral.state = types.ReferralState.ASSIGNED;

    const answersDeferred = new Deferred();
    fetchMock.post(`/api/referralanswers/`, answersDeferred.promise);

    render(
      <MemoryRouter
        initialEntries={[
          `/app/referral-detail/${referral.id}/draft-answers/${answer.id}`,
        ]}
      >
        <IntlProvider locale="en">
          <QueryClientProvider client={queryClient}>
            <CurrentUserContext.Provider value={{ currentUser: user }}>
              <Route path={'*'}>
                <ReferralDetailAnswerDisplay
                  answer={answer}
                  referral={referral}
                />
              </Route>
              <LocationDisplay />
            </CurrentUserContext.Provider>
          </QueryClientProvider>
        </IntlProvider>
      </MemoryRouter>,
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
    expect(
      fetchMock.calls('/api/referralanswers/', {
        headers: { Authorization: 'Token the bearer token' },
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
    // The revision is created, we should be navigating to the form
    expect(screen.getByTestId('location-display')).toHaveTextContent(
      `/app/referral-detail/${referral.id}/draft-answers/157f38f3-85a5-47b7-9c90-511fb4b440c2/form`,
    );
  });

  it('shows an error message when it fails to create a revision for the answer', async () => {
    const queryClient = new QueryClient();
    // The current user is allowed to revise the answer and it is not published yet
    const user = factories.UserFactory.generate();
    const referral: types.Referral = factories.ReferralFactory.generate();
    referral.units[0].members[1] = user;
    const answer: types.ReferralAnswer = factories.ReferralAnswerFactory.generate();
    answer.created_by = referral.units[0].members[0];
    referral.answers = [answer];
    referral.state = types.ReferralState.ASSIGNED;

    const deferred = new Deferred();
    fetchMock.post(`/api/referralanswers/`, deferred.promise);

    render(
      <MemoryRouter>
        <IntlProvider locale="en">
          <QueryClientProvider client={queryClient}>
            <CurrentUserContext.Provider value={{ currentUser: user }}>
              <ReferralDetailAnswerDisplay
                answer={answer}
                referral={referral}
              />
            </CurrentUserContext.Provider>
          </QueryClientProvider>
        </IntlProvider>
      </MemoryRouter>,
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
    // TODO: add back a way to display this error
  });

  it('shows a button to modify the answer when modification is possible', () => {
    const queryClient = new QueryClient();
    // The current user is allowed to revise the answer and it is not published yet
    const referral: types.Referral = factories.ReferralFactory.generate();
    const answer: types.ReferralAnswer = factories.ReferralAnswerFactory.generate();
    answer.created_by = referral.units[0].members[0];

    render(
      <MemoryRouter
        initialEntries={[
          `/app/referral-detail/${referral.id}/draft-answers/${answer.id}`,
        ]}
      >
        <IntlProvider locale="en">
          <QueryClientProvider client={queryClient}>
            <CurrentUserContext.Provider
              value={{ currentUser: referral.units[0].members[0] }}
            >
              <Route path={'*'}>
                <ReferralDetailAnswerDisplay
                  answer={answer}
                  referral={{
                    ...referral,
                    answers: [answer],
                    state: types.ReferralState.ASSIGNED,
                  }}
                />
              </Route>
              <LocationDisplay />
            </CurrentUserContext.Provider>
          </QueryClientProvider>
        </IntlProvider>
      </MemoryRouter>,
    );

    screen.getByRole('article', { name: 'Referral answer draft' });
    const dropdownButton = screen.getByRole('button', { name: 'More options' });
    userEvent.click(dropdownButton);
    screen.getByRole('button', { name: 'Revise' });
    const button = screen.getByRole('button', { name: 'Modify' });

    userEvent.click(button);
    expect(screen.getByTestId('location-display')).toHaveTextContent(
      `/app/referral-detail/${referral.id}/draft-answers/${answer.id}/form`,
    );
  });

  it('shows a button to publish the answer when publication is possible', async () => {
    const queryClient = new QueryClient();
    // The current user is allowed to publish the answer and it is not published yet
    const referral: types.Referral = factories.ReferralFactory.generate();
    const answer: types.ReferralAnswer = factories.ReferralAnswerFactory.generate();
    answer.created_by = referral.units[0].members[0];

    const deferred = new Deferred();
    fetchMock.post(
      `/api/referrals/${referral.id}/publish_answer/`,
      deferred.promise,
    );

    const { rerender } = render(
      <MemoryRouter>
        <IntlProvider locale="en">
          <QueryClientProvider client={queryClient}>
            <CurrentUserContext.Provider
              value={{ currentUser: referral.units[0].members[0] }}
            >
              <ReferralDetailAnswerDisplay
                answer={answer}
                referral={{
                  ...referral,
                  answers: [answer],
                  state: types.ReferralState.ASSIGNED,
                }}
              />
            </CurrentUserContext.Provider>
          </QueryClientProvider>
        </IntlProvider>
      </MemoryRouter>,
    );

    screen.getByRole('article', { name: 'Referral answer draft' });
    const dropdownButton = screen.getByRole('button', { name: 'More options' });
    userEvent.click(dropdownButton);
    // Open the modal and inspect its contents
    const openModalButton = screen.getByRole('button', {
      name: 'Answer the referral',
    });
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
      userEvent.click(dropdownButton);
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
        headers: { Authorization: 'Token the bearer token' },
        method: 'POST',
      }).length,
    ).toEqual(1);

    const updatedReferral = {
      ...referral,
      state: types.ReferralState.ANSWERED,
    };
    await act(async () => deferred.resolve(updatedReferral));

    rerender(
      <MemoryRouter>
        <IntlProvider locale="en">
          <QueryClientProvider client={queryClient}>
            <CurrentUserContext.Provider
              value={{ currentUser: referral.units[0].members[0] }}
            >
              <ReferralDetailAnswerDisplay
                answer={answer}
                referral={updatedReferral}
              />
            </CurrentUserContext.Provider>
          </QueryClientProvider>
        </IntlProvider>
      </MemoryRouter>,
    );

    expect(
      screen.queryByRole('button', { name: 'Send to requester' }),
    ).toBeNull();
  });

  it('shows an error message when it fails to publish the answer', async () => {
    const queryClient = new QueryClient();
    const referral: types.Referral = factories.ReferralFactory.generate();
    const answer: types.ReferralAnswer = factories.ReferralAnswerFactory.generate();
    answer.created_by = referral.units[0].members[0];

    const deferred = new Deferred();
    fetchMock.post(
      `/api/referrals/${referral.id}/publish_answer/`,
      deferred.promise,
    );

    render(
      <MemoryRouter>
        <IntlProvider locale="en">
          <QueryClientProvider client={queryClient}>
            <CurrentUserContext.Provider
              value={{ currentUser: referral.units[0].members[0] }}
            >
              <ReferralDetailAnswerDisplay
                answer={answer}
                referral={{
                  ...referral,
                  answers: [answer],
                  state: types.ReferralState.ASSIGNED,
                }}
              />
            </CurrentUserContext.Provider>
          </QueryClientProvider>
        </IntlProvider>
      </MemoryRouter>,
    );

    screen.getByRole('article', { name: 'Referral answer draft' });
    const dropdownButton = screen.getByRole('button', { name: 'More options' });
    userEvent.click(dropdownButton);
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
        headers: { Authorization: 'Token the bearer token' },
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
