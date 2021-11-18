import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import fetchMock from 'fetch-mock';
import React from 'react';
import { IntlProvider } from 'react-intl';
import { QueryClient, QueryClientProvider } from 'react-query';

import * as types from 'types';
import { Unit } from 'components/Unit';
import { Deferred } from 'utils/test/Deferred';
import * as factories from 'utils/test/factories';
import { AssignUnitModal } from './AssignUnitModal';

jest.spyOn(console, 'error').mockImplementation(() => {});

describe('<AssignUnitModal />', () => {
  beforeEach(() => fetchMock.restore());

  it('renders a form that allows users to assign a referral to another unit', async () => {
    const queryClient = new QueryClient();
    const setIsAssignUnitModalOpen = jest.fn();
    const setIsKeepDropdownMenu = jest.fn();

    const referral: types.Referral = factories.ReferralFactory.generate();
    const unit: types.Unit = factories.UnitFactory.generate();

    const AssignUnitDeferred = new Deferred();

    fetchMock.post(
      `/api/referrals/${referral.id}/assign_unit/`,
      AssignUnitDeferred.promise,
    );

    render(
      <IntlProvider locale="en">
        <QueryClientProvider client={queryClient}>
          <AssignUnitModal
            referral={referral}
            isAssignUnitModalOpen={true}
            setIsAssignUnitModalOpen={setIsAssignUnitModalOpen}
            unit={unit}
            setIsKeepDropdownMenu={setIsKeepDropdownMenu}
          />
        </QueryClientProvider>
      </IntlProvider>,
    );

    screen.getByRole('form', { name: 'New unit assignment' });

    const textbox = screen.getByRole('textbox', {
      name: 'Assignment explanation',
    });

    const cancelBtn = screen.getByRole('button', { name: 'Cancel' });
    const updateBtn = screen.getByRole('button', { name: 'Assign unit' });

    // We click on the cancel button but the modal is not closed as it's just a stub
    userEvent.click(cancelBtn);
    expect(setIsAssignUnitModalOpen).toHaveBeenCalledWith(false);
    setIsAssignUnitModalOpen.mockReset();

    // User forgets to fill the explanation field, gets an error message
    userEvent.click(updateBtn);
    expect(
      fetchMock.called(`/api/referrals/${referral.id}/assign_unit/`, {
        method: 'POST',
        body: {
          unit: unit.id,
        },
      }),
    ).toBe(false);
    screen.getByText('An explanation is required when assigning a unit.');

    // Form is complete, action is submitted to the server
    userEvent.type(textbox, 'Some good reason');
    userEvent.click(updateBtn);
    await waitFor(() => {
      expect(
        fetchMock.called(`/api/referrals/${referral.id}/assign_unit/`, {
          method: 'POST',
          body: {
            assignunit_explanation: 'Some good reason',
            unit: unit.id,
          },
        }),
      ).toBe(true);
    });

    await act(async () => AssignUnitDeferred.resolve(true));
    expect(setIsKeepDropdownMenu).toHaveBeenCalledWith(false);
    expect(setIsAssignUnitModalOpen).toHaveBeenCalledWith(false);
  });

  it('shows an error message when the new unit assignment is not created', async () => {
    const queryClient = new QueryClient();
    const setIsAssignUnitModalOpen = jest.fn();
    const setIsKeepDropdownMenu = jest.fn();

    const referral: types.Referral = factories.ReferralFactory.generate();
    const unit: types.Unit = factories.UnitFactory.generate();

    const AssignUnitDeferred = new Deferred();

    fetchMock.post(
      `/api/referrals/${referral.id}/assign_unit/`,
      AssignUnitDeferred.promise,
    );

    render(
      <IntlProvider locale="en">
        <QueryClientProvider client={queryClient}>
          <AssignUnitModal
            referral={referral}
            isAssignUnitModalOpen={true}
            setIsAssignUnitModalOpen={setIsAssignUnitModalOpen}
            unit={unit}
            setIsKeepDropdownMenu={setIsKeepDropdownMenu}
          />
        </QueryClientProvider>
      </IntlProvider>,
    );

    screen.getByRole('form', { name: 'New unit assignment' });

    const textbox = screen.getByRole('textbox', {
      name: 'Assignment explanation',
    });

    const cancelBtn = screen.getByRole('button', { name: 'Cancel' });
    const updateBtn = screen.getByRole('button', { name: 'Assign unit' });

    // We click on the cancel button but the modal is not closed as it's just a stub
    userEvent.click(cancelBtn);
    expect(setIsAssignUnitModalOpen).toHaveBeenCalledWith(false);
    setIsAssignUnitModalOpen.mockReset();

    // Form is complete, action is submitted to the server
    userEvent.type(textbox, 'Some good reason');
    userEvent.click(updateBtn);
    await waitFor(() => {
      expect(
        fetchMock.called(`/api/referrals/${referral.id}/assign_unit/`, {
          method: 'POST',
          body: {
            assignunit_explanation: 'Some good reason',
            unit: unit.id,
          },
        }),
      ).toBe(true);
    });

    await act(async () => AssignUnitDeferred.resolve(403));
    expect(setIsAssignUnitModalOpen).not.toHaveBeenCalled();
    expect(setIsAssignUnitModalOpen).not.toHaveBeenCalled();
    screen.getByText(
      'There was an error while updating the referral. Please retry later or contact an administrator.',
    );
  });
});
