import React, { createContext, useState } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { QueryStatus } from 'react-query';

import { GenericErrorMessage } from 'components/GenericErrorMessage';
import { ReferralActivityDisplay } from 'components/ReferralActivityDisplay';
import { Spinner } from 'components/Spinner';
import { useReferral, useReferralActivities } from 'data';
import { Referral, ReferralAnswer } from 'types';
import { Nullable } from 'types/utils';

const messages = defineMessages({
  loadingReferral: {
    defaultMessage: 'Loading referral #{ referralId }...',
    description:
      'Accessibility message for the spinner while loading the refeerral in referral detail view.',
    id: 'components.ReferralDetail.loadingReferral',
  },
});

/* Context to display/hide the referral answer form.  */
export const ShowAnswerFormContext = createContext<{
  showAnswerForm: Nullable<ReferralAnswer['id']>;
  setShowAnswerForm: React.Dispatch<
    React.SetStateAction<Nullable<ReferralAnswer['id']>>
  >;
}>({ showAnswerForm: null, setShowAnswerForm: () => {} });

interface ReferralDetailProps {
  referralId: Referral['id'];
}

export const ReferralDetail: React.FC<ReferralDetailProps> = ({
  referralId,
}) => {
  const [showAnswerForm, setShowAnswerForm] = useState<
    Nullable<ReferralAnswer['id']>
  >(null);

  const { status: referralStatus, data: referral } = useReferral(referralId);

  const {
    status: referralactivitiesStatus,
    data: referralactivities,
  } = useReferralActivities(referral?.id, { enabled: !!referral });

  if (
    referralStatus === QueryStatus.Loading ||
    referralStatus === QueryStatus.Idle ||
    referralactivitiesStatus === QueryStatus.Idle ||
    referralactivitiesStatus === QueryStatus.Loading
  ) {
    return (
      <Spinner size={'large'}>
        <FormattedMessage
          {...messages.loadingReferral}
          values={{ referralId }}
        />
      </Spinner>
    );
  }

  if (
    referralStatus === QueryStatus.Success &&
    referralactivitiesStatus === QueryStatus.Success
  ) {
    return (
      <ShowAnswerFormContext.Provider
        value={{ showAnswerForm, setShowAnswerForm }}
      >
        <div className="max-w-4xl mx-auto pb-16 pt-8 space-y-8">
          {referralactivities!.results
            .sort(
              (activityA, activityB) =>
                new Date(activityA.created_at).getTime() -
                new Date(activityB.created_at).getTime(),
            )
            .map((activity) => (
              <ReferralActivityDisplay
                {...{ activity, referral: referral! }}
                key={activity.id}
              />
            ))}
        </div>
      </ShowAnswerFormContext.Provider>
    );
  }

  return <GenericErrorMessage />;
};
