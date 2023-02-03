import React, { useContext } from 'react';
import {
  Referral,
  ReferralLite,
  ReferralState,
  ReferralUserAction,
  ReferralUserLink,
  ReferralUserRole,
  UserLite,
} from '../../../types';
import { ReferralContext } from '../../../data/providers/ReferralProvider';
import { useReferralAction } from '../../../data';
import { getUserFullname } from '../../../utils/user';
import { RoleButton } from '../../buttons/RoleButton';
import { AddUserButton } from '../../buttons/AddUserButton';

interface UserItemProps {
  user: UserLite;
}

export const UserSearchListItem = ({ user }: UserItemProps) => {
  const { referral, setReferral } = useContext(ReferralContext);

  const addUserMutation = useReferralAction({
    onSuccess: (data: Referral) => {
      setReferral(data);
    },
    onSettled: () => {
      addUserMutation.reset();
    },
  });

  const getRoleType = (referral: ReferralLite, user: UserLite) => {
    const referralUser =
      user &&
      referral &&
      referral.users.find(
        (referralUserLink: ReferralUserLink) => referralUserLink.id === user.id,
      );

    return referralUser ? referralUser.role : null;
  };

  return (
    <div className="flex w-full items-center justify-start user-item">
      <div className="flex flex-col w-352">
        <p className="text-primary-1000">{getUserFullname(user)}</p>
        <p className="text-gray-400 text-sm">{user.unit_name}</p>
      </div>
      {user && referral && (
        <div className="flex justify-start">
          {referral.state === ReferralState.DRAFT ? (
            <AddUserButton
              role={ReferralUserRole.REQUESTER}
              referral={referral}
              user={user}
            />
          ) : (
            <RoleButton
              action={ReferralUserAction.UPSERT_USER}
              role={getRoleType(referral, user)}
              user={user}
              payload={{ user: user.id }}
            />
          )}
        </div>
      )}
    </div>
  );
};
