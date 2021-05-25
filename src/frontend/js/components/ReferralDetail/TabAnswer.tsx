import React from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';

import { ReferralDetailAnswerDisplay } from 'components/ReferralDetailAnswerDisplay';
import { Spinner } from 'components/Spinner';
import { useReferral } from 'data';
import { Referral, ReferralAnswerState } from 'types';
import { GenericErrorMessage } from 'components/GenericErrorMessage';

const messages = defineMessages({
  loading: {
    defaultMessage: 'Loading published answer...',
    description:
      'Accessible message while loading the referral in the referral answer view.',
    id: 'components.ReferralDetail.TabAnswer.loading',
  },
});

interface TabAnswerProps {
  referralId: Referral['id'];
}

export const TabAnswer = ({ referralId }: TabAnswerProps) => {
  const { data: referral, isStale, status } = useReferral(String(referralId));

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
      const publishedAnswer = referral?.answers.find(
        (answer) => answer.state === ReferralAnswerState.PUBLISHED,
      );

      if (!publishedAnswer) {
        if (isStale) {
          return (
            <Spinner size="large">
              <FormattedMessage {...messages.loading} />
            </Spinner>
          );
        }

        return <GenericErrorMessage />;
      }

      return (
        <ReferralDetailAnswerDisplay
          referral={referral!}
          answer={publishedAnswer}
        />
      );
  }
};
