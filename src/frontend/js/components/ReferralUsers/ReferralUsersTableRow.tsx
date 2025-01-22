import React, { Fragment, useContext, useState } from 'react';
import {
  getUnitNameOrPendingMessage,
  getUserFullname,
  getUserFullnameOrEmail,
} from '../../utils/user';
import { ReferralUserAction, ReferralUserLink } from 'types';
import { RoleButton } from '../buttons/RoleButton';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { Spinner } from '../Spinner';
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
  removeUser: {
    defaultMessage: 'Remove { user } from referral.',
    description: 'Accessible text for the remove user button.',
    id: 'components.ReferralUsersTableRow.removeUser',
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
  const intl = useIntl();
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
          <div className="flex relative justify-end">
            <button
              type="button"
              className="tooltip tooltip-info icon-button icon-button-white icon-button-hover-danger"
              aria-label={intl.formatMessage(messages.removeUser, {
                user: user.last_name ? getUserFullname(user) : user.email,
              })}
              data-tooltip={intl.formatMessage(messages.removeUser, {
                user: user.last_name ? getUserFullname(user) : user.email,
              })}
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
