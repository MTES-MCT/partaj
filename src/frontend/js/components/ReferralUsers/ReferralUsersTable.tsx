import { defineMessages } from '@formatjs/intl';
import React, { useContext, useMemo, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useUIDSeed } from 'react-uid';

import { useReferralAction } from 'data';
import { useCurrentUser } from 'data/useCurrentUser';
import * as types from 'types';
import { ReferralContext } from '../../data/providers/ReferralProvider';
import { UserListItem } from '../UserListItem';
import {
  getUnitNameOrPendingMessage,
  getUserFullname,
  getUserFullnameOrEmail,
} from '../../utils/user';
import { ReferralUserRoleButton } from '../buttons/RefferalUserRoleButton';
import { ReferralUsersTableRow } from './ReferralUsersTableRow';

const messages = defineMessages({
  title: {
    defaultMessage: 'Business service',
    description: 'Title for users block',
    id: 'components.ReferralUsersBlock.title',
  },
});

interface ReferralUsersBlockProps {
  referral: types.Referral;
  invite?: boolean;
}

export const ReferralUsersTable: React.FC<ReferralUsersBlockProps> = ({
  referral,
}) => {
  const seed = useUIDSeed();
  const intl = useIntl();
  const { currentUser } = useCurrentUser();
  const { refetch } = useContext(ReferralContext);
  const [isAddingRequester, setAddingRequester] = useState(false);
  // Use a key to reset the autosuggest field when the form is completed and sent
  const [key, setKey] = useState(0);
  const addRequesterMutation = useReferralAction({
    onSuccess: () => {
      refetch();
    },
    onSettled: () => {
      setKey((key) => key + 1);
      addRequesterMutation.reset();
    },
  });

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

  const currentUserCanPerformActions =
    currentUserIsFromRequesterUnit ||
    currentUserIsObserver ||
    currentUserIsReferralUnitMember;

  return (
    <table className="referral-users-table">
      <thead>
        <th>Nom</th>
        <th>Service</th>
        <th>Rôle</th>
      </thead>
      <tbody>
        {referral.users.map((user) => (
          <ReferralUsersTableRow
            referral={referral}
            user={user}
            key={user.id}
          />
        ))}
      </tbody>
    </table>
  );
};
