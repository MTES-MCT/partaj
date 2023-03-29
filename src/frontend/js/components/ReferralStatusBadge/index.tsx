import React from 'react';
import { FormattedMessage } from 'react-intl';

import { ReferralState } from 'types';
import { referralStateMessages } from 'utils/sharedMessages';

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

interface ReferralStatusBadgeProps {
  status: ReferralState;
}

export const ReferralStatusBadge: React.FC<ReferralStatusBadgeProps> = ({
  status,
}) => {
  return (
    <div className={`badge capitalize whitespace-no-wrap ${classes[status]}`}>
      <FormattedMessage {...referralStateMessages[status]} />
    </div>
  );
};
