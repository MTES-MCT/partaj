import React from 'react';
import { ReferralActivityClosed } from 'types';

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
