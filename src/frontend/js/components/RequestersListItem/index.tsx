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
    id: 'components.RequestersListItem.removeUser',
  },
  removingUser: {
    defaultMessage: 'Removing { user } from referral...',
    description:
      'Accessible text for the loader while removing a user from a referral.',
    id: 'components.RequestersListItem.removingUser',
  },
});

interface RequestersListItem {
  currentUserCanPerformActions: boolean;
  referral: types.Referral;
  user: types.User;
  action: UseReferralActionData['action'];
  payload: any;
}

export const RequestersListItem: React.FC<RequestersListItem> = ({
  currentUserCanPerformActions,
  referral,
  user,
  action,
  payload,
}) => {
  const seed = useUIDSeed();
  const { refetch } = useContext(ReferralContext);
  const removeRequesterMutation = useReferralAction({
    onSuccess: () => {
      refetch();
    },
  });

  let obj: UseReferralActionData;

  return (
    <li className="list-group-item block">
      <div className="flex flex-row space-x-32 items-center justify-between">
        <div>
          <div>{getUserFullname(user)}</div>
          <div className="text-gray-500">{user.unit_name}</div>
        </div>
        {currentUserCanPerformActions ? (
          <div>
            <button
              type="button"
              aria-labelledby={seed(user)}
              aria-busy={removeRequesterMutation.isLoading}
              onClick={() =>
                removeRequesterMutation.mutate({
                  action,
                  payload,
                  referral,
                })
              }
            >
              {removeRequesterMutation.isIdle ? (
                <svg role="img" className="w-6 h-6 fill-current">
                  <use
                    xlinkHref={`${appData.assets.icons}#icon-user-disconnect`}
                  />
                  <title id={seed(user)}>
                    <FormattedMessage {...messages.removeUser} />
                  </title>
                </svg>
              ) : null}
              {removeRequesterMutation.isLoading ? (
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
