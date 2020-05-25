import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import React from 'react';
import { IntlProvider } from 'react-intl';

import { Referral, ReferralState } from 'types';
import { ContextProps } from 'types/context';
import { Deferred } from 'utils/test/Deferred';
import {
  ReferralAnswerFactory,
  ReferralFactory,
  UserFactory,
} from 'utils/test/factories';
import { ReferralDetailAnswerForm } from '.';
import { CurrentUserContext } from 'data/useCurrentUser';

describe('<ReferralDetailAnswerForm />', () => {
  const context: ContextProps['context'] = {
    assets: { icons: 'icons.svg' },
    csrftoken: 'the csrf token',
  };

  it('shows a form where the user can answer the referral', async () => {
    const referral = ReferralFactory.generate();
    const setReferral = jest.fn();

    const user = UserFactory.generate();

    const deferred = new Deferred<Referral>();
    fetchMock.post(`/api/referrals/${referral.id}/answer/`, deferred.promise);

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
    userEvent.type(
      textbox,
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
    );
    userEvent.click(button);

    expect(
      fetchMock.called(`/api/referrals/${referral.id}/answer/`, {
        body: {
          content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
        },
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': 'the csrf token',
        },
        method: 'POST',
      }),
    ).toEqual(true);

    const updatedReferral = {
      ...referral,
      answers: [
        {
          ...ReferralAnswerFactory.generate(),
          referral: referral.id,
        },
      ],
      state: ReferralState.ANSWERED,
    };
    await act(async () => deferred.resolve(updatedReferral));

    expect(setReferral).toHaveBeenCalledWith(updatedReferral);
  });
});
