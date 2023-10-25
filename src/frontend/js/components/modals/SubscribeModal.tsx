import React, { useContext } from 'react';
import {
  NotificationType,
  ReferralLite,
  ReferralUserAction,
} from '../../types';
import { defineMessages, useIntl } from 'react-intl';
import { APIRadioModal } from './APIRadioModal';
import {
  NotificationAllIcon,
  NotificationNoneIcon,
  NotificationRestrictedIcon,
} from '../Icons';
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
    closeModal,
    updateValue,
    currentValue,
    referral,
    position,
    modalRef,
    action,
    additionalPayload,
  } = useContext(SubscribeModalContext);

  const intl = useIntl();

  const items = [
    {
      name: 'all',
      icon: <NotificationAllIcon className="fill-black" />,
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
      icon: <NotificationRestrictedIcon className="fill-black" />,
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
      icon: <NotificationNoneIcon className="fill-black" />,
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
          path={`referrals/${referral.id}/`}
          referral={referral}
          value={currentValue}
          onChange={(value: string) => updateValue(value)}
          title={messages.modalTitle}
          showModal={showModal}
          closeModal={closeModal}
          onSuccess={(data: ReferralLite) => {
            closeModal();
            onSuccess(index, data);
          }}
          items={items}
          maxWidth="max-w-sm"
          position={position}
          modalRef={modalRef}
        />
      )}
    </>
  );
};
