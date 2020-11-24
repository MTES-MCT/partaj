import {
  act,
  getByRole,
  getByText,
  render,
  queryByRole,
  queryByText,
  screen,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import React from 'react';
import { IntlProvider } from 'react-intl';

import { CurrentUserContext } from 'data/useCurrentUser';
import { Referral, ReferralState, Unit, UnitMembershipRole } from 'types';
import { Deferred } from 'utils/test/Deferred';
import * as factories from 'utils/test/factories';
import { getUserFullname } from 'utils/user';
import { ReferralDetailAssignment } from '.';

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
      unit.members[0].membership.role = role;

      it('shows an empty list of assignees and a dropdown menu to manage assignments', async () => {
        const deferred = new Deferred();
        fetchMock.post(
          `/api/referrals/${referral.id}/assign/`,
          deferred.promise,
        );

        const { rerender } = render(
          <IntlProvider locale="en">
            <CurrentUserContext.Provider
              value={{ currentUser: unit.members[0] }}
            >
              <ReferralDetailAssignment
                referral={{ ...referral, topic: { ...referral.topic, unit } }}
              />
            </CurrentUserContext.Provider>
          </IntlProvider>,
        );

        // No assignee yet, the dropdown menu is closed
        screen.getByText('No assignment yet');
        const dropdownBtn = screen.getByRole('button', {
          name: 'Manage assignees',
        });
        expect(dropdownBtn).toHaveAttribute('aria-haspopup', 'true');
        expect(dropdownBtn).toHaveAttribute('aria-expanded', 'false');

        // Open the dropdown menu, make sure all members of the unit are available to assign
        userEvent.click(dropdownBtn);
        const addAssigneeList = screen.getByRole('group', {
          name: 'Add an assignee',
        });
        expect(dropdownBtn).toHaveAttribute('aria-haspopup', 'true');
        expect(dropdownBtn).toHaveAttribute('aria-expanded', 'true');
        for (let member of unit.members) {
          getByRole(addAssigneeList, 'button', {
            name: getUserFullname(member),
          });
        }

        // Assign one member, make sure the loading state is consistent
        {
          const assignMember0Btn = getByRole(addAssigneeList, 'button', {
            name: getUserFullname(unit.members[0]),
          });
          userEvent.click(assignMember0Btn);
          userEvent.click(assignMember0Btn); // Send two clicks to make sure it does not cause trouble
          expect(assignMember0Btn).toHaveAttribute('aria-disabled', 'true');
          expect(assignMember0Btn).toHaveAttribute('aria-busy', 'true');
          // This is an exception where we rely on aria-busy and the spinner is aria-hidden
          expect(assignMember0Btn).toContainHTML('spinner');
          expect(
            fetchMock.calls(`/api/referrals/${referral.id}/assign/`, {
              body: { assignee_id: unit.members[0].id },
              headers: { Authorization: 'Token the bearer token' },
              method: 'POST',
            }).length,
          ).toEqual(1);
        }

        // We receive the response and update the component
        const updatedReferral = {
          ...referral,
          assignees: [unit.members[0].id],
          state: ReferralState.ASSIGNED,
        };
        await act(async () => deferred.resolve(updatedReferral));
        rerender(
          <IntlProvider locale="en">
            <CurrentUserContext.Provider
              value={{ currentUser: unit.members[0] }}
            >
              <ReferralDetailAssignment
                referral={{
                  ...updatedReferral,
                  topic: { ...referral.topic, unit },
                }}
              />
            </CurrentUserContext.Provider>
          </IntlProvider>,
        );

        // Base list of assigned members has replaced the empty filler text
        {
          expect(screen.queryByText('No assignment yet')).toBeNull();
          const assigneeList = screen.getByRole('list', {
            name: 'Assigned to',
          });
          getByText(assigneeList, getUserFullname(unit.members[0]));
        }

        // The add assignee list no longer includes member 0, who appears in the remove assignee list
        {
          const [member0, ...otherMembers] = unit.members;
          const addAssigneeList = screen.getByRole('group', {
            name: 'Add an assignee',
          });
          expect(
            queryByRole(addAssigneeList, 'button', {
              name: getUserFullname(member0),
            }),
          );
          for (let member of otherMembers) {
            getByRole(addAssigneeList, 'button', {
              name: getUserFullname(member),
            });
          }

          const removeAssigneeList = screen.getByRole('group', {
            name: 'Remove an assignee',
          });
          getByRole(removeAssigneeList, 'button', {
            name: getUserFullname(member0),
          });
          for (let member of otherMembers) {
            expect(
              queryByRole(removeAssigneeList, 'button', {
                name: getUserFullname(member),
              }),
            ).toBeNull();
          }
        }
      });

      it('shows the list of assignees and a dropdown menu where they can be unassigned', async () => {
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
            <CurrentUserContext.Provider
              value={{ currentUser: unit.members[0] }}
            >
              <ReferralDetailAssignment
                referral={{
                  ...referral,
                  assignees: assignedMembers.map((assignee) => assignee.id),
                  state: ReferralState.ASSIGNED,
                  topic: { ...referral.topic, unit },
                }}
              />
            </CurrentUserContext.Provider>
          </IntlProvider>,
        );

        // Members [1] and [2] of the unit are assigned, the dropdown menu is closed
        {
          const assigneeList = screen.getByRole('list', {
            name: 'Assigned to',
          });
          for (let assignee of assignedMembers) {
            getByText(assigneeList, getUserFullname(assignee));
          }
        }
        const dropdownBtn = screen.getByRole('button', {
          name: 'Manage assignees',
        });
        expect(dropdownBtn).toHaveAttribute('aria-haspopup', 'true');
        expect(dropdownBtn).toHaveAttribute('aria-expanded', 'false');

        // Open the dropdown menu, we get our groups of buttons to add or remove assignees
        userEvent.click(dropdownBtn);
        expect(dropdownBtn).toHaveAttribute('aria-haspopup', 'true');
        expect(dropdownBtn).toHaveAttribute('aria-expanded', 'true');
        {
          const addAssigneeList = screen.getByRole('group', {
            name: 'Add an assignee',
          });
          for (let member of nonAssignedMembers) {
            getByRole(addAssigneeList, 'button', {
              name: getUserFullname(member),
            });
          }
          for (let member of assignedMembers) {
            expect(
              queryByRole(addAssigneeList, 'button', {
                name: getUserFullname(member),
              }),
            ).toBeNull();
          }
        }
        const removeAssigneeList = screen.getByRole('group', {
          name: 'Remove an assignee',
        });
        for (let member of nonAssignedMembers) {
          expect(
            queryByRole(removeAssigneeList, 'button', {
              name: getUserFullname(member),
            }),
          ).toBeNull();
        }
        for (let member of assignedMembers) {
          getByRole(removeAssigneeList, 'button', {
            name: getUserFullname(member),
          });
        }

        // Unassign one member, make sure the loading state is consistent
        {
          const unassignMember1Btn = getByRole(removeAssigneeList, 'button', {
            name: getUserFullname(unit.members[1]),
          });
          userEvent.click(unassignMember1Btn);
          userEvent.click(unassignMember1Btn); // Send two clicks to make sure it does not cause trouble
          expect(unassignMember1Btn).toHaveAttribute('aria-disabled', 'true');
          expect(unassignMember1Btn).toHaveAttribute('aria-busy', 'true');
          // This is an exception where we rely on aria-busy and the spinner is aria-hidden
          expect(unassignMember1Btn).toContainHTML('spinner');
          expect(
            fetchMock.calls(`/api/referrals/${referral.id}/unassign/`, {
              body: { assignee_id: unit.members[1].id },
              headers: { Authorization: 'Token the bearer token' },
              method: 'POST',
            }).length,
          ).toEqual(1);
        }

        // We receive the response and update the component
        const updatedReferral = {
          ...referral,
          assignees: [unit.members[2].id],
          state: ReferralState.ASSIGNED,
        };
        await act(async () => deferred.resolve(updatedReferral));
        rerender(
          <IntlProvider locale="en">
            <CurrentUserContext.Provider
              value={{ currentUser: unit.members[0] }}
            >
              <ReferralDetailAssignment
                referral={{
                  ...updatedReferral,
                  topic: { ...referral.topic, unit },
                }}
              />
            </CurrentUserContext.Provider>
          </IntlProvider>,
        );
        // Only member [2] remains assigned to the referral
        {
          const assigneeList = screen.getByRole('list', {
            name: 'Assigned to',
          });
          getByText(assigneeList, getUserFullname(unit.members[2]));
          for (let member of unit.members.filter(
            (member) => member.id !== unit.members[2].id,
          )) {
            expect(
              queryByText(assigneeList, getUserFullname(member)),
            ).toBeNull();
          }
        }
      });

      it('does not show the button to assign members if the current state does not allow it', () => {
        render(
          <IntlProvider locale="en">
            <CurrentUserContext.Provider
              value={{ currentUser: unit.members[0] }}
            >
              <ReferralDetailAssignment
                referral={{
                  ...referral,
                  state: ReferralState.ANSWERED,
                  topic: { ...referral.topic, unit },
                }}
              />
            </CurrentUserContext.Provider>
          </IntlProvider>,
        );

        screen.getByText('No assignment yet');
        expect(
          screen.queryByRole('button', {
            name: 'Manage assignees',
          }),
        ).toBeNull();
      });
    });
  }

  describe(`[as unit ${UnitMembershipRole.MEMBER}]`, () => {
    // Create a unit and pick one of their regular members as our current user. We'll link it to
    // the referral topic.
    const unit: Unit = factories.UnitFactory.generate();
    unit.members = factories.UnitMemberFactory.generate(5);
    unit.members[0].membership.role = UnitMembershipRole.MEMBER;

    it('shows an empty filler text when there is no assignee', () => {
      render(
        <IntlProvider locale="en">
          <ReferralDetailAssignment
            referral={{ ...referral, topic: { ...referral.topic, unit } }}
          />
        </IntlProvider>,
      );

      screen.getByText('No assignment yet');
      expect(
        screen.queryByRole('button', { name: 'Manage assignees' }),
      ).toBeNull();
    });

    it('shows the list of assignees', () => {
      const [assignee1, assignee2, ...nonAssignees] = unit.members;

      render(
        <IntlProvider locale="en">
          <ReferralDetailAssignment
            referral={{
              ...referral,
              assignees: [assignee1.id, assignee2.id],
              state: ReferralState.ASSIGNED,
              topic: { ...referral.topic, unit },
            }}
          />
        </IntlProvider>,
      );

      screen.getByRole('list', { name: 'Assigned to' });
      for (let assignee of [assignee1, assignee2]) {
        screen.getByText(getUserFullname(assignee));
      }
      for (let nonAssignee of nonAssignees) {
        expect(screen.queryByText(getUserFullname(nonAssignee))).toBeNull();
      }
      expect(
        screen.queryByRole('button', { name: 'Manage assignees' }),
      ).toBeNull();
    });
  });

  describe('[as requester]', () => {
    it('shows an empty filler text when there is no assignee', () => {
      render(
        <IntlProvider locale="en">
          <ReferralDetailAssignment referral={referral} />
        </IntlProvider>,
      );

      screen.getByText('No assignment yet');
      expect(
        screen.queryByRole('button', { name: 'Manage assignees' }),
      ).toBeNull();
    });

    it('shows the list of assignees', () => {
      const unit: Unit = factories.UnitFactory.generate();
      unit.members = factories.UnitMemberFactory.generate(3);
      const [assignee1, assignee2, nonAssignee] = unit.members;

      render(
        <IntlProvider locale="en">
          <ReferralDetailAssignment
            referral={{
              ...referral,
              assignees: [assignee1.id, assignee2.id],
              state: ReferralState.ASSIGNED,
              topic: { ...referral.topic, unit },
            }}
          />
        </IntlProvider>,
      );

      screen.getByRole('list', { name: 'Assigned to' });
      for (let assignee of [assignee1, assignee2]) {
        screen.getByText(getUserFullname(assignee));
      }
      expect(screen.queryByText(getUserFullname(nonAssignee))).toBeNull();
      expect(
        screen.queryByRole('button', { name: 'Manage assignees' }),
      ).toBeNull();
    });
  });
});
