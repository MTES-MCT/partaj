import React, { useContext, useEffect, useRef, useState } from 'react';
import {
  NotificationType,
  ReferralLite,
  ReferralUserAction,
  User,
  UserLite,
} from '../../types';
import { Nullable } from '../../types/utils';
import { defineMessages, FormattedMessage } from 'react-intl';
import {
  ChevronBottomIcon,
  NotificationAllIcon,
  NotificationNoneIcon,
  NotificationRestrictedIcon,
} from '../Icons';
import { SubscribeModalContext } from '../../data/providers/SubscribeModalProvider';

const messages = defineMessages({
  inactive: {
    defaultMessage: 'Follow',
    description: 'Subscribe button title when inactive',
    id: 'components.SubscribeButton.inactive',
  },
  active: {
    defaultMessage: 'Following',
    description: 'Subscribe button title when active',
    id: 'components.SubscribeButton.active',
  },
});

export const SubscribeButton = ({
  user,
  referral,
  payload,
  index,
}: {
  user: Nullable<User>;
  referral: ReferralLite;
  payload: any;
  index: number;
}) => {
  const buttonRef = useRef(null);
  const { displayModal } = useContext(SubscribeModalContext);

  const getSubscriptionType = (
    referral: ReferralLite,
    user: Nullable<User>,
  ) => {
    const referralUser =
      user &&
      referral &&
      referral.users.find((userLite: UserLite) => userLite.id === user.id);

    return referralUser ? referralUser.notifications : null;
  };

  const [subscriptionType, setSubscriptionType] = useState(
    getSubscriptionType(referral, user),
  );

  useEffect(() => {
    setSubscriptionType(getSubscriptionType(referral, user));
  }, [referral, user]);

  return (
    <>
      {referral && user && (
        <button
          ref={buttonRef}
          className={`action-button ${
            subscriptionType ? 'action-button-blue' : 'action-button-white'
          }`}
          onClick={(e) => {
            /* stopPropagation is used to avoid redirection if the button is nested inside a link */
            e.stopPropagation();
            displayModal({
              user,
              buttonRef,
              action: ReferralUserAction.UPSERT_USER,
              currentReferral: referral,
              payload,
              index,
            });
          }}
        >
          <>
            {subscriptionType ? (
              <>
                <>
                  {subscriptionType === NotificationType.ALL && (
                    <NotificationAllIcon />
                  )}
                  {subscriptionType === NotificationType.RESTRICTED && (
                    <NotificationRestrictedIcon />
                  )}
                  {subscriptionType === NotificationType.NONE && (
                    <NotificationNoneIcon />
                  )}
                </>
                <span>
                  <FormattedMessage {...messages.active} />
                </span>
                <ChevronBottomIcon />
              </>
            ) : (
              <>
                <span>
                  <FormattedMessage {...messages.inactive} />
                </span>
                <ChevronBottomIcon
                  color={subscriptionType ? 'white' : 'primary-1000'}
                />
              </>
            )}
          </>
        </button>
      )}
    </>
  );
};
