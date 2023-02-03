import { defineMessages } from '@formatjs/intl';
import React, { useMemo } from 'react';
import { useCurrentUser } from 'data/useCurrentUser';
import * as types from 'types';

import { ReferralUsersTableRow } from './ReferralUsersTableRow';
import { FormattedMessage } from 'react-intl';
import { ReferralState } from 'types';

const messages = defineMessages({
  columnNameTitle: {
    defaultMessage: 'Name',
    description: 'Title for column name',
    id: 'components.ReferralUsersTable.columnNameTitle',
  },
  columnServiceTitle: {
    defaultMessage: 'Service',
    description: 'Title for column service',
    id: 'components.ReferralUsersTable.columnServiceTitle',
  },
  columnRoleTitle: {
    defaultMessage: 'Role',
    description: 'Title for column role',
    id: 'components.ReferralUsersTable.columnRoleTitle',
  },
});

interface ReferralUsersBlockProps {
  referral: types.Referral;
  invite?: boolean;
}

export const ReferralUsersTable: React.FC<ReferralUsersBlockProps> = ({
  referral,
}) => {
  const { currentUser } = useCurrentUser();
  const currentUserIsObserver = useMemo(
    () =>
      referral.observers.findIndex(
        (referralUser) => referralUser.id === currentUser?.id,
      ) !== -1,
    [referral, currentUser],
  );

  const currentUserIsFromRequesterUnit = useMemo(
    () =>
      referral.requesters.findIndex((referralUser) =>
        referralUser.unit_name.startsWith(currentUser?.unit_name || 'N/A'),
      ) !== -1,
    [referral, currentUser],
  );

  const currentUserIsReferralUnitMember = useMemo(
    () =>
      referral.units.findIndex(
        (unit) =>
          unit.members.findIndex(
            (unitMember) => unitMember.id === currentUser?.id,
          ) !== -1,
      ) !== -1,
    [referral, currentUser],
  );

  const referralIsDraft = useMemo(
    () => referral.state === ReferralState.DRAFT,
    [referral],
  );

  const currentUserCanChangeUserRole =
    (currentUserIsFromRequesterUnit ||
      currentUserIsObserver ||
      currentUserIsReferralUnitMember) &&
    !referralIsDraft;

  const currentUserCanRemoveUser =
    currentUserIsFromRequesterUnit ||
    currentUserIsObserver ||
    currentUserIsReferralUnitMember;

  return (
    <table className="referral-users-table">
      <thead>
        <tr>
          <th>
            <FormattedMessage {...messages.columnNameTitle} />
          </th>
          <th>
            <FormattedMessage {...messages.columnServiceTitle} />
          </th>
          {currentUserCanChangeUserRole && (
            <th>
              <FormattedMessage {...messages.columnRoleTitle} />
            </th>
          )}
          <th>{''}</th>
        </tr>
      </thead>
      <tbody>
        {referral.users.map((referralUser) => (
          <ReferralUsersTableRow
            user={referralUser}
            key={referralUser.id}
            currentUserCanRemoveUser={currentUserCanRemoveUser}
            currentUserCanChangeUserRole={currentUserCanChangeUserRole}
          />
        ))}
      </tbody>
    </table>
  );
};
