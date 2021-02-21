import React from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { QueryStatus } from 'react-query';

import { GenericErrorMessage } from 'components/GenericErrorMessage';
import { ReferralActivityIndicator } from 'components/ReferralActivityIndicator';
import { Spinner } from 'components/Spinner';
import { useReferralActivities } from 'data';

const messages = defineMessages({
  loadingActivities: {
    defaultMessage: 'Loading activities...',
    description:
      'Accessibility message for the spinner while loading the activities in referral detail view.',
    id: 'components.ReferralDetailTabTracking.loadingActivities',
  },
});

interface ReferralDetailTabTrackingProps {
  referralId: string | number;
}

export const ReferralDetailTabTracking: React.FC<ReferralDetailTabTrackingProps> = ({
  referralId,
}) => {
  const { status, data: referralactivities } = useReferralActivities(
    referralId,
  );

  switch (status) {
    case QueryStatus.Idle:
    case QueryStatus.Loading:
      return (
        <Spinner size={'large'}>
          <FormattedMessage {...messages.loadingActivities} />
        </Spinner>
      );

    case QueryStatus.Error:
      return <GenericErrorMessage />;

    case QueryStatus.Success:
      return (
        <div className="max-w-4xl">
          {referralactivities!.results
            .sort(
              (activityA, activityB) =>
                new Date(activityB.created_at).getTime() -
                new Date(activityA.created_at).getTime(),
            )
            .map((activity, index) => (
              <React.Fragment key={activity.id}>
                {/* Add the spacer element with the dash to create a visual link between activities, before all
                    but the first activity. */}
                {index > 0 ? (
                  <div
                    className="h-6 border-l-2 border-gray-400"
                    style={{ marginLeft: '-1px' }}
                  />
                ) : null}
                <ReferralActivityIndicator activity={activity} />
              </React.Fragment>
            ))}
        </div>
      );
  }
};
