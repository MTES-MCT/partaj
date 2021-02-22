import React from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { Route, Switch, useRouteMatch } from 'react-router-dom';

import { Crumb } from 'components/BreadCrumbs';
import { ReferralDetail } from 'components/ReferralDetail';
import { SentReferralsList } from 'components/SentReferralsList';

const messages = defineMessages({
  crumbReferral: {
    defaultMessage: 'Referral',
    description: 'Breacrumb title for the referral detail in sent referrals.',
    id: 'components.SentReferrals.crumbReferral',
  },
  title: {
    defaultMessage: 'Sent referrals',
    description: 'Title for the "sent referrals" view for a given user',
    id: 'components.SentReferrals.title',
  },
});

export const SentReferrals: React.FC = () => {
  const { path } = useRouteMatch();

  return (
    <div className="container mx-auto flex-grow flex flex-col">
      <h1 className="text-4xl my-4">
        <FormattedMessage {...messages.title} />
      </h1>
      <Switch>
        <Route path={`${path}/referral-detail/:referralId`}>
          <ReferralDetail />
          <Crumb
            key="sent-referrals-referral-detail"
            title={<FormattedMessage {...messages.crumbReferral} />}
          />
        </Route>

        <Route path={path}>
          <SentReferralsList />
        </Route>
      </Switch>
    </div>
  );
};
