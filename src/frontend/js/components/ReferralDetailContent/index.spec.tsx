import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import filesize from 'filesize';
import React from 'react';
import { IntlProvider } from 'react-intl';
import { MemoryRouter, Route, useLocation } from 'react-router-dom';

import { Referral } from 'types';
import { Deferred } from 'utils/test/Deferred';
import { ReferralFactory } from 'utils/test/factories';
import { ReferralDetailContent } from '.';

describe('<ReferralDetailContent />', () => {
  const size = filesize.partial({ locale: 'en-US' });

  const LocationDisplay = () => {
    const location = useLocation();
    return <div data-testid="location-display">{location.pathname}</div>;
  };

  afterEach(() => fetchMock.restore());

  it('displays the referral content and a button to answer it', async () => {
    // Enable fake timers to control polling in the waiting state
    jest.useFakeTimers();

    const deferred = new Deferred();
    fetchMock.post('/api/referralanswers/', deferred.promise);

    const referral: Referral = ReferralFactory.generate();
    const { rerender } = render(
      <MemoryRouter
        initialEntries={[`/app/referral-detail/${referral.id}/content`]}
      >
        <IntlProvider locale="en">
          <Route path={'*'}>
            <ReferralDetailContent {...{ referral }} />
          </Route>
        </IntlProvider>
        <LocationDisplay />
      </MemoryRouter>,
    );

    screen.getByRole('article', { name: referral.object });

    screen.getByRole('heading', { name: 'Requester' });
    screen.getByText(referral.requester);
    screen.getByText(referral.user.email);
    screen.getByText(referral.user.phone_number);

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
          <ReferralDetailContent {...{ referral }} />
        </IntlProvider>
      </MemoryRouter>,
    );
  });

  it('displays an error message when it fails to create a new referral answer', async () => {
    const deferred = new Deferred();
    fetchMock.post('/api/referralanswers/', deferred.promise);

    const referral: Referral = ReferralFactory.generate();
    const setShowAnswerForm = jest.fn();
    render(
      <MemoryRouter>
        <IntlProvider locale="en">
          <ReferralDetailContent {...{ referral }} />
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
});
