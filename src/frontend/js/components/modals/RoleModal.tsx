import React, { useContext, useEffect, useState } from 'react';
import {
  ReferralLite,
  ReferralUserLink,
  ReferralUserRole,
  UserLite,
} from '../../types';
import { defineMessages, useIntl } from 'react-intl';
import { APIRadioModal } from './APIRadioModal';
import { RoleModalContext } from '../../data/providers/RoleModalProvider';
import { Nullable } from '../../types/utils';
import { ReferralUsersModalContext } from '../../data/providers/ReferralUsersModalProvider';
import { ReferralContext } from '../../data/providers/ReferralProvider';

const messages = defineMessages({
  modalTitle: {
    defaultMessage: 'Choose the role',
    description: 'Modal title',
    id: 'components.RoleModal.modalTitle',
  },
  requesterTitle: {
    defaultMessage: 'Requester',
    description: 'Requester item title',
    id: 'components.RoleModal.requesterTitle',
  },
  requesterDescription: {
    defaultMessage:
      'Person whose department is involved in this referral. Once added, the entire department will have read access to this referral.',
    description: 'Requester item description',
    id: 'components.RoleModal.requesterDescription',
  },
  observerTitle: {
    defaultMessage: 'Guest',
    description: 'Guest item title',
    id: 'components.RoleModal.observerTitle',
  },
  observerDescription: {
    defaultMessage:
      'Person interested in the progress and outcome of the referral. Once added, only this person will have read access to the referral.',
    description: 'Observer item description',
    id: 'components.RoleModal.observerDescription',
  },
});

export const RoleModal = () => {
  const { referral, setReferral } = useContext(ReferralContext);
  const {
    showModal,
    closeModal,
    user,
    position,
    modalRef,
    action,
    additionalPayload,
  } = useContext(RoleModalContext);
  const { closeRUModal } = useContext(ReferralUsersModalContext);

  const intl = useIntl();
  const getRoleType = (
    referral: Nullable<ReferralLite>,
    user: Nullable<UserLite>,
  ) => {
    const referralUser =
      user &&
      referral &&
      referral.users.find(
        (referralUserLink: ReferralUserLink) => referralUserLink.id === user.id,
      );

    return referralUser ? referralUser.role : null;
  };

  const [roleType, setRoleType] = useState(getRoleType(referral, user));

  useEffect(() => {
    setRoleType(getRoleType(referral, user));
  }, [showModal]);

  const items = [
    {
      name: 'requester',
      icon: null,
      value: ReferralUserRole.REQUESTER,
      title: intl.formatMessage(messages.requesterTitle),
      description: intl.formatMessage(messages.requesterDescription),
      action,
      payload: {
        role: ReferralUserRole.REQUESTER,
        ...additionalPayload,
      },
    },
    {
      name: 'observer',
      icon: null,
      value: ReferralUserRole.OBSERVER,
      title: intl.formatMessage(messages.observerTitle),
      action,
      description: intl.formatMessage(messages.observerDescription),
      payload: {
        role: ReferralUserRole.OBSERVER,
        ...additionalPayload,
      },
    },
  ];

  return (
    <>
      {referral && (
        <APIRadioModal
          value={roleType}
          title={messages.modalTitle}
          showModal={showModal}
          closeModal={closeModal}
          referral={referral}
          onSuccess={(data: ReferralLite) => {
            setReferral(data);
            closeModal();
            closeRUModal();
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
