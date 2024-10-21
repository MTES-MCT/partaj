import React, { ChangeEvent, useState } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { Redirect } from 'react-router';

import { useFeatureFlag } from 'data';
import { ActiveFilters } from './ActiveFilters';
import { DashboardFilters } from './DashboardFilters';
import { ReferralTable } from './ReferralTable';
import { useNewDashboard } from './useNewDashboard';
import { ReferralTabs } from './ReferralTabs';
import { DashboardProvider } from './DashboardContext';

export const messages = defineMessages({
  dashboardTitle: {
    id: 'newDashboard.title',
    defaultMessage: 'Dashboard',
    description: 'Dashboard title',
  },
  loading: {
    id: 'newDashboard.loading',
    defaultMessage: 'Loading...',
    description: 'Loading message',
  },
  error: {
    id: 'newDashboard.error',
    defaultMessage: 'Error: {error}',
    description: 'Error message',
  },
});

export const NewDashboard: React.FC = () => {
  const [isFeatureFlagActive, setFeatureFlagActive] = useState<boolean>(false);

  const {
    isLoading,
    error,
    themeOptions,
    requesterOptions,
    requesterUnitOptions,
    userOptions,
    unitOptions,
  } = useNewDashboard();

  const { status } = useFeatureFlag('new_dashboard', {
    onSuccess: (data) => {
      setFeatureFlagActive(data.is_active);
    },
  });

  if (status === 'loading') {
    return <div />;
  } else if (status === 'error' || !isFeatureFlagActive) {
    return <Redirect to={`/dashboard`} />;
  }

  return (
    <DashboardProvider>
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">
          <FormattedMessage {...messages.dashboardTitle} />
        </h1>
        <DashboardFilters
          themeOptions={themeOptions}
          requesterOptions={requesterOptions}
          requesterUnitOptions={requesterUnitOptions}
          userOptions={userOptions}
          unitOptions={unitOptions}
        />
        <ActiveFilters
          themeOptions={themeOptions}
          requesterOptions={requesterOptions}
          requesterUnitOptions={requesterUnitOptions}
          userOptions={userOptions}
          unitOptions={unitOptions}
        />
        <ReferralTabs />
        {isLoading || error ? (
          <div>
            {isLoading ? (
              <FormattedMessage {...messages.loading} />
            ) : (
              <FormattedMessage
                {...messages.error}
                values={{ error: (error as Error).message }}
              />
            )}
          </div>
        ) : (
          <ReferralTable />
        )}
      </div>
    </DashboardProvider>
  );
};
