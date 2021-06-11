import { DateTime, Duration } from 'luxon';
import React from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';

import { GenericErrorMessage } from 'components/GenericErrorMessage';
import { Spinner } from 'components/Spinner';
import { useReferral } from 'data';
import { ReferralUrgencyLevelHistory } from 'types';

const messages = defineMessages({
  changeMessage: {
    defaultMessage:
      'The expected response date was moved from <b>{ oldDate }</b> to <b>{ newDate }</b>.',
    description: 'Urgency level changed.',
    id:
      'components.ReferralActivityIndicator.ActivityUrgencyLevelChanged.changeMessage',
  },
  loadingReferral: {
    defaultMessage: 'Loading referral...',
    description:
      'Accessible text for the spinner while loading the referral in the activity indicator for urgency change.',
    id:
      'components.ReferralActivityIndicator.ActivityUrgencyLevelChanged.loadingReferral',
  },
});

interface ActivityUrgencyLevelChangedProps {
  referralurgencylevelhistory: ReferralUrgencyLevelHistory;
}

export const ActivityUrgencyLevelChanged: React.FC<ActivityUrgencyLevelChangedProps> = ({
  referralurgencylevelhistory,
}) => {
  const { data: referral, status: getReferralStatus } = useReferral(
    referralurgencylevelhistory.referral,
  );

  switch (getReferralStatus) {
    case 'error':
      return <GenericErrorMessage />;

    case 'idle':
    case 'loading':
      return (
        <Spinner size="small">
          <FormattedMessage {...messages.loadingReferral} />
        </Spinner>
      );

    case 'success':
      const oldExpectedDate = DateTime.fromISO(referral!.created_at).plus(
        Duration.fromISO(
          'P' +
            referralurgencylevelhistory.old_referral_urgency.duration.split(
              ' ',
            )[0] +
            'D',
        ),
      );

      const newExpectedDate = DateTime.fromISO(referral!.created_at).plus(
        Duration.fromISO(
          'P' +
            referralurgencylevelhistory.new_referral_urgency.duration.split(
              ' ',
            )[0] +
            'D',
        ),
      );
      return (
        <div>
          <div>
            <FormattedMessage
              {...messages.changeMessage}
              values={{
                b: (chunks: any) => <strong>{chunks}</strong>,
                oldDate: oldExpectedDate.toLocaleString(DateTime.DATE_HUGE),
                newDate: newExpectedDate.toLocaleString(DateTime.DATE_HUGE),
              }}
            />
          </div>
          <div className="max-w-md px-2 py-1 rounded border border-gray-400 bg-gray-200">
            {referralurgencylevelhistory.explanation}
          </div>
        </div>
      );
  }
};
