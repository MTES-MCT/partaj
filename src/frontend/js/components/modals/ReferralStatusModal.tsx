import React, { useContext, useEffect, useState } from 'react';
import { ReferralLite, ReferralStatus } from '../../types';
import { defineMessages, useIntl } from 'react-intl';
import { APIRadioModal } from './APIRadioModal';
import { RoleModalContext } from '../../data/providers/RoleModalProvider';
import { ReferralContext } from '../../data/providers/ReferralProvider';

const messages = defineMessages({
  modalTitle: {
    defaultMessage: 'Choose the sensitiveness',
    description: 'Modal title',
    id: 'components.ReferralStatusModal.modalTitle',
  },
  normalTitle: {
    defaultMessage: 'Normal',
    description: 'Normal item title',
    id: 'components.ReferralStatusModal.normalTitle',
  },
  normalDescription: {
    defaultMessage: 'This referral is not given special attention',
    description: 'Normal item description',
    id: 'components.ReferralStatusModal.normalDescription',
  },
  sensitiveTitle: {
    defaultMessage: 'High',
    description: 'Sensitive item title',
    id: 'components.ReferralStatusModal.sensitiveTitle',
  },
  sensitiveDescription: {
    defaultMessage:
      'Warns the hierarchy that this referral must be given special attention.',
    description: 'Sensitive item description',
    id: 'components.ReferralStatusModal.sensitiveDescription',
  },
});

export const ReferralStatusModal = () => {
  const { referral, setReferral } = useContext(ReferralContext);
  const {
    showModal,
    closeModal,
    position,
    modalRef,
    action,
    additionalPayload,
    updateValue,
    currentValue,
  } = useContext(RoleModalContext);

  const intl = useIntl();

  const items = [
    {
      name: 'normal',
      icon: null,
      value: ReferralStatus.NORMAL,
      title: intl.formatMessage(messages.normalTitle),
      description: intl.formatMessage(messages.normalDescription),
      action,
      payload: {
        status: ReferralStatus.NORMAL,
        ...additionalPayload,
      },
    },
    {
      name: 'sensitive',
      icon: null,
      value: ReferralStatus.SENSITIVE,
      title: intl.formatMessage(messages.sensitiveTitle),
      action,
      description: intl.formatMessage(messages.sensitiveDescription),
      payload: {
        status: ReferralStatus.SENSITIVE,
        ...additionalPayload,
      },
    },
  ];

  return (
    <>
      {referral && (
        <APIRadioModal
          path={`referrals/${referral.id}/`}
          value={currentValue}
          title={messages.modalTitle}
          onChange={(value: string) => updateValue(value)}
          showModal={showModal}
          closeModal={closeModal}
          referral={referral}
          onSuccess={(data: ReferralLite) => {
            setReferral(data);
            closeModal();
          }}
          items={items}
          size="384"
          position={position}
          modalRef={modalRef}
        />
      )}
    </>
  );
};
