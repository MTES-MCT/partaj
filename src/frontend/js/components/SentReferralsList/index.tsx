import React from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';

import { ReferralTable } from 'components/ReferralTable';
import { FilterColumns } from 'components/ReferralTable/Filters';
import { Spinner } from 'components/Spinner';
import { useCurrentUser } from 'data/useCurrentUser';

const messages = defineMessages({
  loading: {
    defaultMessage: 'Loading referrals...',
    description:
      'Accessible message for the spinner while loading referrals in sent referrals.',
    id: 'components.SentReferralsList.loading',
  },
  noReferralYet: {
    defaultMessage:
      'You have created any referrals yet. When you do, you can find them here.',
    description:
      'Help text for the list of sent referrals when there is no referral to show.',
    id: 'components.SentReferralsList.noReferralYet',
  },
});

export const SentReferralsList: React.FC = () => {
  const { currentUser } = useCurrentUser();

  return currentUser ? (
    <ReferralTable
      defaultParams={{ user: [currentUser.id] }}
      disabledColumns={[FilterColumns.USER]}
      emptyState={
        <div>
          <FormattedMessage {...messages.noReferralYet} />
        </div>
      }
      getReferralUrl={(referral) =>
        `/sent-referrals/referral-detail/${referral.id}`
      }
    />
  ) : (
    <Spinner size="large">
      <FormattedMessage {...messages.loading} />
    </Spinner>
  );
};
