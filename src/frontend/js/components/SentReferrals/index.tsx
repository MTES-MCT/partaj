import React from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { Route, Routes } from 'react-router-dom';

import { Crumb } from 'components/BreadCrumbs';
import { ReferralDetail } from 'components/ReferralDetail';
import { SentReferralsList } from 'components/SentReferralsList';

import { useTitle } from 'utils/useTitle';

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
  useTitle('sentReferralList');

  return (
    <div className="container mx-auto flex-grow flex flex-col px-8">
      <Routes>
        <Route
          path="referral-detail/:referralId/*"
          element={
            <>
              <ReferralDetail />
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
              <SentReferralsList draftList={false} />
            </>
          }
        />
      </Routes>
    </div>
  );
};
