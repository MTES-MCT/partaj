import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import filesize from 'filesize';
import React from 'react';
import { IntlProvider } from 'react-intl';

import { ShowAnswerFormContext } from 'components/ReferralDetail';
import { Referral } from 'types';
import { Deferred } from 'utils/test/Deferred';
import { ReferralFactory } from 'utils/test/factories';
import { getUserFullname } from 'utils/user';
import { ReferralDetailContent } from '.';

describe('<ReferralDetailContent />', () => {
  const setReferral = jest.fn();

  const size = filesize.partial({ locale: 'en-US' });

  afterEach(() => fetchMock.restore());

  it('displays the referral content assignment info and a button to answer it', async () => {
    // Enable fake timers to control polling in the waiting state
    jest.useFakeTimers();

    const deferred = new Deferred();
    fetchMock.post('/api/referralanswers/', deferred.promise);

    const referral: Referral = ReferralFactory.generate();
    const setShowAnswerForm = jest.fn();
    const { rerender } = render(
      <ShowAnswerFormContext.Provider
        value={{ showAnswerForm: null, setShowAnswerForm }}
      >
        <IntlProvider locale="en">
          <ReferralDetailContent {...{ referral, setReferral }} />
        </IntlProvider>
      </ShowAnswerFormContext.Provider>,
    );

    screen.getByRole('article', {
      name: `Referral #${referral.id}`,
    });

    screen.getByRole('heading', { name: 'Requester' });
    screen.getByText(`Official requester: ${referral.requester}`);
    screen.getByText(
      `As ${getUserFullname(referral.user)}, ${referral.user.unit_name}`,
    );
    screen.getByText(referral.user.email);
    screen.getByText(referral.user.phone_number);

    screen.getByRole('heading', { name: 'Referral topic' });
    screen.getByText(referral.topic.name);

    screen.getByRole('heading', { name: 'Referral object' });
    screen.getByText(referral.object);

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

    // Shows assignment information
    screen.getByText('No assignment yet');

    // Shows the answer button to create a draft
    const answerToggle = screen.getByRole('button', {
      name: 'Create an answer draft',
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
    expect(setShowAnswerForm).toHaveBeenCalledWith(
      'ded80ba0-a122-4c66-b54b-c9f988973d0e',
    );
    expect(answerToggle).toHaveAttribute('aria-disabled', 'true');
    expect(answerToggle).toHaveAttribute('aria-busy', 'true');
    expect(answerToggle).toContainHTML('spinner');

    rerender(
      <ShowAnswerFormContext.Provider
        value={{ showAnswerForm: null, setShowAnswerForm }}
      >
        <IntlProvider locale="en">
          <ReferralDetailContent {...{ referral, setReferral }} />
          <div id="answer-ded80ba0-a122-4c66-b54b-c9f988973d0e-form" />
        </IntlProvider>
      </ShowAnswerFormContext.Provider>,
    );

    await act(async () => {
      jest.advanceTimersByTime(101);
    });

    expect(answerToggle).toHaveAttribute('aria-disabled', 'false');
    expect(answerToggle).toHaveAttribute('aria-busy', 'false');
    expect(answerToggle).not.toContainHTML('spinner');
  });

  it('displays an error message when it fails to create a new referral answer', async () => {
    const deferred = new Deferred();
    fetchMock.post('/api/referralanswers/', deferred.promise);

    const referral: Referral = ReferralFactory.generate();
    const setShowAnswerForm = jest.fn();
    render(
      <ShowAnswerFormContext.Provider
        value={{ showAnswerForm: null, setShowAnswerForm }}
      >
        <IntlProvider locale="en">
          <ReferralDetailContent {...{ referral, setReferral }} />
        </IntlProvider>
      </ShowAnswerFormContext.Provider>,
    );

    const answerToggle = screen.getByRole('button', {
      name: 'Create an answer draft',
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
    screen.getByText('Failed to create a new answer draft');
  });
});
