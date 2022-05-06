import React from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';

import { ReferralTable } from 'components/ReferralTable';
import { FilterColumns } from 'components/ReferralTable/types';
import { Spinner } from 'components/Spinner';
import { useCurrentUser } from 'data/useCurrentUser';
import { ReferralState } from 'types';

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

interface SentReferralsListProps {
  draftList: boolean;
}

export const SentReferralsList: React.FC<SentReferralsListProps> = ({
  draftList,
}) => {
  const { currentUser } = useCurrentUser();
  return currentUser ? (
    draftList === true ? (
      <ReferralTable
        defaultParams={{
          user: [currentUser.id],
          state: [ReferralState.DRAFT],
        }}
        disabledColumns={[
          FilterColumns.UNIT,
          FilterColumns.USER_UNIT_NAME,
          FilterColumns.STATE,
        ]}
        emptyState={
          <div>
            <FormattedMessage {...messages.noReferralYet} />
          </div>
        }
        getReferralUrl={(referral) =>
          `/draft-referrals/referral-form/${referral.id}`
        }
        disableFilters={true}
        hideColumns={['PUBLISHED_DATE']}
      />
    ) : (
      <ReferralTable
        defaultParams={{
          user: [currentUser.id],
          state: [
            ReferralState.RECEIVED,
            ReferralState.ANSWERED,
            ReferralState.ASSIGNED,
            ReferralState.CLOSED,
            ReferralState.INCOMPLETE,
            ReferralState.IN_VALIDATION,
            ReferralState.PROCESSING,
          ],
        }}
        disabledColumns={[FilterColumns.UNIT, FilterColumns.USER_UNIT_NAME]}
        emptyState={
          <div>
            <FormattedMessage {...messages.noReferralYet} />
          </div>
        }
        getReferralUrl={(referral) =>
          `/sent-referrals/referral-detail/${referral.id}`
        }
      />
    )
  ) : (
    <Spinner size="large">
      <FormattedMessage {...messages.loading} />
    </Spinner>
  );
};
