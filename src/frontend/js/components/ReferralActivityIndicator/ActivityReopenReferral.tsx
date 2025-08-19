import React from 'react';
import { ReferralActivityReopening } from 'types';

interface ActivityReopenReferralProps {
  activity: ReferralActivityReopening;
}

export const ActivityReopenReferral: React.FC<ActivityReopenReferralProps> = ({
  activity,
}) => (
  <>
    {activity.item_content_object.explanation.trim().length > 0 && (
      <div>
        <div className="max-w-md px-2 py-1 rounded border border-gray-400 bg-gray-200">
          {activity.item_content_object.explanation}
        </div>
      </div>
    )}
  </>
);
