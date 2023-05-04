import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import React from 'react';
import { IntlProvider } from 'react-intl';
import { QueryClient, QueryClientProvider } from 'react-query';

import { CurrentUserContext } from 'data/useCurrentUser';
import { Referral, ReferralState, Unit, UnitMembershipRole } from 'types';
import { Deferred } from 'utils/test/Deferred';
import * as factories from 'utils/test/factories';
import { getUserFullname, getUserInitials } from 'utils/user';
import {
  ReferralDetailAssignmentMembers,
  ReferralDetailAssignmentUnits,
} from '.';

jest.mock('./AssignUnitModal', () => ({
  AssignUnitModal: ({
    isAssignUnitModalOpen,
  }: {
    isAssignUnitModalOpen: boolean;
  }) => <div>AssignUnitModal open: {String(isAssignUnitModalOpen)}</div>,
}));

describe('<ReferralDetailAssignment />', () => {
  const referral: Referral = factories.ReferralFactory.generate();

  afterEach(() => fetchMock.restore());

  // OWNER and ADMIN grand the same permissions here and should result in the same behavior
  for (let role of [UnitMembershipRole.OWNER, UnitMembershipRole.ADMIN]) {
    describe(`[as unit ${role}]`, () => {
      // Create a unit and pick one of their organizers as our current user. We'll link it to
      // the referral topic.
      const unit: Unit = factories.UnitFactory.generate();
      unit.members = factories.UnitMemberFactory.generate(5);
      unit.members[0].first_name = 'André';
      unit.members[0].last_name = 'François';
      unit.members[1].first_name = 'Bernard';
      unit.members[1].last_name = 'Georges';
      unit.members[2].first_name = 'César';
      unit.members[2].last_name = 'Henry';
      unit.members[3].first_name = 'David';
      unit.members[3].last_name = 'Joël';
      unit.members[4].first_name = 'Eric';
      unit.members[4].last_name = 'Laurent';
      unit.members[0].membership.role = role;

      it('shows an empty list of assignees and a dropdown menu to manage members assignments', async () => {
        const queryClient = new QueryClient();
        const deferred = new Deferred();
        fetchMock.post(
          `/api/referrals/${referral.id}/assign/`,
          deferred.promise,
        );

        const { rerender } = render(
          <IntlProvider locale="en">
            <QueryClientProvider client={queryClient}>
              <CurrentUserContext.Provider
                value={{ currentUser: unit.members[0] }}
              >
                <ReferralDetailAssignmentMembers
                  referral={{
                    ...referral,
                    topic: { ...referral.topic, unit: unit.id },
                    units: [unit],
                  }}
                />
              </CurrentUserContext.Provider>
            </QueryClientProvider>
          </IntlProvider>,
        );

        // No assignee yet, the dropdown menu is closed
        screen.getByText('Not assigned');
        const dropdownBtn = screen.getByTestId('assignment-dropdown-button');
        expect(dropdownBtn).toHaveAttribute('aria-haspopup', 'true');
        expect(dropdownBtn).toHaveAttribute('aria-expanded', 'false');

        // Open the dropdown menu, it defaults to the Persons tab.
        // Make sure all members of the unit are available to assign
        userEvent.click(dropdownBtn);
        screen.getByRole('group', {
          name: 'Manage person assignments',
        });
        expect(dropdownBtn).toHaveAttribute('aria-haspopup', 'true');
        expect(dropdownBtn).toHaveAttribute('aria-expanded', 'true');
        for (let member of unit.members) {
          const btn = screen.getByRole('button', {
            name: (name) => name.startsWith(getUserFullname(member)),
          });
          expect(btn).toHaveAttribute('aria-pressed', 'false');
          expect(btn).not.toContainHTML('#icon-tick');
        }

        // Assign one member, make sure the loading state is consistent
        {
          const assignMember0Btn = screen.getByRole('button', {
            name: (name) => name.startsWith(getUserFullname(unit.members[0])),
          });
          userEvent.click(assignMember0Btn);
          await waitFor(() =>
            expect(assignMember0Btn).toHaveAttribute('aria-disabled', 'true'),
          );
          expect(assignMember0Btn).toHaveAttribute('aria-busy', 'true');
          expect(assignMember0Btn).toContainHTML('spinner');
          expect(
            fetchMock.calls(`/api/referrals/${referral.id}/assign/`, {
              body: { assignee: unit.members[0].id },
              headers: { Authorization: 'Token the bearer token' },
              method: 'POST',
            }).length,
          ).toEqual(1);
        }

        // We receive the response and update the component
        const updatedReferral = {
          ...referral,
          assignees: [
            {
              first_name: unit.members[0].first_name,
              id: unit.members[0].id,
              last_name: unit.members[0].last_name,
              unit_name: unit.members[0].unit_name,
            },
          ],
          state: ReferralState.ASSIGNED,
        };
        await act(async () => deferred.resolve(updatedReferral));
        rerender(
          <IntlProvider locale="en">
            <QueryClientProvider client={queryClient}>
              <CurrentUserContext.Provider
                value={{ currentUser: unit.members[0] }}
              >
                <ReferralDetailAssignmentMembers
                  referral={{
                    ...updatedReferral,
                    topic: { ...referral.topic, unit: unit.id },
                    units: [unit],
                  }}
                />
              </CurrentUserContext.Provider>
            </QueryClientProvider>
          </IntlProvider>,
        );

        // Member 0 is now assigned and their button reflects it
        {
          const dropDownContainer = screen.getByTestId(
            'dropdown-inside-container',
          );
          const btn = within(dropDownContainer).getByRole('button', {
            name: (name) => name.startsWith(getUserFullname(unit.members[0])),
          });
          expect(btn).toHaveAttribute('aria-pressed', 'true');
          expect(btn).toContainHTML('#icon-tick');
        }
        // All other members still have buttons that show they are not assigned
        {
          const [_, ...otherMembers] = unit.members;
          for (let member of otherMembers) {
            const btn = screen.getByRole('button', {
              name: (name) => name.startsWith(getUserFullname(member)),
            });
            expect(btn).toHaveAttribute('aria-pressed', 'false');
            expect(btn).not.toContainHTML('#icon-tick');
          }
        }
      });

      it('shows the list of existing assignees and a dropdown menu where they can be managed', async () => {
        const queryClient = new QueryClient();
        const deferred = new Deferred();
        fetchMock.post(
          `/api/referrals/${referral.id}/unassign/`,
          deferred.promise,
        );

        const assignedMembers = [unit.members[1], unit.members[2]];
        const nonAssignedMembers = unit.members.filter(
          (member) =>
            !assignedMembers.map((assignee) => assignee.id).includes(member.id),
        );

        const { rerender } = render(
          <IntlProvider locale="en">
            <QueryClientProvider client={queryClient}>
              <CurrentUserContext.Provider
                value={{ currentUser: unit.members[0] }}
              >
                <ReferralDetailAssignmentMembers
                  referral={{
                    ...referral,
                    assignees: assignedMembers.map((assignee) => ({
                      first_name: assignee.first_name,
                      id: assignee.id,
                      last_name: assignee.last_name,
                      unit_name: assignee.unit_name,
                    })),
                    state: ReferralState.ASSIGNED,
                    topic: { ...referral.topic, unit: unit.id },
                    units: [unit],
                  }}
                />
              </CurrentUserContext.Provider>
            </QueryClientProvider>
          </IntlProvider>,
        );

        // Members [1] and [2] of the unit are assigned, the dropdown menu is closed
        {
          for (let assignee of assignedMembers) {
            screen.getByText(getUserFullname(assignee), { exact: false });
          }
        }
        const dropdownBtn = screen.getByTestId('assignment-dropdown-button');
        expect(dropdownBtn).toHaveAttribute('aria-haspopup', 'true');
        expect(dropdownBtn).toHaveAttribute('aria-expanded', 'false');

        // Open the dropdown menu, we get buttons to assign and unassign any member
        userEvent.click(dropdownBtn);
        screen.getByRole('group', {
          name: 'Manage person assignments',
        });
        expect(dropdownBtn).toHaveAttribute('aria-haspopup', 'true');
        expect(dropdownBtn).toHaveAttribute('aria-expanded', 'true');
        for (let member of nonAssignedMembers) {
          const dropdownInsideContainer = screen.getByTestId(
            'dropdown-inside-container',
          );
          const btn = within(dropdownInsideContainer).getByRole('button', {
            name: (name) => name.startsWith(getUserFullname(member)),
          });
          expect(btn).toHaveAttribute('aria-pressed', 'false');
          expect(btn).not.toContainHTML('#icon-tick');
        }
        for (let member of assignedMembers) {
          const dropdownInsideContainer = screen.getByTestId(
            'dropdown-inside-container',
          );
          const btn = within(dropdownInsideContainer).getByRole('button', {
            name: (name) => name.startsWith(getUserFullname(member)),
          });
          expect(btn).toHaveAttribute('aria-pressed', 'true');
          expect(btn).toContainHTML('#icon-tick');
        }

        // Unassign one member, make sure the loading state is consistent
        {
          const dropdownInsideContainer = screen.getByTestId(
            'dropdown-inside-container',
          );
          const unassignMember1Btn = within(dropdownInsideContainer).getByRole(
            'button',
            {
              name: (name) => name.startsWith(getUserFullname(unit.members[1])),
            },
          );
          userEvent.click(unassignMember1Btn);
          await waitFor(() =>
            expect(unassignMember1Btn).toHaveAttribute('aria-disabled', 'true'),
          );
          expect(unassignMember1Btn).toHaveAttribute('aria-busy', 'true');
          expect(unassignMember1Btn).toContainHTML('spinner');
          expect(
            fetchMock.calls(`/api/referrals/${referral.id}/unassign/`, {
              body: { assignee: unit.members[1].id },
              headers: { Authorization: 'Token the bearer token' },
              method: 'POST',
            }).length,
          ).toEqual(1);
        }

        // We receive the response and update the component
        const updatedReferral = {
          ...referral,
          assignees: [
            {
              first_name: unit.members[2].first_name,
              id: unit.members[2].id,
              last_name: unit.members[2].last_name,
              unit_name: unit.members[2].unit_name,
            },
          ],
          state: ReferralState.ASSIGNED,
        };
        await act(async () => deferred.resolve(updatedReferral));
        rerender(
          <IntlProvider locale="en">
            <QueryClientProvider client={queryClient}>
              <CurrentUserContext.Provider
                value={{ currentUser: unit.members[0] }}
              >
                <ReferralDetailAssignmentMembers
                  referral={{
                    ...updatedReferral,
                    topic: { ...referral.topic, unit: unit.id },
                    units: [unit],
                  }}
                />
              </CurrentUserContext.Provider>
            </QueryClientProvider>
          </IntlProvider>,
        );
        // Only member [2] remains assigned to the referral
        {
          const dropdownAssignmentButton = screen.getByTestId(
            'assignment-dropdown-button',
          );
          within(dropdownAssignmentButton).getByText(
            getUserFullname(unit.members[2]),
            { exact: false },
          );
          const dropdownInsideContainer = screen.getByTestId(
            'dropdown-inside-container',
          );
          const member2Btn = within(dropdownInsideContainer).getByRole(
            'button',
            {
              name: (name) => name.startsWith(getUserFullname(unit.members[2])),
            },
          );
          expect(member2Btn).toHaveAttribute('aria-pressed', 'true');
          expect(member2Btn).toContainHTML('#icon-tick');

          for (let member of unit.members.filter(
            (member) => member.id !== unit.members[2].id,
          )) {
            expect(screen.queryByText(getUserInitials(member))).toBeNull();
            const btn = screen.getByRole('button', {
              name: (name) => name.startsWith(getUserFullname(member)),
            });
            expect(btn).toHaveAttribute('aria-pressed', 'false');
            expect(btn).not.toContainHTML('#icon-tick');
          }
        }
      });

      it('shows the list of assigned units and a dropdown menu where they can be managed', async () => {
        const queryClient = new QueryClient();
        const unit2: Unit = factories.UnitFactory.generate();
        const unit3: Unit = factories.UnitFactory.generate();

        const getUnitsDeferred = new Deferred();
        fetchMock.get('/api/units/?limit=999', getUnitsDeferred.promise);

        const unassignDeferred = new Deferred();
        fetchMock.post(
          `/api/referrals/${referral.id}/unassign_unit/`,
          unassignDeferred.promise,
        );

        const assignDeferred = new Deferred();
        fetchMock.post(
          `/api/referrals/${referral.id}/assign_unit/`,
          assignDeferred.promise,
        );

        const initialReferral = {
          ...referral,
          assignees: [],
          state: ReferralState.RECEIVED,
          topic: { ...referral.topic, unit: unit.id },
          units: [unit, unit2],
        };

        const { rerender } = render(
          <IntlProvider locale="en">
            <QueryClientProvider client={queryClient}>
              <CurrentUserContext.Provider
                value={{ currentUser: unit.members[0] }}
              >
                <ReferralDetailAssignmentUnits referral={initialReferral} />
              </CurrentUserContext.Provider>
            </QueryClientProvider>
          </IntlProvider>,
        );

        const dropdownBtn = screen.getByTestId('assignment-dropdown-button');
        expect(dropdownBtn).toHaveAttribute('aria-haspopup', 'true');
        expect(dropdownBtn).toHaveAttribute('aria-expanded', 'false');
        // Open the dropdown menu, it defaults to the Persons tab. Move to units tab.
        userEvent.click(dropdownBtn);
        // The list of available units is loading
        screen.getByRole('status', { name: 'Loading units...' });
        await act(async () =>
          getUnitsDeferred.resolve({
            count: 3,
            next: null,
            previous: null,
            results: [unit, unit2, unit3],
          }),
        );

        {
          // Units list has loaded, the unit assignments UI can be displayed
          screen.getByRole('group', {
            name: 'Manage unit assignments',
          });

          screen.getByText(`${unit.name} is assigned`);
          const unit1Btn = screen.getByRole('button', {
            name: (accessibleName, element) =>
              // check both the accessible name and the visually displayed unit name
              accessibleName === 'Unassign it' &&
              element.innerHTML.includes(unit.name),
          });
          expect(unit1Btn).toContainHTML('#icon-tick');

          screen.getByText(`${unit2.name} is assigned`);
          const unit2Btn = screen.getByRole('button', {
            name: (accessibleName, element) =>
              // check both the accessible name and the visually displayed unit name
              accessibleName === 'Unassign it' &&
              element.innerHTML.includes(unit2.name),
          });
          expect(unit2Btn).toContainHTML('#icon-tick');

          screen.getByText(`${unit3.name} is not assigned`);
          const unit3Btn = screen.getByRole('button', {
            name: (accessibleName, element) =>
              // check both the accessible name and the visually displayed unit name
              accessibleName === 'Assign it' &&
              element.innerHTML.includes(unit3.name),
          });
          expect(unit3Btn).toContainHTML('#icon-newwindow');
        }

        // Remove unit 2 from the referral
        {
          const unit2Btn = screen.getByRole('button', {
            name: (accessibleName, element) =>
              // check both the accessible name and the visually displayed unit name
              accessibleName === 'Unassign it' &&
              element.innerHTML.includes(unit2.name),
          });
          userEvent.click(unit2Btn);
          const updatedReferral = {
            ...initialReferral,
            units: [unit],
          };
          await act(async () => unassignDeferred.resolve(updatedReferral));
          expect(
            fetchMock.called(`/api/referrals/${referral.id}/unassign_unit/`, {
              body: { unit: unit2.id },
              headers: {
                Authorization: 'Token the bearer token',
                'Content-Type': 'application/json',
              },
              method: 'POST',
            }),
          ).toBe(true);

          rerender(
            <IntlProvider locale="en">
              <QueryClientProvider client={queryClient}>
                <CurrentUserContext.Provider
                  value={{ currentUser: unit.members[0] }}
                >
                  <ReferralDetailAssignmentUnits referral={updatedReferral} />
                </CurrentUserContext.Provider>
              </QueryClientProvider>
            </IntlProvider>,
          );
        }
        // Buttons show unit 1 is still assigned, units 2 and 3 are not
        {
          screen.getByText(`${unit.name} is assigned`);
          const unit1Btn = screen.getByRole('button', {
            name: (accessibleName, element) =>
              // check both the accessible name and the visually displayed unit name
              accessibleName === 'Unassign it' &&
              element.innerHTML.includes(unit.name),
          });
          expect(unit1Btn).toContainHTML('#icon-tick');

          screen.getByText(`${unit2.name} is not assigned`);
          const unit2Btn = screen.getByRole('button', {
            name: (accessibleName, element) =>
              // check both the accessible name and the visually displayed unit name
              accessibleName === 'Assign it' &&
              element.innerHTML.includes(unit2.name),
          });
          expect(unit2Btn).toContainHTML('#icon-newwindow');

          screen.getByText(`${unit3.name} is not assigned`);
          const unit3Btn = screen.getByRole('button', {
            name: (accessibleName, element) =>
              // check both the accessible name and the visually displayed unit name
              accessibleName === 'Assign it' &&
              element.innerHTML.includes(unit3.name),
          });
          expect(unit3Btn).toContainHTML('#icon-newwindow');
        }

        {
          screen.getByText(`${unit3.name} is not assigned`);
          const unit3Btn = screen.getByRole('button', {
            name: (accessibleName, element) =>
              // check both the accessible name and the visually displayed unit name
              accessibleName === 'Assign it' &&
              element.innerHTML.includes(unit3.name),
          });
          expect(unit3Btn).toContainHTML('#icon-newwindow');
          userEvent.click(unit3Btn);
        }

        // Make sure the modal is opened. It is in charge of actually updating the referral.
        await waitFor(() => {
          screen.getByText('AssignUnitModal open: true');
        });
      });

      it('shows a readonly assignment dropdown if the current state does not permit assignment changes', () => {
        const queryClient = new QueryClient();
        const assignedMembers = [unit.members[1], unit.members[2]];
        render(
          <IntlProvider locale="en">
            <QueryClientProvider client={queryClient}>
              <CurrentUserContext.Provider
                value={{ currentUser: unit.members[0] }}
              >
                <ReferralDetailAssignmentMembers
                  referral={{
                    ...referral,
                    assignees: assignedMembers.map((assignee) => ({
                      first_name: assignee.first_name,
                      id: assignee.id,
                      last_name: assignee.last_name,
                      unit_name: assignee.unit_name,
                    })),
                    state: ReferralState.ANSWERED,
                    topic: { ...referral.topic, unit: unit.id },
                    units: [unit],
                  }}
                />
              </CurrentUserContext.Provider>
            </QueryClientProvider>
          </IntlProvider>,
        );

        expect(screen.queryByTestId('assignment-dropdown-button')).toBeNull;

        const referralDetailAssignment = screen.getByTestId(
          'readonly-assigments',
        );

        within(referralDetailAssignment).getByText(
          getUserFullname(assignedMembers[0]),
          { exact: false },
        );
        within(referralDetailAssignment).getByText(
          getUserFullname(assignedMembers[1]),
          { exact: false },
        );
      });
    });
  }

  describe(`[as unit ${UnitMembershipRole.MEMBER}]`, () => {
    // Create a unit and pick one of their regular members as our current user. We'll link it to
    // the referral topic.
    const unit: Unit = factories.UnitFactory.generate();
    unit.members = factories.UnitMemberFactory.generate(5);
    unit.members[0].membership.role = UnitMembershipRole.MEMBER;

    it('shows a dropdown with filler text when there is no assignee', () => {
      const queryClient = new QueryClient();
      render(
        <IntlProvider locale="en">
          <QueryClientProvider client={queryClient}>
            <CurrentUserContext.Provider
              value={{ currentUser: unit.members[0] }}
            >
              <ReferralDetailAssignmentMembers
                referral={{
                  ...referral,
                  topic: { ...referral.topic, unit: unit.id },
                  units: [unit],
                }}
              />
            </CurrentUserContext.Provider>
          </QueryClientProvider>
        </IntlProvider>,
      );

      expect(screen.queryByTestId('assignment-dropdown-button')).toBeNull;

      const referralDetailAssignment = screen.getByTestId(
        'readonly-assigments',
      );
      within(referralDetailAssignment).getByText('Not assigned');
    });

    it('shows text only with the list of assignees and units', () => {
      const queryClient = new QueryClient();
      const [assignee1, assignee2, ..._] = unit.members;

      render(
        <IntlProvider locale="en">
          <QueryClientProvider client={queryClient}>
            <ReferralDetailAssignmentMembers
              referral={{
                ...referral,
                assignees: [assignee1, assignee2].map((assignee) => ({
                  first_name: assignee.first_name,
                  id: assignee.id,
                  last_name: assignee.last_name,
                  unit_name: assignee.unit_name,
                })),
                state: ReferralState.ASSIGNED,
                topic: { ...referral.topic, unit: unit.id },
                units: [unit],
              }}
            />
          </QueryClientProvider>
        </IntlProvider>,
      );

      expect(screen.queryByTestId('assignment-dropdown-button')).toBeNull;

      const referralDetailAssignment = screen.getByTestId(
        'readonly-assigments',
      );

      within(referralDetailAssignment).getByText(getUserFullname(assignee1), {
        exact: false,
      });
      within(referralDetailAssignment).getByText(getUserFullname(assignee2), {
        exact: false,
      });
    });
  });

  describe('[as requester]', () => {
    const unit: Unit = factories.UnitFactory.generate();
    unit.members = factories.UnitMemberFactory.generate(5);

    it('shows a text only with when there is no assignee and no permissions', () => {
      const queryClient = new QueryClient();
      render(
        <IntlProvider locale="en">
          <QueryClientProvider client={queryClient}>
            <ReferralDetailAssignmentMembers
              referral={{
                ...referral,
                topic: { ...referral.topic, unit: unit.id },
                units: [unit],
              }}
            />
          </QueryClientProvider>
        </IntlProvider>,
      );

      expect(screen.queryByTestId('assignment-dropdown-button')).toBeNull;

      const referralHeader = screen.getByTestId('readonly-assigments');
      within(referralHeader).getByText('Not assigned');
    });

    it('shows assigned persons for requester and no dropdown shown', () => {
      const queryClient = new QueryClient();
      const unit: Unit = factories.UnitFactory.generate();
      unit.members = factories.UnitMemberFactory.generate(3);
      const [assignee1, assignee2, ..._] = unit.members;

      render(
        <IntlProvider locale="en">
          <QueryClientProvider client={queryClient}>
            <ReferralDetailAssignmentMembers
              referral={{
                ...referral,
                assignees: [assignee1, assignee2].map((assignee) => ({
                  first_name: assignee.first_name,
                  id: assignee.id,
                  last_name: assignee.last_name,
                  unit_name: assignee.unit_name,
                })),
                state: ReferralState.ASSIGNED,
                topic: { ...referral.topic, unit: unit.id },
                units: [unit],
              }}
            />
          </QueryClientProvider>
        </IntlProvider>,
      );

      expect(screen.queryByTestId('assignment-dropdown-button')).toBeNull;
      screen.getByText(getUserFullname(assignee1), { exact: false });
      screen.getByText(getUserFullname(assignee2), { exact: false });
    });
  });
});
