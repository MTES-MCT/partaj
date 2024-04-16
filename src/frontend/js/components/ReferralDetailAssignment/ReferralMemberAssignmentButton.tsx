import React, { useContext } from 'react';

import { getLastItem } from 'utils/string';
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
  const relevantUnits = referral.units.filter((unit) =>
    unit.members.some((unitMember) => unitMember.id === member.id),
  );
  const relevantUnit = relevantUnits[0];

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
          <div className="flex flex-row text-gray-500">
            {relevantUnits.length > 1 ? (
              relevantUnits.map((unit, index) => (
                <div key={unit.name}>
                  {index > 0 ? ', ' : ''}
                  {getLastItem(unit.name, '/')}
                </div>
              ))
            ) : (
              <div>{relevantUnit?.name}</div>
            )}
          </div>
        </div>
        {mutation.isLoading ? null : (
          <Tickbox aria-hidden={true} isTicked={isAssigned} />
        )}
      </div>
    </DropdownButton>
  );
};
