import React, { useEffect, useState } from 'react';
import { ReferralLite, User, UserLite } from '../../types';
import { Nullable } from '../../types/utils';
import { defineMessages } from 'react-intl';
import { APIRadioModal } from './APIRadioModal';

const messages = defineMessages({
  modalTitle: {
    defaultMessage: 'Choose your notifications',
    description: 'Modal title',
    id: 'components.SubscribeModal.modalTitle',
  },
});

export const SubscribeModal = ({
  user,
  referral,
  showModal,
  setShowModal,
  onSuccess,
}: {
  user: Nullable<User>;
  referral: ReferralLite;
  showModal: boolean;
  setShowModal: Function;
  onSuccess: Function;
}) => {
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

  const getRoleType = (referral: ReferralLite, user: Nullable<User>) => {
    const referralUser =
      user &&
      referral &&
      referral.users.find((userLite: UserLite) => userLite.id === user.id);

    return referralUser ? referralUser.role : null;
  };

  const [subscriptionType, setSubscriptionType] = useState(
    getSubscriptionType(referral, user),
  );

  useEffect(() => {
    setSubscriptionType(getSubscriptionType(referral, user));
  }, [referral, user]);

  return (
    <APIRadioModal
      setShowModal={setShowModal}
      title={messages.modalTitle}
      showModal={showModal}
      user={user}
      referral={referral}
      onSuccess={onSuccess}
    />
  );
};
