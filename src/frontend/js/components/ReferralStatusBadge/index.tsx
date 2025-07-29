import React from 'react';
import { FormattedMessage } from 'react-intl';

import { ReferralState } from 'types';
import { referralStateMessages } from 'utils/sharedMessages';
import { classes, stateStyles } from './styles';

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
