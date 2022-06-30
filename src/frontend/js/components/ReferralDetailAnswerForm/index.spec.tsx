import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { IntlProvider } from 'react-intl';
import { QueryClient, QueryClientProvider } from 'react-query';

import { CurrentUserContext } from 'data/useCurrentUser';
import { Referral, ReferralState } from 'types';
import { sendForm } from 'utils/sendForm';
import { Deferred } from 'utils/test/Deferred';
import * as factories from 'utils/test/factories';
import { ReferralDetailAnswerForm } from '.';

jest.mock('utils/sendForm', () => ({
  sendForm: jest.fn(),
}));

const mockSendForm: jest.Mock<typeof sendForm> = sendForm as any;

describe('<ReferralDetailAnswerForm2 />', () => {
  xit('shows a form where the user can answer the referral', async () => {
    const referral = factories.ReferralFactory.generate();
    const answer = factories.ReferralAnswerFactory.generate();
    const user = factories.UserFactory.generate();

    const deferred = new Deferred<Referral>();
    mockSendForm.mockReturnValue(deferred.promise as any);

    const queryClient = new QueryClient();
    jest.spyOn(queryClient, 'invalidateQueries');

    render(
      <IntlProvider locale="en">
        <QueryClientProvider client={queryClient}>
          <CurrentUserContext.Provider value={{ currentUser: user }}>
            <ReferralDetailAnswerForm
              {...{
                answerId: 'd2acc338-6777-47c7-85dd-0e9c46323b5b',
                referral,
              }}
            />
          </CurrentUserContext.Provider>
        </QueryClientProvider>
      </IntlProvider>,
    );

    // The answer form is displayed
    screen.getByRole('form', { name: 'Referral answer' });
    const textbox = screen.getByRole('textbox', {
      name: 'Add an answer for this referral',
    });
    const button = screen.getByRole('button', { name: 'Answer the referral' });

    // User types their response and clicks the button
    const actualEditable = textbox.querySelector('[contenteditable="true"]')!;
    userEvent.click(actualEditable);
    await userEvent.type(
      actualEditable,
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

    expect(queryClient.invalidateQueries).toHaveBeenCalledWith(['referrals']);
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith([
      'referralanswers',
    ]);
  });
});
