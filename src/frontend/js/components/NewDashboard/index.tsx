import React from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { ReferralTable } from './ReferralTable';
import { ReferralTabs } from './ReferralTabs';
import { useDashboardContext } from './DashboardContext';
import { DashboardFilters } from './DashboardFilters';

export const messages = defineMessages({
  dashboardTitle: {
    id: 'newDashboard.title',
    defaultMessage: 'OldDashboard',
    description: 'OldDashboard title',
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
  const { status } = useDashboardContext();

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">
        <FormattedMessage {...messages.dashboardTitle} />
      </h1>
      <DashboardFilters />
      <ReferralTabs />
      {status === 'loading' && <FormattedMessage {...messages.loading} />}
      {status === 'error' && (
        <FormattedMessage {...messages.error} values={{ error: 'TIEPS' }} />
      )}
      {status === 'success' && <ReferralTable />}
    </div>
  );
};
