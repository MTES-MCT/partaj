import React from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { UserReferralTable } from '../ReferralTable/UserReferralTable';

const messages = defineMessages({
  emptyDashboard: {
    defaultMessage: 'There is no referral for your unit yet',
    description:
      'Message to display in lieu of the table when there are no referrals for the unit.',
    id: 'components.UserDashboardIndex.emptyDashboard',
  },
});

export const UserDashboardIndex: React.FC = () => {
  return (
    <>
      <div className="mt-4 flex-grow">
        <UserReferralTable
          emptyState={
            <div
              className="flex flex-col items-center py-24 space-y-6"
              style={{ maxWidth: '60rem' }}
            >
              <div>
                <FormattedMessage {...messages.emptyDashboard} />
              </div>
            </div>
          }
          getReferralUrl={(referral) =>
            `/my-dashboard/referral-detail/${referral.id}`
          }
        />
      </div>
    </>
  );
};
