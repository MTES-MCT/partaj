import React from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';

import { GenericErrorMessage } from 'components/GenericErrorMessage';
import { ReferralActivityIndicator } from 'components/ReferralActivityIndicator';
import { Spinner } from 'components/Spinner';
import { useReferralActivities } from 'data';
import { isUserReferralUnitsMember } from 'utils/unit';
import { Referral, ReferralActivityVerb } from 'types';
import { useCurrentUser } from 'data/useCurrentUser';

const messages = defineMessages({
  loadingActivities: {
    defaultMessage: 'Loading activities...',
    description:
      'Accessibility message for the spinner while loading the activities in referral detail view.',
    id: 'components.ReferralDetail.TabTracking.loadingActivities',
  },
});

interface TabTrackingProps {
  referral: Referral;
}

export const TabTracking: React.FC<TabTrackingProps> = ({ referral }) => {
  const { status, data: referralactivities } = useReferralActivities(
    referral.id,
  );
  const { currentUser } = useCurrentUser();

  switch (status) {
    case 'error':
      return <GenericErrorMessage />;

    case 'idle':
    case 'loading':
      return (
        <Spinner size={'large'}>
          <FormattedMessage {...messages.loadingActivities} />
        </Spinner>
      );

    case 'success':
      return (
        <ul className="max-w-4xl">
          {referralactivities!.results
            .sort(
              (activityA, activityB) =>
                new Date(activityB.created_at).getTime() -
                new Date(activityA.created_at).getTime(),
            )
            .map((activity, index) =>
              activity.verb === ReferralActivityVerb.UPDATED_TITLE ? (
                isUserReferralUnitsMember(currentUser, referral) ? (
                  <li key={activity.id}>
                    {/* Add the spacer element with the dash to create a visual link between activities, before all
                  but the first activity. */}
                    {index > 0 ? (
                      <div
                        className="h-6 border-l-2 border-gray-400"
                        style={{ marginLeft: '-1px' }}
                      />
                    ) : null}

                    <ReferralActivityIndicator activity={activity} />
                  </li>
                ) : null
              ) : (
                <li key={activity.id}>
                  {/* Add the spacer element with the dash to create a visual link between activities, before all
                but the first activity. */}
                  {index > 0 ? (
                    <div
                      className="h-6 border-l-2 border-gray-400"
                      style={{ marginLeft: '-1px' }}
                    />
                  ) : null}

                  <ReferralActivityIndicator activity={activity} />
                </li>
              ),
            )}
        </ul>
      );
  }
};
