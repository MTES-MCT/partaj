import React, { createContext, useState } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { QueryStatus } from 'react-query';

import { Error } from 'components/Error';
import { ReferralActivityDisplay } from 'components/ReferralActivityDisplay';
import { ReferralDetailAnswerForm } from 'components/ReferralDetailAnswerForm';
import { Spinner } from 'components/Spinner';
import { useReferral, useReferralActivities } from 'data';
import { Referral } from 'types';
import { ContextProps } from 'types/context';

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
  showAnswerForm: boolean;
  setShowAnswerForm: React.Dispatch<React.SetStateAction<boolean>>;
}>({ showAnswerForm: false, setShowAnswerForm: () => {} });

interface ReferralDetailProps {
  referralId: Referral['id'];
}

export const ReferralDetail: React.FC<ReferralDetailProps & ContextProps> = ({
  context,
  referralId,
}) => {
  const [showAnswerForm, setShowAnswerForm] = useState(false);

  const { status: referralStatus, data: referral } = useReferral(
    context,
    referralId,
  );

  const {
    status: referralactivitiesStatus,
    data: referralactivities,
  } = useReferralActivities(context, referral?.id, { enabled: !!referral });

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
        <div className="max-w-4xl mx-auto">
          {referralactivities!.results
            .sort(
              (activityA, activityB) =>
                new Date(activityA.created_at).getTime() -
                new Date(activityB.created_at).getTime(),
            )
            .map((activity) => (
              <ReferralActivityDisplay
                {...{ activity, context, referral: referral! }}
                key={activity.id}
              />
            ))}
          {showAnswerForm ? (
            <ReferralDetailAnswerForm {...{ context, referral: referral! }} />
          ) : null}
        </div>
      </ShowAnswerFormContext.Provider>
    );
  }

  return <Error />;
};
