import React from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { Route, Switch, useRouteMatch } from 'react-router-dom';

import { DashboardIndex } from 'components/DashboardIndex';
import { ReferralDetail } from 'components/ReferralDetail';

const messages = defineMessages({
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
      <h1 className="text-4xl my-4">
        <FormattedMessage {...messages.title} />
      </h1>

      <Switch>
        <Route exact path={`${path}referral-detail/:referralId`}>
          <ReferralDetail />
        </Route>

        <Route path={path}>
          <DashboardIndex />
        </Route>
      </Switch>
    </section>
  );
};
