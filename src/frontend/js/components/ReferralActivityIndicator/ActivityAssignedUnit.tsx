import React from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';

import { GenericErrorMessage } from 'components/GenericErrorMessage';
import { Spinner } from 'components/Spinner';
import { useReferral } from 'data';
import { ReferralActivityAssignedUnit } from 'types';

interface ActivityAssignedUnitProps {
  activity: ReferralActivityAssignedUnit;
}

export const ActivityAssignedUnit: React.FC<ActivityAssignedUnitProps> = ({
  activity,
}) => (
  <div>
    <div className="overflow-y-auto max-w-md px-2 py-1 rounded border border-gray-400 bg-gray-200 ">
      {activity.message}
    </div>
  </div>
);
