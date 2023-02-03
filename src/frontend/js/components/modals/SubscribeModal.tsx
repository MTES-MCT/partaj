import React, { useContext, useEffect, useState } from 'react';
import {
  NotificationType,
  ReferralLite,
  ReferralUserAction,
  ReferralUserLink,
  User,
  UserLite,
} from '../../types';
import { Nullable } from '../../types/utils';
import { defineMessages, useIntl } from 'react-intl';
import { APIRadioModal } from './APIRadioModal';
import {
  NotificationAllIcon,
  NotificationNoneIcon,
  NotificationRestrictedIcon,
} from '../Icons';
import { useCurrentUser } from '../../data/useCurrentUser';
import { ReferralContext } from '../../data/providers/ReferralProvider';
import { RoleModalContext } from '../../data/providers/RoleModalProvider';
import { ReferralUsersModalContext } from '../../data/providers/ReferralUsersModalProvider';
import { SubscribeModalContext } from '../../data/providers/SubscribeModalProvider';

const messages = defineMessages({
  modalTitle: {
    defaultMessage: 'Choose your notifications',
    description: 'Modal title',
    id: 'components.SubscribeModal.modalTitle',
  },
  allTitle: {
    defaultMessage: 'All',
    description: 'All item title',
    id: 'components.SubscribeModal.allTitle',
  },
  allDescription: {
    defaultMessage:
      'You will receive all event notifications from this referral',
    description: 'All item description',
    id: 'components.SubscribeModal.allDescription',
  },
  noneTitle: {
    defaultMessage: 'None',
    description: 'None item title',
    id: 'components.SubscribeModal.noneTitle',
  },
  noneDescription: {
    defaultMessage: "You won't receive any notifications from this referral.",
    description: 'None item description',
    id: 'components.SubscribeModal.noneDescription',
  },
  restrictedTitle: {
    defaultMessage: 'Restricted',
    description: 'Restricted item title',
    id: 'components.SubscribeModal.restrictedTitle',
  },
  restrictedDescription: {
    defaultMessage:
      'You will only receive essential notifications from this referral',
    description: 'Restricted text description',
    id: 'components.SubscribeModal.restrictedDescription',
  },
});

export const SubscribeModal = ({ onSuccess }: { onSuccess: Function }) => {
  const {
    index,
    showModal,
    user,
    referral,
    setShowModal,
    position,
    modalRef,
    action,
    additionalPayload,
  } = useContext(SubscribeModalContext);

  const intl = useIntl();
  const getSubscriptionType = (
    referral: Nullable<ReferralLite>,
    user: Nullable<UserLite>,
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

  const items = [
    {
      name: 'all',
      icon: <NotificationAllIcon color="black" />,
      value: NotificationType.ALL,
      title: intl.formatMessage(messages.allTitle),
      description: intl.formatMessage(messages.allDescription),
      action,
      payload: {
        notifications: NotificationType.ALL,
        ...additionalPayload,
      },
    },
    {
      name: 'restricted',
      icon: <NotificationRestrictedIcon color="black" />,
      value: NotificationType.RESTRICTED,
      title: intl.formatMessage(messages.restrictedTitle),
      description: intl.formatMessage(messages.restrictedDescription),
      action,
      payload: {
        notifications: NotificationType.RESTRICTED,
        ...additionalPayload,
      },
    },
    {
      name: 'none',
      icon: <NotificationNoneIcon color="black" />,
      value: NotificationType.NONE,
      title: intl.formatMessage(messages.noneTitle),
      description: intl.formatMessage(messages.noneDescription),
      action: ReferralUserAction.UPSERT_USER,
      payload: {
        notifications: NotificationType.NONE,
        ...additionalPayload,
      },
    },
  ];

  return (
    <>
      {referral && (
        <APIRadioModal
          value={subscriptionType}
          title={messages.modalTitle}
          showModal={showModal}
          setShowModal={setShowModal}
          referral={referral}
          onSuccess={(data: ReferralLite) => onSuccess(index, data)}
          items={items}
          size="384"
          position={position}
          modalRef={modalRef}
        />
      )}
    </>
  );
};
