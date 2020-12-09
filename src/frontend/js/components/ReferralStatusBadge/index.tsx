import React from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';

import { ReferralState } from 'types';

const messages = defineMessages({
  [ReferralState.ANSWERED]: {
    defaultMessage: 'Answered',
    description: 'Text for the referral status badge for this state.',
    id: 'components.ReferralStatusBadge.answered',
  },
  [ReferralState.ASSIGNED]: {
    defaultMessage: 'Assigned',
    description: 'Text for the referral status badge for this state.',
    id: 'components.ReferralStatusBadge.assigned',
  },
  [ReferralState.CLOSED]: {
    defaultMessage: 'Closed',
    description: 'Text for the referral status badge for this state.',
    id: 'components.ReferralStatusBadge.closed',
  },
  [ReferralState.INCOMPLETE]: {
    defaultMessage: 'Incomplete',
    description: 'Text for the referral status badge for this state.',
    id: 'components.ReferralStatusBadge.incomplete',
  },
  [ReferralState.RECEIVED]: {
    defaultMessage: 'Received',
    description: 'Text for the referral status badge for this state.',
    id: 'components.ReferralStatusBadge.received',
  },
});

const classes = {
  [ReferralState.ANSWERED]: 'border-green-600 text-green-600 bg-green-200',
  [ReferralState.ASSIGNED]: 'border-yellow-700 text-yellow-700 bg-yellow-200',
  [ReferralState.CLOSED]: 'border-red-600 text-red-600 bg-red-200',
  [ReferralState.INCOMPLETE]: 'border-gray-600 text-gray-600 bg-gray-200',
  [ReferralState.RECEIVED]: 'border-purple-600 text-purple-600 bg-purple-100',
};

interface ReferralStatusBadgeProps {
  status: ReferralState;
}

export const ReferralStatusBadge: React.FC<ReferralStatusBadgeProps> = ({
  status,
}) => {
  return (
    <div
      className={`inline-block px-3 py-1 capitalize rounded-sm border-2 ${classes[status]}`}
    >
      <FormattedMessage {...messages[status]} />
    </div>
  );
};
