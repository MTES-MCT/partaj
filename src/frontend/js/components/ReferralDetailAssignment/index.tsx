import React, { useState } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';

import { Spinner } from 'components/Spinner';
import { Referral, User } from 'types';
import { ContextProps } from 'types/context';
import { Nullable } from 'types/utils';
import { handle } from 'utils/errors';
import { isUserUnitOrganizer } from 'utils/unit';
import { useAsyncEffect } from 'utils/useAsyncEffect';
import { getUserFullname } from 'utils/users';

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
  referralId: number;
}

export const ReferralDetailAssignment: React.FC<
  ReferralDetailAssignmentProps & ContextProps
> = ({ context, referralId }) => {
  const [currentUser, setCurrentUser] = useState<Nullable<User>>(null);
  const [referral, setReferral] = useState<Nullable<Referral>>(null);

  const unassignedMembers = referral?.topic.unit.members.filter(
    (member) => !referral.assignees.includes(member.id),
  );

  useAsyncEffect(async () => {
    const response = await fetch(`/api/referrals/${referralId}/`);
    if (!response.ok) {
      return handle(
        new Error('Failed to get referral in ReferralDetailAssignment.'),
      );
    }
    const newReferral: Referral = await response.json();
    setReferral(newReferral);
  }, []);

  useAsyncEffect(async () => {
    const response = await fetch('/api/users/whoami/');
    if (!response.ok) {
      return handle(
        new Error('Failed to get current user in ReferralDetailAssignment.'),
      );
    }
    const user: User = await response.json();
    setCurrentUser(user);
  }, []);

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
    <div className="card">
      <div className="card-body">
        <h5 className="card-title text-center">
          <FormattedMessage {...messages.assignedTo} />{' '}
        </h5>

        {referral == null ? (
          <Spinner>
            <FormattedMessage {...messages.loadingAssignees} />
          </Spinner>
        ) : (
          <ul className="list-group list-group-flush">
            {/* Display the assignees, or a message stating there are none */}
            {referral.assignees.length === 0 ? (
              <li className="list-group-item disabled">
                <FormattedMessage {...messages.noAssigneeYet} />
              </li>
            ) : (
              referral.assignees.map((assigneeId) => (
                <li className="list-group-item">
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
        {referral &&
        unassignedMembers &&
        unassignedMembers!.length > 0 &&
        currentUser &&
        (currentUser?.is_superuser ||
          isUserUnitOrganizer(currentUser, referral.topic.unit)) ? (
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
            >
              {unassignedMembers.map((member) => (
                <a
                  className="dropdown-item"
                  onClick={() => assign(member)}
                  style={{ cursor: 'pointer' }}
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
