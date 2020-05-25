import React from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { useUID } from 'react-uid';

import { Spinner } from 'components/Spinner';
import { useCurrentUser } from 'data/useCurrentUser';
import { Referral, ReferralState, User } from 'types';
import { ContextProps } from 'types/context';
import { Nullable } from 'types/utils';
import { handle } from 'utils/errors';
import { isUserUnitOrganizer } from 'utils/unit';
import { getUserFullname } from 'utils/user';

const messages = defineMessages({
  assignAMember: {
    defaultMessage: 'Assign a member',
    description:
      'Button in referral detail view that allows unit organizers to assign the referral to a member',
    id: 'components.ReferralDetailAssignment.assignAMember',
  },
  assignedTo: {
    defaultMessage: 'Assignment(s)',
    description:
      'Associated text for the list of unit members a referral has been assigned to on ' +
      'the referral detail view.',
    id: 'components.ReferralDetailAssignment.assignedTo',
  },
  loadingAssignees: {
    defaultMessage: 'Loading assignees...',
    description:
      'Accessible loading message for the assignees spinner on the referral detail view.',
    id: 'components.ReferralDetailAssignment.loadingAssignees',
  },
  noAssigneeYet: {
    defaultMessage: 'No assignment yet',
    description:
      'Default text when there are no assignees on the referral detail view.',
    id: 'components.ReferralDetailAssignment.noAssigneeYet',
  },
});

interface ReferralDetailAssignmentProps {
  referral: Referral;
  setReferral: React.Dispatch<React.SetStateAction<Nullable<Referral>>>;
}

export const ReferralDetailAssignment: React.FC<
  ReferralDetailAssignmentProps & ContextProps
> = ({ context, referral, setReferral }) => {
  const uid = useUID();
  const { currentUser } = useCurrentUser();

  const unassignedMembers = referral?.topic.unit.members.filter(
    (member) => !referral.assignees.includes(member.id),
  );

  const showAssignmentDropdown =
    // Referral is in a state where assignments can be created
    [ReferralState.ASSIGNED, ReferralState.RECEIVED].includes(referral.state) &&
    // There are members in the unit who are not yet assigned
    unassignedMembers &&
    unassignedMembers!.length > 0 &&
    // The current user is allowed to make assignments for this referral
    currentUser &&
    (currentUser?.is_superuser ||
      isUserUnitOrganizer(currentUser, referral.topic.unit));

  const assign = async (user: User) => {
    const response = await fetch(`/api/referrals/${referral!.id}/assign/`, {
      body: JSON.stringify({ assignee_id: user.id }),
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': context.csrftoken,
      },
      method: 'POST',
    });
    if (!response.ok) {
      return handle(
        new Error(
          'Failed to get created new assignment in ReferralDetailAssignment.',
        ),
      );
    }
    const updatedReferral: Referral = await response.json();
    setReferral(updatedReferral);
  };

  return (
    <div className="card float-right w-64 rounded-lg">
      <div className="card-body">
        <h5 className="card-title text-center" id={uid}>
          <FormattedMessage {...messages.assignedTo} />{' '}
        </h5>

        {referral == null ? (
          <Spinner>
            <FormattedMessage {...messages.loadingAssignees} />
          </Spinner>
        ) : (
          <ul className="list-group list-group-flush" aria-labelledby={uid}>
            {/* Display the assignees, or a message stating there are none */}
            {referral.assignees.length === 0 ? (
              <li className="list-group-item disabled">
                <FormattedMessage {...messages.noAssigneeYet} />
              </li>
            ) : (
              referral.assignees.map((assigneeId) => (
                <li className="list-group-item" key={assigneeId}>
                  {getUserFullname(
                    referral.topic.unit.members.find(
                      (member) => member.id == assigneeId,
                    )!,
                  )}
                </li>
              ))
            )}
          </ul>
        )}

        {/* For authorized users, show a dropdown to add assignees */}
        {showAssignmentDropdown ? (
          <div className="dropdown">
            <button
              className="btn btn-block btn-info dropdown-toggle"
              type="button"
              id={`assignee-dropdown-${referral.id}`}
              data-toggle="dropdown"
              aria-haspopup="true"
              aria-expanded="false"
            >
              <FormattedMessage {...messages.assignAMember} />
            </button>
            <div
              className="dropdown-menu"
              aria-labelledby={`assignee-dropdown-${referral.id}`}
              role="list"
            >
              {unassignedMembers.map((member) => (
                <a
                  className="dropdown-item"
                  key={member.id}
                  onClick={() => assign(member)}
                  style={{ cursor: 'pointer' }}
                  role="listitem"
                >
                  {getUserFullname(member)}
                </a>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
