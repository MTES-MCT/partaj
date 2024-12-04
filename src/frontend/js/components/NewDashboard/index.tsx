import React from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { ReferralTable } from './ReferralTable';
import { ReferralTabs } from './ReferralTabs';
import { useDashboardContext } from './DashboardContext';
import { DashboardFilters } from './DashboardFilters';
import { Route, Switch, useLocation, useRouteMatch } from 'react-router-dom';
import { ReferralDetail } from '../ReferralDetail';
import { Crumb } from '../BreadCrumbs';
import { DashboardIndex } from '../DashboardIndex';

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
  crumbReferral: {
    defaultMessage: 'Referral',
    description: 'Title for the breadcrumb for the referral detail view.',
    id: 'components.OldDashboard.crumbReferral',
  },
});

export const NewDashboard: React.FC = () => {
  const { status } = useDashboardContext();
  const { path } = useRouteMatch();
  return (
    <div className="p-4">
      <Switch>
        <Route path={`${path}/referral-detail/:referralId`}>
          <ReferralDetail />
          <Crumb
            key="dashboard-referral-detail"
            title={<FormattedMessage {...messages.crumbReferral} />}
          />
        </Route>

        <Route path={path}>
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
        </Route>
      </Switch>
    </div>
  );
};
