import React from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { Route, Switch, useRouteMatch } from 'react-router-dom';

import { Crumb } from 'components/BreadCrumbs';
import { SentReferralsList } from 'components/SentReferralsList';
import { ReferralForm } from 'components/ReferralForm';

import * as types from 'types';

const messages = defineMessages({
  crumbReferral: {
    defaultMessage: 'Referral',
    description: 'Breacrumb title for the referral in draft referrals.',
    id: 'components.DraftReferral.crumbReferral',
  },
  title: {
    defaultMessage: 'Draft referrals',
    description: 'Title for the "draft referrals" view for a given user',
    id: 'components.DraftReferral.title',
  },
});

export const DraftReferrals: React.FC = () => {
  const { path } = useRouteMatch();

  return (
    <div className="container mx-auto flex-grow flex flex-col">
      <Switch>
        <Route path={`${path}/referral-form/:referralId`}>
          <ReferralForm />
          <Crumb
            key="sent-referrals-referral-detail"
            title={<FormattedMessage {...messages.crumbReferral} />}
          />
        </Route>

        <Route path={path}>
          <h1 className="text-4xl my-4">
            <FormattedMessage {...messages.title} />
          </h1>
          <SentReferralsList draftList={true} />
        </Route>
      </Switch>
    </div>
  );
};
