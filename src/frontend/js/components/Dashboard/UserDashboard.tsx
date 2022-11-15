import React from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { Route, Switch, useRouteMatch } from 'react-router-dom';

import { ReferralDetail } from 'components/ReferralDetail';
import { Crumb } from 'components/BreadCrumbs';
import { UserDashboardIndex } from '../DashboardIndex/UserDashboardIndex';

const messages = defineMessages({
  crumbReferral: {
    defaultMessage: 'Referral',
    description: 'Title for the breadcrumb for the referral detail view.',
    id: 'components.UserDashboard.crumbReferral',
  },
  title: {
    defaultMessage: 'Dashboard',
    description: 'Title for the dashboard view.',
    id: 'components.UserDashboard.title',
  },
  export: {
    defaultMessage: 'Export all referrals',
    description: 'Message for export button.',
    id: 'components.UserDashboard.export',
  },
});

export const UserDashboard: React.FC = () => {
  const { path } = useRouteMatch();

  return (
    <section className="container mx-auto flex-grow flex flex-col">
      <Switch>
        <Route path={`${path}/referral-detail/:referralId`}>
          <ReferralDetail />
          <Crumb
            key="dashboard-referral-detail"
            title={<FormattedMessage {...messages.crumbReferral} />}
          />
        </Route>

        <Route path={path}>
          <div style={{ width: '60rem' }}>
            <h1 className=" float-left text-4xl my-4">
              <FormattedMessage {...messages.title} />
            </h1>
          </div>
          <UserDashboardIndex />
        </Route>
      </Switch>
    </section>
  );
};
