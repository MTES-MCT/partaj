import { defineMessages } from '@formatjs/intl';
import React, { useState } from 'react';
import { FormattedMessage } from 'react-intl';

import { appData } from 'appData';
import { DropdownButton } from 'components/DropdownMenu';
import { Tickbox } from 'components/Tickbox';
import { useReferralAction } from 'data';
import { Referral, Unit } from 'types';
import { AssignUnitModal } from './AssignUnitModal';

const messages = defineMessages({
  assignIt: {
    defaultMessage: 'Assign it',
    description:
      'Accessible CTA for the button to assign a unit to a referral.',
    id: 'components.ReferralDetailAssignment.ReferralUnitAssignmentButton.assignIt',
  },
  isAssigned: {
    defaultMessage: '{ unit } is assigned',
    description: 'Accessible helper to show which unit(s) are assigned.',
    id: 'components.ReferralDetailAssignment.ReferralUnitAssignmentButton.isAssigned',
  },
  isNotAssigned: {
    defaultMessage: '{ unit } is not assigned',
    description: 'Accessible helper to show which unit(s) are not assigned.',
    id: 'components.ReferralDetailAssignment.ReferralUnitAssignmentButton.isNotAssigned',
  },
  unassignIt: {
    defaultMessage: 'Unassign it',
    description:
      'Accessible CTA for the button to unassign a unit from a referral.',
    id: 'components.ReferralDetailAssignment.ReferralUnitAssignmentButton.unassignIt',
  },
});

interface ReferralUnitAssignmentButtonProps {
  isAssigned: boolean;
  referral: Referral;
  unit: Unit;
  setIsKeepDropdownMenu: (isOpen: boolean) => void;
}

export const ReferralUnitAssignmentButton: React.FC<
  ReferralUnitAssignmentButtonProps
> = ({ isAssigned, referral, unit, setIsKeepDropdownMenu }) => {
  const mutation = useReferralAction();
  const [isAssignUnitModalOpen, setIsAssignUnitModalOpen] = useState(false);
  return isAssigned ? (
    <React.Fragment>
      <div className="sr-only">
        <FormattedMessage
          {...messages.isAssigned}
          values={{ unit: unit.name }}
        />
      </div>
      <DropdownButton
        className="hover:bg-gray-100 focus:bg-gray-100"
        style={{ height: '3.5rem' }}
        isLoading={mutation.isLoading}
        onClick={() =>
          mutation.mutate({
            action: 'unassign_unit',
            payload: { unit: unit.id },
            referral,
          })
        }
      >
        <div className="sr-only">
          <FormattedMessage {...messages.unassignIt} />
        </div>
        <div aria-hidden={true} className="w-full flex flex-row items-center">
          <div className="flex flex-col flex-grow">
            <div
              className="truncate"
              style={{ maxWidth: 'calc(100% - 1.5rem)' }}
            >
              {unit.name}
            </div>
          </div>
          {mutation.isLoading ? null : <Tickbox isTicked={isAssigned} />}
        </div>
      </DropdownButton>
    </React.Fragment>
  ) : (
    <React.Fragment>
      <div className="sr-only">
        <FormattedMessage
          {...messages.isNotAssigned}
          values={{ unit: unit.name }}
        />
      </div>
      <DropdownButton
        className="hover:bg-gray-100 focus:bg-gray-100"
        style={{ height: '3.5rem' }}
        isLoading={mutation.isLoading}
        onClick={() => {
          setIsKeepDropdownMenu(true);
          setIsAssignUnitModalOpen(true);
        }}
      >
        <div className="sr-only">
          <FormattedMessage {...messages.assignIt} />
        </div>
        <div aria-hidden={true} className="w-full flex flex-row items-center">
          <div className="flex flex-col flex-grow">
            <div
              className="truncate"
              style={{ maxWidth: 'calc(100% - 1.5rem)' }}
            >
              {unit.name}
            </div>
          </div>
          {mutation.isLoading ? null : (
            <svg role="img" className="fill-current block w-6 h-6">
              <use xlinkHref={`${appData.assets.icons}#icon-newwindow`} />
            </svg>
          )}
        </div>
      </DropdownButton>
      <AssignUnitModal
        {...{
          isAssignUnitModalOpen,
          setIsAssignUnitModalOpen,
          referral,
          unit,
          setIsKeepDropdownMenu,
        }}
      />
    </React.Fragment>
  );
};
