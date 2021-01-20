import React from 'react';
import { QueryStatus } from 'react-query';
import { defineMessages, FormattedMessage } from 'react-intl';

import { GenericErrorMessage } from 'components/GenericErrorMessage';
import { ReferralTable } from 'components/ReferralTable';
import { Spinner } from 'components/Spinner';
import { useReferralLites } from 'data';

const messages = defineMessages({
  loading: {
    defaultMessage: 'Loading unit referrals...',
    description: 'Accessiblity message for the spinner un unit referral list',
    id: 'components.UnitReferralList.loading',
  },
});

interface UnitReferralList {
  unitId: string;
}

export const UnitReferralList: React.FC<UnitReferralList> = ({ unitId }) => {
  const { status, data } = useReferralLites({ unit: unitId });

  switch (status) {
    case QueryStatus.Error:
      return <GenericErrorMessage />;

    case QueryStatus.Idle:
    case QueryStatus.Loading:
      return (
        <Spinner size="large">
          <FormattedMessage {...messages.loading} />
        </Spinner>
      );

    case QueryStatus.Success:
      return (
        <ReferralTable
          getReferralUrl={(referral) =>
            `/unit/${referral.unit}/referral-detail/${referral.id}`
          }
          referrals={data!.results}
        />
      );
  }
};
