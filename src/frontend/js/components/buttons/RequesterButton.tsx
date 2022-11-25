import React, { useEffect, useState } from 'react';
import { ReferralLite, User, UserLite } from '../../types';
import { Nullable } from '../../types/utils';
import { ToggleAPIButton } from './ToggleAPIButton';
import { FollowIcon } from '../Icons';

export const RequesterButton = ({
  user,
  referral,
  onClick,
}: {
  user: Nullable<User>;
  referral: ReferralLite;
  onClick: Function;
}) => {
  const isRequester = (
    referral: Nullable<ReferralLite>,
    user: Nullable<User>,
  ) => {
    return (
      user &&
      referral &&
      referral.users_all
        .map((requester: UserLite) => requester.id)
        .includes(user.id)
    );
  };

  const [isActive, setActive] = useState(isRequester(referral, user));

  useEffect(() => {
    setActive(isRequester(referral, user));
  }, [referral, user]);

  return (
    <>
      {referral && user && (
        <ToggleAPIButton
          referralId={referral.id}
          isActive={isActive}
          activeUrl="add_requester"
          inactiveUrl="remove_requester"
          body={{ requester: user.id }}
          iconActive={<FollowIcon size={8} color="primary500" />}
          iconInactive={<FollowIcon size={8} color="primary100" />}
          onSuccess={(data: any) => {
            onClick(data);
          }}
        />
      )}
    </>
  );
};
