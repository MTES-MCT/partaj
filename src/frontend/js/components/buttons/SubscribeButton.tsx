import React, { useEffect, useState } from 'react';
import { NotificationType, ReferralLite, Requester, User } from '../../types';
import { Nullable } from '../../types/utils';
import { defineMessages, FormattedMessage } from 'react-intl';
import {
  ChevronBottomIcon,
  NotificationAllIcon,
  NotificationNoneIcon,
  NotificationRestrictedIcon,
} from '../Icons';

const messages = defineMessages({
  inactive: {
    defaultMessage: 'Subscribe',
    description: 'Subscribe button title when inactiveactive',
    id: 'components.SubscribeButton.inactive',
  },
  active: {
    defaultMessage: 'Referral Member',
    description: 'Subscribe button title when active',
    id: 'components.SubscribeButton.active',
  },
});

export const SubscribeButton = ({
  user,
  referral,
  onClick,
  setShowModal,
}: {
  user: Nullable<User>;
  referral: ReferralLite;
  onClick: Function;
  setShowModal: Function;
}) => {
  const getSubscriptionType = (
    referral: ReferralLite,
    user: Nullable<User>,
  ) => {
    const requester =
      user &&
      referral &&
      referral.requesters.find(
        (requester: Requester) => requester.user_id === user.id,
      );

    return requester ? requester.notifications : null;
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
          className={`subscribe-button ${
            subscriptionType
              ? 'subscribe-button-active'
              : 'subscribe-button-inactive'
          }`}
          onClick={(e) => {
            /* stopPropagation is used to avoid redirection if the button is nested inside a link */
            setShowModal(true);
            e.stopPropagation();
            onClick();
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
