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
import { Referral, ReferralLite, ReferralUserLink, User } from 'types';
import { SubscribeModal } from '../modals/SubscribeModal';

const messages = defineMessages({
  title: {
    defaultMessage: 'Business service',
    description: 'Title for users block',
    id: 'components.ReferralUsersBlock.title',
  },
});

interface ReferralUsersTableRowProps {
  user: ReferralUserLink;
  referral: Referral;
}

export const ReferralUsersTableRow: React.FC<ReferralUsersTableRowProps> = ({
  user,
  referral,
}) => {
  const [showModal, setShowModal] = useState(false);
  return (
    <tr>
      <td> {getUserFullnameOrEmail(user)}</td>
      <td> {getUnitNameOrPendingMessage(user)} </td>
      <td>
        <ReferralUserRoleButton
          user={user}
          setShowModal={setShowModal}
          onClick={() => setShowModal(true)}
        />
        <SubscribeModal
          setShowModal={setShowModal}
          showModal={showModal}
          user={(user as unknown) as User}
          referral={(referral as unknown) as ReferralLite}
          onSuccess={(data: any) => console.log('ACTION')}
        />
      </td>
    </tr>
  );
};
