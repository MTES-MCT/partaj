import React from 'react';
import { FormattedMessage } from 'react-intl';

import { ReferralState } from 'types';
import { referralStateMessages } from 'utils/sharedMessages';

const classes = {
  [ReferralState.DRAFT]: 'bg-grey-100',
  [ReferralState.CLOSED]: 'bg-grey-100',
  [ReferralState.RECEIVED]: 'bg-mallow-100',
  [ReferralState.ASSIGNED]: 'bg-lightblue-100',
  [ReferralState.PROCESSING]: 'bg-primary-100',
  [ReferralState.IN_VALIDATION]: 'bg-warning-200',
  [ReferralState.ANSWERED]: 'bg-success-100',
  [ReferralState.SPLITTING]: 'bg-primary-100',
  [ReferralState.RECEIVED_SPLITTING]: 'bg-primary-100',
};

const stateStyles = {
  [ReferralState.DRAFT]: 'bg-grey-400',
  [ReferralState.CLOSED]: 'bg-grey-1000',
  [ReferralState.RECEIVED]: 'bg-mallow-400',
  [ReferralState.ASSIGNED]: 'bg-lightblue-400',
  [ReferralState.PROCESSING]: 'bg-primary-400',
  [ReferralState.IN_VALIDATION]: 'bg-warning-400',
  [ReferralState.ANSWERED]: 'bg-success-400',
  [ReferralState.SPLITTING]: 'bg-primary-400',
  [ReferralState.RECEIVED_SPLITTING]: 'bg-primary-400',
};

interface ReferralStatusBadgeProps {
  status: ReferralState;
}

export const ReferralStatusBadge: React.FC<ReferralStatusBadgeProps> = ({
  status,
}) => {
  const badgeMessage = referralStateMessages.hasOwnProperty(status)
    ? referralStateMessages[status]
    : null;

  return (
    <div
      className={`font-marianne flex items-center capitalize badge whitespace-nowrap ${classes[status]}`}
    >
      <div className={`${stateStyles[status]}`}></div>
      <span className="text-s text-black uppercase mb-0.5">
        {badgeMessage && <FormattedMessage {...badgeMessage} />}
      </span>
    </div>
  );
};
