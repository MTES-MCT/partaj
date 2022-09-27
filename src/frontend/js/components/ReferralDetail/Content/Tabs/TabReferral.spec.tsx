import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CurrentUserContext } from 'data/useCurrentUser';
import fetchMock from 'fetch-mock';
import filesize from 'filesize';
import React from 'react';
import { IntlProvider } from 'react-intl';
import { QueryClient, QueryClientProvider } from 'react-query';
import { MemoryRouter, Route, useLocation } from 'react-router-dom';

import * as types from 'types';
import { Deferred } from 'utils/test/Deferred';
import * as factories from 'utils/test/factories';
import { TabReferral } from './TabReferral';

describe('<TabReferral />', () => {
  const size = filesize.partial({ locale: 'en-US' });

  const LocationDisplay = () => {
    const location = useLocation();
    return <div data-testid="location-display">{location.pathname}</div>;
  };

  afterEach(() => fetchMock.restore());

  it('displays the referral content and a button to answer it', async () => {
    // Enable fake timers to control polling in the waiting state
    jest.useFakeTimers();

    const queryClient = new QueryClient();
    const deferred = new Deferred();
    fetchMock.post('/api/referralanswers/', deferred.promise);

    const user: types.UnitMember = factories.UnitMemberFactory.generate();
    const referral: types.Referral = factories.ReferralFactory.generate();
    referral.units[0].members.push(user);

    const { rerender } = render(
      <MemoryRouter
        initialEntries={[`/app/referral-detail/${referral.id}/content`]}
      >
        <IntlProvider locale="en">
          <QueryClientProvider client={queryClient}>
            <CurrentUserContext.Provider value={{ currentUser: user }}>
              <Route path={'*'}>
                <TabReferral {...{ referral }} />
              </Route>
            </CurrentUserContext.Provider>
          </QueryClientProvider>
        </IntlProvider>
        <LocationDisplay />
      </MemoryRouter>,
    );

    screen.getByRole('article', { name: referral.object });
    screen.getByRole('heading', { name: 'Referral topic' });
    screen.getByText(referral.topic.name);

    screen.getByRole('heading', { name: 'Referral question' });
    screen.getByText((element) =>
      element.startsWith(referral.question.substr(0, 20)),
    );

    screen.getByRole('heading', { name: 'Context' });
    screen.getByText((element) =>
      element.startsWith(referral.context.substr(0, 20)),
    );

    screen.getByRole('heading', { name: 'Prior work' });
    screen.getByText((element) =>
      element.startsWith(referral.prior_work.substr(0, 20)),
    );

    screen.getByRole('heading', { name: 'Expected response time' });
    screen.getByText(referral.urgency_level.name);

    screen.getByRole('heading', { name: 'Urgency explanation' });
    screen.getByText(referral.urgency_explanation);

    screen.getByRole('heading', { name: 'Attachments' });
    screen.getByRole('group', { name: 'Attachments' });
    for (let attachment of referral.attachments) {
      screen.getByRole('link', {
        name: `${attachment.name_with_extension} — ${size(attachment.size)}`,
      });
    }

    // Shows the answer button to create a draft
    const answerToggle = screen.getByRole('button', {
      name: 'Create a draft answer',
    });
    userEvent.click(answerToggle);

    // The request to create an answer draft is in progress
    expect(
      fetchMock.calls(`/api/referralanswers/`, {
        body: { referral: referral.id },
        headers: { Authorization: 'Token the bearer token' },
        method: 'POST',
      }).length,
    ).toEqual(1);
    expect(answerToggle).toHaveAttribute('aria-disabled', 'true');
    expect(answerToggle).toHaveAttribute('aria-busy', 'true');
    expect(answerToggle).toContainHTML('spinner');

    await act(async () =>
      deferred.resolve({ id: 'ded80ba0-a122-4c66-b54b-c9f988973d0e' }),
    );
    await act(async () => {
      jest.advanceTimersByTime(101);
    });

    // The draft is created, we'll be showing the form, the button should be back to rest
    expect(screen.getByTestId('location-display')).toHaveTextContent(
      `/app/referral-detail/${referral.id}/draft-answers/ded80ba0-a122-4c66-b54b-c9f988973d0e/form`,
    );
    expect(answerToggle).toHaveAttribute('aria-disabled', 'false');
    expect(answerToggle).toHaveAttribute('aria-busy', 'false');
    expect(answerToggle).not.toContainHTML('spinner');

    rerender(
      <MemoryRouter>
        <IntlProvider locale="en">
          <QueryClientProvider client={queryClient}>
            <TabReferral {...{ referral }} />
          </QueryClientProvider>
        </IntlProvider>
      </MemoryRouter>,
    );
  });

  it('displays an error message when it fails to create a new referral answer', async () => {
    const queryClient = new QueryClient();
    const deferred = new Deferred();
    fetchMock.post('/api/referralanswers/', deferred.promise);

    const user: types.UnitMember = factories.UnitMemberFactory.generate();
    const referral: types.Referral = factories.ReferralFactory.generate();
    referral.units[0].members.push(user);

    const setShowAnswerForm = jest.fn();
    render(
      <MemoryRouter>
        <IntlProvider locale="en">
          <QueryClientProvider client={queryClient}>
            <CurrentUserContext.Provider value={{ currentUser: user }}>
              <TabReferral {...{ referral }} />
            </CurrentUserContext.Provider>
          </QueryClientProvider>
        </IntlProvider>
      </MemoryRouter>,
    );

    const answerToggle = screen.getByRole('button', {
      name: 'Create a draft answer',
    });
    userEvent.click(answerToggle);

    // The request to create an answer draft is in progress
    expect(
      fetchMock.calls(`/api/referralanswers/`, {
        body: { referral: referral.id },
        headers: { Authorization: 'Token the bearer token' },
        method: 'POST',
      }).length,
    ).toEqual(1);
    expect(answerToggle).toHaveAttribute('aria-disabled', 'true');
    expect(answerToggle).toHaveAttribute('aria-busy', 'true');
    expect(answerToggle).toContainHTML('spinner');

    await act(async () => deferred.resolve(400));

    // We failed to create the draft. We're showing an error message, the button is back to rest
    expect(setShowAnswerForm).not.toHaveBeenCalled();
    expect(answerToggle).toHaveAttribute('aria-disabled', 'false');
    expect(answerToggle).toHaveAttribute('aria-busy', 'false');
    expect(answerToggle).not.toContainHTML('spinner');
  });

  it('does not show the answer button if the user is not a member of a linked unit', () => {
    const queryClient = new QueryClient();
    const deferred = new Deferred();
    fetchMock.post('/api/referralanswers/', deferred.promise);

    const user: types.UnitMember = factories.UnitMemberFactory.generate();
    const referral: types.Referral = factories.ReferralFactory.generate();

    render(
      <MemoryRouter>
        <IntlProvider locale="en">
          <QueryClientProvider client={queryClient}>
            <CurrentUserContext.Provider value={{ currentUser: user }}>
              <TabReferral {...{ referral }} />
            </CurrentUserContext.Provider>
          </QueryClientProvider>
        </IntlProvider>
      </MemoryRouter>,
    );

    expect(
      screen.queryByRole('button', {
        name: 'Create a draft answer',
      }),
    ).toBeNull();
  });
});
