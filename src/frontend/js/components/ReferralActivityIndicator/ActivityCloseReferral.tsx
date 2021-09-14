import { DateTime, Duration } from 'luxon';
import React from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';

import { GenericErrorMessage } from 'components/GenericErrorMessage';
import { Spinner } from 'components/Spinner';
import { useReferral } from 'data';
import { Referral, ReferralActivityClosed } from 'types';

interface ActivityCloseReferralProps {
  activity: ReferralActivityClosed;
}

export const ActivityCloseReferral: React.FC<ActivityCloseReferralProps> = ({
  activity,
}) => (
  <div>
    <div className="max-w-md px-2 py-1 rounded border border-gray-400 bg-gray-200">
      {activity.message}
    </div>
  </div>
);
