import React from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { Route, Switch, useRouteMatch } from 'react-router-dom';

import { DashboardIndex } from 'components/DashboardIndex';
import { ReferralDetail } from 'components/ReferralDetail';
import { Crumb } from 'components/BreadCrumbs';

const messages = defineMessages({
  crumbReferral: {
    defaultMessage: 'Referral',
    description: 'Title for the breadcrumb for the referral detail view.',
    id: 'components.Dashboard.crumbReferral',
  },
  title: {
    defaultMessage: 'Dashboard',
    description: 'Title for the dashboard view.',
    id: 'components.Dashboard.title',
  },
});

export const Dashboard: React.FC = () => {
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
          <h1 className="text-4xl my-4">
            <FormattedMessage {...messages.title} />
          </h1>
          <DashboardIndex />
        </Route>
      </Switch>
    </section>
  );
};
