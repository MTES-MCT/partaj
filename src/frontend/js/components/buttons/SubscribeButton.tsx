import React from 'react';
import { ReferralLite, User, UserLite } from '../../types';
import { Nullable } from '../../types/utils';
import { ToggleAPIButton } from './ToggleAPIButton';

export const SubscribeButton = ({
  referral,
  user,
}: {
  referral: ReferralLite;
  user: Nullable<User>;
}) => {
  const isFollowing = (referral: ReferralLite, user: Nullable<User>) => {
    console.log('referral.users');
    console.log(referral.users);
    console.log('referral.observers');
    console.log(referral.observers);

    return !!(
      user &&
      [...referral.users, ...referral.observers]
        .map((requester: UserLite) => requester.id)
        .includes(user.id)
    );
  };

  return (
    <>
      {referral && user && (
        <ToggleAPIButton
          referralId={referral.id}
          defaultActiveState={isFollowing(referral, user)}
        />
      )}
    </>
  );
};
