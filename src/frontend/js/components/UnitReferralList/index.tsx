import React from 'react';
import { QueryStatus } from 'react-query';
import { defineMessages, FormattedMessage } from 'react-intl';

import { GenericErrorMessage } from 'components/GenericErrorMessage';
import { ReferralTable } from 'components/ReferralTable';
import { Spinner } from 'components/Spinner';
import { useReferrals } from 'data';

const messages = defineMessages({
  loading: {
    defaultMessage: 'Loading unit referrals...',
    description: 'Accessiblity message for the spinner un unit referral list',
    id: 'components.UnitReferralList.loading',
  },
});

interface UnitReferralList {
  unit: string;
}

export const UnitReferralList: React.FC<UnitReferralList> = ({ unit }) => {
  const { status, data } = useReferrals({ unit });

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
      return <ReferralTable referrals={data!.results} />;
  }
};
