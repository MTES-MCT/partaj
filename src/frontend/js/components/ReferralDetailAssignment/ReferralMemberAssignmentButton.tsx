import React, { useContext } from 'react';

import { DropdownButton } from 'components/DropdownMenu';
import { Tickbox } from 'components/Tickbox';
import { useReferralAction } from 'data';
import { Referral, UserLite } from 'types';
import { getUserFullname } from 'utils/user';
import { ReferralContext } from '../../data/providers/ReferralProvider';

interface ReferralMemberAssignmentButtonProps {
  isAssigned: boolean;
  member: UserLite;
  referral: Referral;
}

export const ReferralMemberAssignmentButton: React.FC<ReferralMemberAssignmentButtonProps> = ({
  isAssigned,
  member,
  referral,
}) => {
  const { refetch } = useContext(ReferralContext);
  const mutation = useReferralAction({ onSuccess: () => refetch() });
  const relevantUnit = referral.units.filter((unit) =>
    unit.members.some((unitMember) => unitMember.id === member.id),
  )[0];

  return (
    <DropdownButton
      className="hover:bg-gray-100 focus:bg-gray-100"
      isLoading={mutation.isLoading}
      aria-pressed={isAssigned}
      onClick={() =>
        mutation.mutate({
          action: isAssigned ? 'unassign' : 'assign',
          payload: { assignee: member.id },
          referral,
        })
      }
    >
      <div className="w-full flex flex-row items-center">
        <div className="flex flex-col flex-grow">
          <div className="truncate" style={{ maxWidth: 'calc(100% - 1.5rem)' }}>
            {getUserFullname(member)}
          </div>
          {relevantUnit ? (
            <div className="text-gray-500">{relevantUnit.name}</div>
          ) : null}
        </div>
        {mutation.isLoading ? null : (
          <Tickbox aria-hidden={true} isTicked={isAssigned} />
        )}
      </div>
    </DropdownButton>
  );
};
