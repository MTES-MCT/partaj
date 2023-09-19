import React, { Fragment, useContext, useState } from 'react';
import {
  getUnitNameOrPendingMessage,
  getUserFullname,
  getUserFullnameOrEmail,
} from '../../utils/user';
import { ReferralUserAction, ReferralUserLink } from 'types';
import { RoleButton } from '../buttons/RoleButton';
import { defineMessages, FormattedMessage } from 'react-intl';
import { Spinner } from '../Spinner';
import { useUIDSeed } from 'react-uid';
import { useReferralAction } from '../../data';
import { ReferralContext } from '../../data/providers/ReferralProvider';
import { RemoveUserIcon } from '../Icons';

interface ReferralUsersTableRowProps {
  user: ReferralUserLink;
  currentUserCanRemoveUser: boolean;
  currentUserCanChangeUserRole: boolean;
}

const messages = defineMessages({
  removingUser: {
    defaultMessage: 'Removing { user } from referral...',
    description:
      'Accessible text for the loader while removing a user from a referral.',
    id: 'components.ReferralUsersTableRow.removingUser',
  },
});

export const ReferralUsersTableRow: React.FC<ReferralUsersTableRowProps> = ({
  user,
  currentUserCanChangeUserRole,
  currentUserCanRemoveUser,
}) => {
  const { referral, refetch } = useContext(ReferralContext);
  const removeUserMutation = useReferralAction({
    onSuccess: () => {
      refetch();
    },
  });
  const seed = useUIDSeed();
  return (
    <tr>
      <td> {getUserFullnameOrEmail(user)}</td>
      <td> {getUnitNameOrPendingMessage(user)} </td>
      {currentUserCanChangeUserRole && (
        <td>
          <div className="flex relative justify-start">
            {referral && (
              <RoleButton
                action={ReferralUserAction.UPSERT_USER}
                user={user}
                referral={referral}
                role={user.role}
                payload={{ user: user.id }}
              />
            )}
          </div>
        </td>
      )}
      <td>
        {referral && currentUserCanRemoveUser && (
          <div className="flex relative justify-start">
            <button
              type="button"
              className="icon-button icon-button-white icon-button-hover-danger"
              aria-labelledby={seed(`remove-${user.id}`)}
              aria-busy={removeUserMutation.isLoading}
              onClick={() =>
                removeUserMutation.mutate({
                  action: 'remove_user',
                  payload: { user: user.id },
                  referral,
                })
              }
            >
              {removeUserMutation.isIdle && (
                <RemoveUserIcon className="w-6 h-6" />
              )}
              {removeUserMutation.isLoading ? (
                <>
                  <Spinner size="small">
                    <FormattedMessage
                      {...messages.removingUser}
                      values={{ user: getUserFullname(user) }}
                    />
                  </Spinner>
                </>
              ) : null}
            </button>
          </div>
        )}
      </td>
    </tr>
  );
};
