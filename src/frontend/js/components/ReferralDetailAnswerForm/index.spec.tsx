import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { IntlProvider } from 'react-intl';

import { CurrentUserContext } from 'data/useCurrentUser';
import { Referral, ReferralState } from 'types';
import { Context } from 'types/context';
import { sendForm } from 'utils/sendForm';
import { Deferred } from 'utils/test/Deferred';
import * as factories from 'utils/test/factories';
import { ReferralDetailAnswerForm } from '.';

jest.mock('utils/sendForm', () => ({
  sendForm: jest.fn(),
}));

const mockSendForm: jest.Mock<typeof sendForm> = sendForm as any;

describe('<ReferralDetailAnswerForm />', () => {
  const context: Context = {
    assets: { icons: 'icons.svg' },
    csrftoken: 'the csrf token',
    environment: 'test',
    sentry_dsn: 'https://sentry.dsn/0',
    token: 'the auth token',
  };

  xit('shows a form where the user can answer the referral', async () => {
    const referral = factories.ReferralFactory.generate();
    const setReferral = jest.fn();

    const user = factories.UserFactory.generate();

    const deferred = new Deferred<Referral>();
    mockSendForm.mockReturnValue(deferred.promise as any);

    render(
      <IntlProvider locale="en">
        <CurrentUserContext.Provider value={{ currentUser: user }}>
          <ReferralDetailAnswerForm
            context={context}
            referral={referral}
            setReferral={setReferral}
          />
        </CurrentUserContext.Provider>
      </IntlProvider>,
    );

    // The answer form is displayed
    screen.getByRole('form', { name: 'Referral answer' });
    const textbox = screen.getByRole('textbox', {
      name: 'Add an answer for this referral',
    });
    const button = screen.getByRole('button', { name: 'Answer the referral' });

    // User types their response and clicks the button
    await userEvent.type(
      textbox,
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
    );
    userEvent.click(button);

    expect(mockSendForm).toHaveBeenCalledWith({
      headers: { Authorization: 'Token the auth token' },
      keyValuePairs: [
        ['content', 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.'],
      ],
      setProgress: jasmine.any(Function),
      url: `/api/referrals/${referral.id}/draft_answer/`,
    });

    const setProgress = mockSendForm.mock.calls[0][0].setProgress;
    act(() => setProgress(44));
    screen.getByRole('button', { name: 'Sending answer... 44%' });
    act(() => setProgress(62));
    screen.getByRole('button', { name: 'Sending answer... 62%' });

    const updatedReferral = {
      ...referral,
      answers: [
        {
          ...factories.ReferralAnswerFactory.generate(),
          referral: referral.id,
        },
      ],
      state: ReferralState.ANSWERED,
    };
    await act(async () => deferred.resolve(updatedReferral));

    expect(setReferral).toHaveBeenCalledWith(updatedReferral);
  });
});
