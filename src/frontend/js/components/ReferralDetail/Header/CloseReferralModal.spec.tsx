import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import React from 'react';
import { IntlProvider } from 'react-intl';
import { QueryClient, QueryClientProvider } from 'react-query';

import * as types from 'types';
import { Deferred } from 'utils/test/Deferred';
import * as factories from 'utils/test/factories';
import { CloseReferralModal } from './CloseReferralModal';
import { appData } from 'appData';

jest.spyOn(console, 'error').mockImplementation(() => {});

describe('<CloseReferralModal />', () => {
  beforeEach(() => fetchMock.restore());

  it('renders a form that allows users to close the referral', async () => {
    const queryClient = new QueryClient();
    const setIsCloseReferralModalOpen = jest.fn();

    const referral: types.Referral = factories.ReferralFactory.generate();

    const closeReferralDeferred = new Deferred();

    fetchMock.post(
      `/api/referrals/${referral.id}/close_referral/`,
      closeReferralDeferred.promise,
    );

    render(
      <IntlProvider locale="en">
        <QueryClientProvider client={queryClient}>
          <CloseReferralModal
            referral={referral}
            isCloseReferralModalOpen={true}
            setIsCloseReferralModalOpen={setIsCloseReferralModalOpen}
          />
        </QueryClientProvider>
      </IntlProvider>,
    );

    screen.getByRole('form', { name: 'Close the referral' });

    const textbox = screen.getByRole('textbox', {
      name: 'Closure explanation',
    });

    const cancelBtn = screen.getByRole('button', { name: 'Cancel' });
    const updateBtn = screen.getByRole('button', { name: 'Close referral' });

    // We click on the cancel button but the modal is not closed as it's just a stub
    userEvent.click(cancelBtn);
    expect(setIsCloseReferralModalOpen).toHaveBeenCalledWith(false);
    setIsCloseReferralModalOpen.mockReset();

    // User forgets to fill the explanation field, gets an error message
    userEvent.click(updateBtn);
    expect(
      fetchMock.called(`/api/referrals/${referral.id}/close_referral/`, {
        method: 'POST',
      }),
    ).toBe(false);
    screen.getByText('An explanation is required when closing a referral.');

    // Form is complete, action is submitted to the server
    userEvent.type(textbox, 'Some good reason');
    userEvent.click(updateBtn);
    await waitFor(() => {
      expect(
        fetchMock.called(`/api/referrals/${referral.id}/close_referral/`, {
          method: 'POST',
          body: {
            close_explanation: 'Some good reason',
          },
        }),
      ).toBe(true);
    });

    await act(async () => closeReferralDeferred.resolve(true));
    expect(setIsCloseReferralModalOpen).toHaveBeenCalledWith(false);
  });

  it('shows an error message when it fails to close the referral', async () => {
    const queryClient = new QueryClient();
    const setIsCloseReferralModalOpen = jest.fn();

    const referral: types.Referral = factories.ReferralFactory.generate();

    const closeReferralDeferred = new Deferred();

    fetchMock.post(
      `/api/referrals/${referral.id}/close_referral/`,
      closeReferralDeferred.promise,
    );

    render(
      <IntlProvider locale="en">
        <QueryClientProvider client={queryClient}>
          <CloseReferralModal
            referral={referral}
            isCloseReferralModalOpen={true}
            setIsCloseReferralModalOpen={setIsCloseReferralModalOpen}
          />
        </QueryClientProvider>
      </IntlProvider>,
    );

    screen.getByRole('form', { name: 'Close the referral' });

    const textbox = screen.getByRole('textbox', {
      name: 'Closure explanation',
    });

    const cancelBtn = screen.getByRole('button', { name: 'Cancel' });
    const updateBtn = screen.getByRole('button', { name: 'Close referral' });

    // Form is complete, action is submitted to the server
    userEvent.type(textbox, 'Some good reason');
    userEvent.click(updateBtn);
    await waitFor(() => {
      expect(
        fetchMock.called(`/api/referrals/${referral.id}/close_referral/`, {
          method: 'POST',
          body: {
            close_explanation: 'Some good reason',
          },
        }),
      ).toBe(true);
    });

    await act(async () => closeReferralDeferred.resolve(403));
    expect(setIsCloseReferralModalOpen).not.toHaveBeenCalled();
    screen.getByText(
      `There was an error while updating the referral. Please retry later or contact an administrator at ${appData.contact_email}.`,
    );
  });
});
