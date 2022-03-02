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
  export: {
    defaultMessage: 'Export all referrals',
    description: 'Message for export button.',
    id: 'components.Dashboard.export',
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
          <div style={{ width: '60rem' }}>
            <h1 className=" float-left text-4xl my-4">
              <FormattedMessage {...messages.title} />
            </h1>
            <div className="float-right mt-6">
              <a
                className="block mb-4 space-x-4 rounded shadow-sm px-4 py-2 border focus:border-primary-300 focus:shadow-outline-blue transition ease-in-out duration-150  bg-white border-gray-300 text-gray-500"
                href="/export/"
              >
                <FormattedMessage {...messages.export} />
              </a>
            </div>
          </div>
          <DashboardIndex />
        </Route>
      </Switch>
    </section>
  );
};
