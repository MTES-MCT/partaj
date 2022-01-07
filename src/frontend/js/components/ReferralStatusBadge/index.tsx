import React from 'react';
import { FormattedMessage } from 'react-intl';

import { ReferralState } from 'types';
import { referralStateMessages } from 'utils/sharedMessages';

const classes = {
  [ReferralState.ANSWERED]:
    'border-success-500 text-success-500 bg-success-transparent-8p',
  [ReferralState.ASSIGNED]:
    'border-warning-700 text-warning-800 bg-warning-transparent-8p',
  [ReferralState.CLOSED]:
    'border-danger-600 text-danger-800 bg-danger-transparent-8p',
  [ReferralState.INCOMPLETE]:
    'border-gray-500 text-gray-500 bg-gray-transparent-8p',
  [ReferralState.IN_VALIDATION]:
    'border-primary-500 text-primary-500 bg-primary-transparent-8p',
  [ReferralState.PROCESSING]:
    'border-primary-500 text-primary-500 bg-primary-transparent-8p',
  [ReferralState.RECEIVED]:
    'border-primary-500 text-primary-500 bg-primary-transparent-8p',
};

interface ReferralStatusBadgeProps {
  status: ReferralState;
}

export const ReferralStatusBadge: React.FC<ReferralStatusBadgeProps> = ({
  status,
}) => {
  return (
    <div
      className={`inline-block px-3 py-1 capitalize rounded-sm border-2 whitespace-no-wrap ${classes[status]}`}
    >
      <FormattedMessage {...referralStateMessages[status]} />
    </div>
  );
};
