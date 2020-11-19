import React, { useState } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { useUIDSeed } from 'react-uid';

import { useCurrentUser } from 'data/useCurrentUser';
import { Referral, ReferralState } from 'types';
import { ContextProps } from 'types/context';
import { Nullable } from 'types/utils';
import { isUserUnitOrganizer } from 'utils/unit';
import { getUserFullname } from 'utils/user';
import { useClickOutside } from 'utils/useClickOutside';
import { ReferralMemberAssignmentButton } from './ReferralMemberAssignmentButton';
import { DropdownMenu } from 'components/DropdownMenu';

const messages = defineMessages({
  addAnAssignee: {
    defaultMessage: 'Add an assignee',
    description:
      'Title for the list of buttons to add an assignee to a referral',
    id: 'components.ReferralDetailAssignment.addAnAssignee',
  },
  assignedTo: {
    defaultMessage: 'Assigned to',
    description:
      'Associated text for the list of unit members a referral has been assigned to on ' +
      'the referral detail view.',
    id: 'components.ReferralDetailAssignment.assignedTo',
  },
  manageAssignees: {
    defaultMessage: 'Manage assignees',
    description:
      'Button in referral detail view that allows unit organizers to open the assignments menu',
    id: 'components.ReferralDetailAssignment.manageAssignees',
  },
  noAssigneeYet: {
    defaultMessage: 'No assignment yet',
    description:
      'Default text when there are no assignees on the referral detail view.',
    id: 'components.ReferralDetailAssignment.noAssigneeYet',
  },
  removeAnAssignee: {
    defaultMessage: 'Remove an assignee',
    description:
      'Title for the list of buttons to remove an assignee from a referral',
    id: 'components.ReferralDetailAssignment.removeAnAssignee',
  },
});

interface ReferralDetailAssignmentProps {
  referral: Referral;
}

export const ReferralDetailAssignment: React.FC<
  ReferralDetailAssignmentProps & ContextProps
> = ({ context, referral }) => {
  const uid = useUIDSeed();
  const { currentUser } = useCurrentUser();

  const unassignedMembers = referral?.topic.unit.members.filter(
    (member) => !referral.assignees.includes(member.id),
  );

  const couldAssign =
    [ReferralState.ASSIGNED, ReferralState.RECEIVED].includes(referral.state) &&
    // There are members in the unit who are not yet assigned
    unassignedMembers &&
    unassignedMembers!.length > 0;

  const couldUnassign = // Referral is in a state where assignments can be removed
    referral.state === ReferralState.ASSIGNED &&
    // There are assignees that could be removed
    referral.assignees.length > 0;

  const canShowAssignmentDropdown =
    // Referral is in a state where assignments can be created
    (couldAssign || couldUnassign) &&
    // The current user is allowed to make assignments for this referral
    !!currentUser &&
    (currentUser?.is_superuser ||
      isUserUnitOrganizer(currentUser, referral.topic.unit));

  return (
    <div
      className={`float-right flex flex-row ${
        referral.assignees.length > 1 ? 'items-start' : 'items-center'
      }`}
    >
      {/* Display the assignees, or a message stating there are none. */}
      {referral.assignees.length === 0 ? (
        <span className="text-gray-600">
          <FormattedMessage {...messages.noAssigneeYet} />
        </span>
      ) : (
        <>
          <span
            className="mr-1 font-semibold whitespace-no-wrap"
            id={uid('assignee-list')}
          >
            <FormattedMessage {...messages.assignedTo} />
          </span>
          <ul className="font-semibold" aria-labelledby={uid('assignee-list')}>
            {referral.assignees.map((assigneeId) => (
              <li className="whitespace-no-wrap" key={assigneeId}>
                {getUserFullname(
                  referral.topic.unit.members.find(
                    (member) => member.id == assigneeId,
                  )!,
                )}
              </li>
            ))}
          </ul>
        </>
      )}

      {/* For authorized users, show a dropdown to add assignees. */}
      {canShowAssignmentDropdown ? (
        <DropdownMenu
          buttonContent={
            <svg role="img" className={'fill-current block w-6 h-6'}>
              <title id={uid('dropdown-button-title')}>
                <FormattedMessage {...messages.manageAssignees} />
              </title>
              <use
                xlinkHref={`${context.assets.icons}#icon-chevron-thin-down`}
              />
            </svg>
          }
          buttonTitleId={uid('dropdown-button-title')}
        >
          {couldAssign ? (
            <fieldset
              className="min-w-0"
              aria-labelledby={uid('add-an-assignee')}
            >
              <legend
                id={uid('add-an-assignee')}
                className="px-4 py-2 text-sm leading-5 font-semibold"
              >
                <FormattedMessage {...messages.addAnAssignee} />
              </legend>
              <div className="border-t border-gray-100"></div>
              <div className="py-1">
                {unassignedMembers.map((member) => (
                  <ReferralMemberAssignmentButton
                    {...{
                      action: 'assign',
                      context,
                      key: member.id,
                      member,
                      referral,
                    }}
                  />
                ))}
              </div>
            </fieldset>
          ) : null}
          {couldAssign && couldUnassign ? (
            <div className="border-t border-gray-100"></div>
          ) : null}
          {couldUnassign ? (
            <fieldset
              className="min-w-0"
              aria-labelledby={uid('remove-an-assignee')}
            >
              <legend
                id={uid('remove-an-assignee')}
                className="px-4 py-2 text-sm leading-5 font-semibold"
              >
                <FormattedMessage {...messages.removeAnAssignee} />
              </legend>
              <div className="border-t border-gray-100"></div>
              <div className="py-1">
                {referral.topic.unit.members
                  .filter((member) => referral.assignees.includes(member.id))
                  .map((member) => (
                    <ReferralMemberAssignmentButton
                      {...{
                        action: 'unassign',
                        context,
                        key: member.id,
                        member,
                        referral,
                      }}
                    />
                  ))}
              </div>
            </fieldset>
          ) : null}
        </DropdownMenu>
      ) : null}
    </div>
  );
};
