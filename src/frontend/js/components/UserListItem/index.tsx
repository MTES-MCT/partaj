import { defineMessages } from '@formatjs/intl';
import * as types from '../../types';
import React, { Fragment, useContext } from 'react';
import { useUIDSeed } from 'react-uid';
import { useReferralAction, UseReferralActionData } from '../../data';
import { getUserFullname } from '../../utils/user';
import { appData } from '../../appData';
import { FormattedMessage } from 'react-intl';
import { Spinner } from '../Spinner';
import { ReferralContext } from '../../data/providers/ReferralProvider';

const messages = defineMessages({
  removeUser: {
    defaultMessage: 'Remove user from referral',
    description:
      'Accessible text for the button to remove a given user from a referral.',
    id: 'components.UserListItem.removeUser',
  },
  removingUser: {
    defaultMessage: 'Removing { user } from referral...',
    description:
      'Accessible text for the loader while removing a user from a referral.',
    id: 'components.UserListItem.removingUser',
  },
});

interface UserListItemProps {
  currentUserCanPerformActions: boolean;
  referral: types.Referral;
  user: types.ReferralUserLink;
  action: UseReferralActionData['action'];
  payload: any;
}

export const UserListItem: React.FC<UserListItemProps> = ({
  currentUserCanPerformActions,
  referral,
  user,
  action,
  payload,
}) => {
  const seed = useUIDSeed();
  const { refetch } = useContext(ReferralContext);
  const removeUserMutation = useReferralAction({
    onSuccess: () => {
      refetch();
    },
  });

  return (
    <li className="list-group-item block max-w-xl">
      <div className="flex flex-row space-x-32 items-center justify-between">
        <div>
          {user.unit_name ? (
            <>
              <div>{getUserFullname(user)}</div>
              <div className="text-gray-500">{user.unit_name}</div>
            </>
          ) : (
            <>
              <div className="text-gray-500"> Invitation en attente</div>
              <div className="text-gray-600">{user.email}</div>
            </>
          )}
        </div>
        {currentUserCanPerformActions ? (
          <div>
            <button
              type="button"
              aria-labelledby={seed(user)}
              aria-busy={removeUserMutation.isLoading}
              onClick={() =>
                removeUserMutation.mutate({
                  action,
                  payload,
                  referral,
                })
              }
            >
              {removeUserMutation.isIdle ? (
                <svg role="img" className="w-6 h-6 fill-current">
                  <use
                    xlinkHref={`${appData.assets.icons}#icon-user-disconnect`}
                  />
                  <title id={seed(user)}>
                    <FormattedMessage {...messages.removeUser} />
                  </title>
                </svg>
              ) : null}
              {removeUserMutation.isLoading ? (
                <Fragment>
                  <Spinner size="small">
                    <FormattedMessage
                      {...messages.removingUser}
                      values={{ user: getUserFullname(user) }}
                    />
                  </Spinner>
                </Fragment>
              ) : null}
            </button>
          </div>
        ) : null}
      </div>
    </li>
  );
};
