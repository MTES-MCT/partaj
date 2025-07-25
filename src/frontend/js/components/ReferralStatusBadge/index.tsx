import React from 'react';
import { FormattedMessage } from 'react-intl';

import { ReferralState } from 'types';
import { referralStateMessages } from 'utils/sharedMessages';

const classes = {
  [ReferralState.DRAFT]: 'bg-grey-100',
  [ReferralState.CLOSED]: 'bg-grey-100',
  [ReferralState.RECEIVED]: 'bg-mallow-100',
  [ReferralState.RECEIVED_VISIBLE]: 'bg-mallow-100',
  [ReferralState.ASSIGNED]: 'bg-lightblue-100',
  [ReferralState.PROCESSING]: 'bg-primary-100',
  [ReferralState.IN_VALIDATION]: 'bg-warning-200',
  [ReferralState.ANSWERED]: 'bg-success-100',
  [ReferralState.RECEIVED_SPLITTING]: 'bg-dsfr-orange-200',
  [ReferralState.SPLITTING]: 'bg-dsfr-orange-200',
};

const stateStyles = {
  [ReferralState.DRAFT]: 'bg-grey-400',
  [ReferralState.CLOSED]: 'bg-grey-1000',
  [ReferralState.RECEIVED]: 'bg-mallow-400',
  [ReferralState.RECEIVED_VISIBLE]: 'bg-mallow-400',
  [ReferralState.ASSIGNED]: 'bg-lightblue-400',
  [ReferralState.PROCESSING]: 'bg-primary-400',
  [ReferralState.IN_VALIDATION]: 'bg-warning-400',
  [ReferralState.ANSWERED]: 'bg-success-400',
  [ReferralState.SPLITTING]: 'bg-dsfr-orange-500',
  [ReferralState.RECEIVED_SPLITTING]: 'bg-dsfr-orange-500',
};

interface ReferralStatusBadgeProps {
  status: ReferralState;
  size?: 'base' | 'sm';
}

export const ReferralStatusBadge: React.FC<ReferralStatusBadgeProps> = ({
  status,
  size = 'base',
}) => {
  const badgeMessage = referralStateMessages.hasOwnProperty(status)
    ? referralStateMessages[status]
    : null;

  const getTextSize = (size: 'base' | 'sm') => {
    switch (size) {
      case 'sm':
        return 'text-xxs';
      default:
        return 'text-s';
    }
  };

  return (
    <div
      className={`font-marianne flex items-center capitalize ${
        size === 'sm' ? 'badge-sm' : 'badge'
      } whitespace-nowrap ${classes[status]}`}
    >
      <div className={`${stateStyles[status]}`}></div>
      <span className={`${getTextSize(size)} text-black uppercase mb-0.5`}>
        {badgeMessage && <FormattedMessage {...badgeMessage} />}
      </span>
    </div>
  );
};
