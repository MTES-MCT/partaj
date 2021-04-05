import React from 'react';

import { DropdownButton } from 'components/DropdownMenu';
import { Tickbox } from 'components/Tickbox';
import { useReferralAction } from 'data';
import { Referral, Unit } from 'types';

interface ReferralUnitAssignmentButtonProps {
  isAssigned: boolean;
  referral: Referral;
  unit: Unit;
}

export const ReferralUnitAssignmentButton: React.FC<ReferralUnitAssignmentButtonProps> = ({
  isAssigned,
  referral,
  unit,
}) => {
  const mutation = useReferralAction();

  return (
    <DropdownButton
      className="hover:bg-gray-100 focus:bg-gray-100"
      style={{ height: '3.5rem' }}
      isLoading={mutation.isLoading}
      aria-pressed={isAssigned}
      onClick={() =>
        mutation.mutate({
          action: isAssigned ? 'unassign_unit' : 'assign_unit',
          payload: { unit: unit.id },
          referral,
        })
      }
    >
      <div className="w-full flex flex-row items-center">
        <div className="flex flex-col flex-grow">
          <div className="truncate" style={{ maxWidth: 'calc(100% - 1.5rem)' }}>
            {unit.name}
          </div>
        </div>
        {mutation.isLoading ? null : (
          <Tickbox aria-hidden={true} isTicked={isAssigned} />
        )}
      </div>
    </DropdownButton>
  );
};
