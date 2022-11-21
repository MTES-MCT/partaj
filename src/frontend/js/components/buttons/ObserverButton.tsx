import React, { useEffect, useState } from 'react';
import { ReferralLite, User, UserLite } from '../../types';
import { Nullable } from '../../types/utils';
import { ToggleAPIButton } from './ToggleAPIButton';
import { EyeIcon } from '../Icons';

export const ObserverButton = ({
  user,
  referral,
  onClick,
}: {
  user: Nullable<User>;
  referral: ReferralLite;
  onClick: Function;
}) => {
  const isObserver = (referral: ReferralLite, user: Nullable<User>) => {
    return (
      user &&
      referral &&
      referral.observers
        .map((requester: UserLite) => requester.id)
        .includes(user.id)
    );
  };

  const [isActive, setActive] = useState(isObserver(referral, user));

  useEffect(() => {
    setActive(isObserver(referral, user));
  }, [referral, user]);

  return (
    <>
      {referral && user && (
        <ToggleAPIButton
          referralId={referral.id}
          isActive={isActive}
          activeUrl="add_observer"
          inactiveUrl="remove_observer"
          body={{ observer: user.id }}
          iconActive={<EyeIcon size={8} color="primary500" />}
          iconInactive={<EyeIcon size={8} color="primary100" />}
          onSuccess={(data: any) => {
            onClick(data);
          }}
        />
      )}
    </>
  );
};
