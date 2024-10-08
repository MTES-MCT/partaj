import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import React from 'react';
import { IntlProvider } from 'react-intl';
import { QueryClient, QueryClientProvider } from 'react-query';

import * as types from 'types';
import { Deferred } from 'utils/test/Deferred';
import * as factories from 'utils/test/factories';
import { ChangeUrgencyLevelModal } from './ChangeUrgencyLevelModal';

jest.spyOn(console, 'error').mockImplementation(() => {});

const urgencyLevelsResponse = {
  count: 4,
  next: null,
  previous: null,
  results: [
    {
      id: '3',
      name: 'Absolute emergency — 24 hours',
      duration: '1 00:00:00',
      index: 3,
      requires_justification: true,
    },
    {
      id: '2',
      name: 'Extremely urgent — 3 days',
      duration: '3 00:00:00',
      index: 2,
      requires_justification: true,
    },
    {
      id: '1',
      name: 'Urgent — 1 week',
      duration: '7 00:00:00',
      index: 1,
      requires_justification: true,
    },
    {
      id: '4',
      name: '3 weeks',
      duration: '21 00:00:00',
      index: 0,
      requires_justification: false,
    },
  ],
};

describe('<ChangeUrgencyLevelModal />', () => {
  beforeEach(() => fetchMock.restore());

  it('renders a form that allows users to change the urgency level', async () => {
    const queryClient = new QueryClient();
    const setIsChangeUrgencyLevelModalOpen = jest.fn();

    const referral: types.Referral = factories.ReferralFactory.generate();
    const [
      firstUrgencyLevel,
      ...otherUrgencyLevels
    ] = urgencyLevelsResponse.results;
    referral.urgency_level = firstUrgencyLevel;

    const getUrgencyLevelsDeferred = new Deferred();
    const updateUrgencyLevelDeferred = new Deferred();

    fetchMock.get(
      '/api/urgencies/?limit=999',
      getUrgencyLevelsDeferred.promise,
    );
    fetchMock.post(
      `/api/referrals/${referral.id}/change_urgencylevel/`,
      updateUrgencyLevelDeferred.promise,
    );

    render(
      <IntlProvider locale="en">
        <QueryClientProvider client={queryClient}>
          <ChangeUrgencyLevelModal
            referral={referral}
            isChangeUrgencyLevelModalOpen={true}
            setIsChangeUrgencyLevelModalOpen={setIsChangeUrgencyLevelModalOpen}
          />
        </QueryClientProvider>
      </IntlProvider>,
    );

    screen.getByRole('status');

    await act(async () =>
      getUrgencyLevelsDeferred.resolve(urgencyLevelsResponse),
    );

    screen.getByRole('form', { name: "Change the referral's urgency level." });
    const combobox = screen.getByRole('combobox', {
      name: 'Expected response time',
    });
    expect(
      screen.queryByRole('option', { name: firstUrgencyLevel.name }),
    ).toBeNull();
    for (const urgency of otherUrgencyLevels) {
      screen.getByRole('option', { name: urgency.name });
    }
    const textbox = screen.getByRole('textbox', { name: 'Change explanation' });

    const cancelBtn = screen.getByRole('button', { name: 'Cancel' });
    const updateBtn = screen.getByRole('button', { name: 'Update referral' });

    // We click on the cancel button but the modal is not closed as it's just a stub
    userEvent.click(cancelBtn);
    expect(setIsChangeUrgencyLevelModalOpen).toHaveBeenCalledWith(false);
    setIsChangeUrgencyLevelModalOpen.mockReset();

    userEvent.selectOptions(
      combobox,
      String(urgencyLevelsResponse.results[1].id),
    );

    // User forgets to fill the explanation field, gets an error message
    userEvent.click(updateBtn);
    expect(
      fetchMock.called(`/api/referrals/${referral.id}/change_urgencylevel/`, {
        method: 'POST',
      }),
    ).toBe(false);
    screen.getByText('Urgency level changes require an explanation.');

    // Form is complete, action is submitted to the server
    userEvent.type(textbox, 'Some good reason');
    userEvent.click(updateBtn);
    await waitFor(() => {
      expect(
        fetchMock.called(`/api/referrals/${referral.id}/change_urgencylevel/`, {
          method: 'POST',
          body: {
            urgencylevel: String(urgencyLevelsResponse.results[1].id),
            urgencylevel_explanation: 'Some good reason',
          },
        }),
      ).toBe(true);
    });

    await act(async () => updateUrgencyLevelDeferred.resolve(true));
    expect(setIsChangeUrgencyLevelModalOpen).toHaveBeenCalledWith(false);
  });

  it('shows an error message when it fails to perform the urgency level change', async () => {
    const queryClient = new QueryClient();
    const setIsChangeUrgencyLevelModalOpen = jest.fn();

    const referral: types.Referral = factories.ReferralFactory.generate();
    const [
      firstUrgencyLevel,
      ...otherUrgencyLevels
    ] = urgencyLevelsResponse.results;
    referral.urgency_level = firstUrgencyLevel;

    const getUrgencyLevelsDeferred = new Deferred();
    const updateUrgencyLevelDeferred = new Deferred();

    fetchMock.get(
      '/api/urgencies/?limit=999',
      getUrgencyLevelsDeferred.promise,
    );
    fetchMock.post(
      `/api/referrals/${referral.id}/change_urgencylevel/`,
      updateUrgencyLevelDeferred.promise,
    );

    render(
      <IntlProvider locale="en">
        <QueryClientProvider client={queryClient}>
          <ChangeUrgencyLevelModal
            referral={referral}
            isChangeUrgencyLevelModalOpen={true}
            setIsChangeUrgencyLevelModalOpen={setIsChangeUrgencyLevelModalOpen}
          />
        </QueryClientProvider>
      </IntlProvider>,
    );

    screen.getByRole('status');

    await act(async () =>
      getUrgencyLevelsDeferred.resolve(urgencyLevelsResponse),
    );

    screen.getByRole('form', { name: "Change the referral's urgency level." });
    const combobox = screen.getByRole('combobox', {
      name: 'Expected response time',
    });
    expect(
      screen.queryByRole('option', { name: firstUrgencyLevel.name }),
    ).toBeNull();
    for (const urgency of otherUrgencyLevels) {
      screen.getByRole('option', { name: urgency.name });
    }
    const textbox = screen.getByRole('textbox', { name: 'Change explanation' });

    screen.getByRole('button', { name: 'Cancel' });
    const updateBtn = screen.getByRole('button', { name: 'Update referral' });

    userEvent.selectOptions(
      combobox,
      String(urgencyLevelsResponse.results[1].id),
    );
    userEvent.type(textbox, 'Some good reason');
    userEvent.click(updateBtn);
    await waitFor(() => {
      expect(
        fetchMock.called(`/api/referrals/${referral.id}/change_urgencylevel/`, {
          method: 'POST',
          body: {
            urgencylevel: String(urgencyLevelsResponse.results[1].id),
            urgencylevel_explanation: 'Some good reason',
          },
        }),
      ).toBe(true);
    });

    await act(async () => updateUrgencyLevelDeferred.resolve(403));
    expect(setIsChangeUrgencyLevelModalOpen).not.toHaveBeenCalled();
    screen.getByText(
      'There was an error while updating the referral. Please retry later or contact an administrator.',
    );
  });

  it('shows an error message when it fails to load available urgency levels', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    const setIsChangeUrgencyLevelModalOpen = jest.fn();

    const referral: types.Referral = factories.ReferralFactory.generate();
    referral.urgency_level = urgencyLevelsResponse.results[0];

    const getUrgencyLevelsDeferred = new Deferred();

    fetchMock.get(
      '/api/urgencies/?limit=999',
      getUrgencyLevelsDeferred.promise,
    );

    render(
      <IntlProvider locale="en">
        <QueryClientProvider client={queryClient}>
          <ChangeUrgencyLevelModal
            referral={referral}
            isChangeUrgencyLevelModalOpen={true}
            setIsChangeUrgencyLevelModalOpen={setIsChangeUrgencyLevelModalOpen}
          />
        </QueryClientProvider>
      </IntlProvider>,
    );

    screen.getByRole('status');

    await act(async () => getUrgencyLevelsDeferred.resolve(500));
    await waitFor(() => {
      screen.getByText((string) => string.startsWith('There was an error'));
    });
  });
});
