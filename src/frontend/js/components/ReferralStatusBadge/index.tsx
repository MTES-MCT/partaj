import React from 'react';
import { FormattedMessage } from 'react-intl';

import { ReferralState } from 'types';
import { referralStateMessages } from 'utils/sharedMessages';
import { getEventStyle } from '../../utils/styles';

const classes = {
  [ReferralState.DRAFT]: 'badge-draft',
  [ReferralState.ANSWERED]: 'badge-answered',
  [ReferralState.ASSIGNED]: 'badge-assigned',
  [ReferralState.CLOSED]: 'badge-closed',
  [ReferralState.INCOMPLETE]: 'badge-incomplete',
  [ReferralState.IN_VALIDATION]: 'badge-invalidation',
  [ReferralState.PROCESSING]: 'badge-processing',
  [ReferralState.RECEIVED]: 'badge-received',
};

const stateStyles = {
  [ReferralState.DRAFT]: 'bg-gray-400',
  [ReferralState.ANSWERED]: 'bg-success-400',
  [ReferralState.ASSIGNED]: 'bg-primary-400',
  [ReferralState.CLOSED]: 'bg-danger-400',
  [ReferralState.INCOMPLETE]: 'bg-danger-400',
  [ReferralState.IN_VALIDATION]: 'bg-warning-400',
  [ReferralState.PROCESSING]: 'bg-primary-400',
  [ReferralState.RECEIVED]: 'bg-primary-400',
};

interface ReferralStatusBadgeProps {
  status: ReferralState;
}

export const ReferralStatusBadge: React.FC<ReferralStatusBadgeProps> = ({
  status,
}) => {
  return (
    <div
      className={`flex items-center capitalize space-x-1 badge whitespace-nowrap ${classes[status]}`}
    >
      <div className={`w-3 h-3 rounded-full ${stateStyles[status]}`}></div>
      <span className="text-black">
        <FormattedMessage {...referralStateMessages[status]} />
      </span>
    </div>
  );
};
