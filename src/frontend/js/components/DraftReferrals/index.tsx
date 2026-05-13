import React from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { Route, Routes } from 'react-router-dom';

import { Crumb } from 'components/BreadCrumbs';
import { SentReferralsList } from 'components/SentReferralsList';
import { ReferralForm } from '../ReferralForm';

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
  return (
    <div className="container mx-auto flex-grow flex flex-col px-8">
      <Routes>
        <Route
          path="referral-form/:referralId"
          element={
            <>
              <ReferralForm />
              <Crumb
                key="sent-referrals-referral-detail"
                title={<FormattedMessage {...messages.crumbReferral} />}
              />
            </>
          }
        />

        <Route
          index
          element={
            <>
              <h1 className="text-4xl my-4">
                <FormattedMessage {...messages.title} />
              </h1>
              <SentReferralsList draftList={true} />
            </>
          }
        />
      </Routes>
    </div>
  );
};
