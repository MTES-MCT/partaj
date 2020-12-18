import React from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { QueryStatus } from 'react-query';

import { GenericErrorMessage } from 'components/GenericErrorMessage';
import { ReferralTable } from 'components/ReferralTable';
import { Spinner } from 'components/Spinner';
import { useReferrals } from 'data';
import { useCurrentUser } from 'data/useCurrentUser';
import { User } from 'types';

const messages = defineMessages({
  loading: {
    defaultMessage: 'Loading referrals...',
    description:
      'Accessible message for the spinner while loading referrals in sent referrals.',
    id: 'components.SentReferrals.loading',
  },
  noReferralYet: {
    defaultMessage:
      'You have created any referrals yet. When you do, you can find them here.',
    description:
      'Help text for the list of sent referrals when there is no referral to show.',
    id: 'components.SentReferrals.noReferralYet',
  },
  title: {
    defaultMessage: 'Sent referrals',
    description: 'Title for the "sent referrals" view for a given user',
    id: 'components.SentReferrals.title',
  },
});

interface SentReferralsInnerProps {
  user: User;
}

const SentReferralsInner: React.FC<SentReferralsInnerProps> = ({ user }) => {
  const { data, status } = useReferrals({ user: user.id });

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
        <section className="container mx-auto py-4">
          <h1 className="text-4xl my-4">
            <FormattedMessage {...messages.title} />
          </h1>
          {data!.count > 0 ? (
            <ReferralTable referrals={data!.results} />
          ) : (
            <div>
              <FormattedMessage {...messages.noReferralYet} />
            </div>
          )}
        </section>
      );
  }
};

export const SentReferrals: React.FC = () => {
  const { currentUser } = useCurrentUser();

  return currentUser ? (
    <SentReferralsInner user={currentUser} />
  ) : (
    <Spinner size="large">
      <FormattedMessage {...messages.loading} />
    </Spinner>
  );
};
