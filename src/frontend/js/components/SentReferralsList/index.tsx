import React from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';

import { GenericErrorMessage } from 'components/GenericErrorMessage';
import { ReferralTable } from 'components/ReferralTable';
import { Spinner } from 'components/Spinner';
import { useReferralLites } from 'data';
import { useCurrentUser } from 'data/useCurrentUser';
import { User } from 'types';

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

interface SentReferralsListInnerProps {
  user: User;
}

const SentReferralsListInner: React.FC<SentReferralsListInnerProps> = ({
  user,
}) => {
  const { data, status } = useReferralLites({ user: user.id });

  switch (status) {
    case 'error':
      return <GenericErrorMessage />;

    case 'idle':
    case 'loading':
      return (
        <Spinner size="large">
          <FormattedMessage {...messages.loading} />
        </Spinner>
      );

    case 'success':
      return (
        <section className="container mx-auto py-4">
          {data!.count > 0 ? (
            <ReferralTable
              getReferralUrl={(referral) =>
                `/sent-referrals/referral-detail/${referral.id}`
              }
              referrals={data!.results}
            />
          ) : (
            <div>
              <FormattedMessage {...messages.noReferralYet} />
            </div>
          )}
        </section>
      );
  }
};

export const SentReferralsList: React.FC = () => {
  const { currentUser } = useCurrentUser();

  return currentUser ? (
    <SentReferralsListInner user={currentUser} />
  ) : (
    <Spinner size="large">
      <FormattedMessage {...messages.loading} />
    </Spinner>
  );
};
