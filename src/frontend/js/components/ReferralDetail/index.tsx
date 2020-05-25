import React, {
  useState,
  createContext,
  Dispatch,
  SetStateAction,
} from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';

import { ReferralActivityDisplay } from 'components/ReferralActivityDisplay';
import { Spinner } from 'components/Spinner';
import { useReferral } from 'data/useReferral';
import { Referral } from 'types';
import { ContextProps } from 'types/context';
import { ReferralDetailAnswerForm } from 'components/ReferralDetailAnswerForm';

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
  setShowAnswerForm: Dispatch<SetStateAction<boolean>>;
}>({ showAnswerForm: false, setShowAnswerForm: () => {} });

interface ReferralDetailProps {
  referralId: Referral['id'];
}

export const ReferralDetail = ({
  context,
  referralId,
}: ReferralDetailProps & ContextProps) => {
  const { referral, setReferral } = useReferral(referralId);
  const [showAnswerForm, setShowAnswerForm] = useState(false);

  if (!referral) {
    return (
      <Spinner size={'large'}>
        <FormattedMessage
          {...messages.loadingReferral}
          values={{ referralId }}
        />
      </Spinner>
    );
  }

  return (
    <ShowAnswerFormContext.Provider
      value={{ showAnswerForm, setShowAnswerForm }}
    >
      {referral.activity
        .sort(
          (activityA, activityB) =>
            new Date(activityA.created_at).getTime() -
            new Date(activityB.created_at).getTime(),
        )
        .map((activity) => (
          <ReferralActivityDisplay
            activity={activity}
            context={context}
            key={activity.id}
            referral={referral}
          />
        ))}
      {showAnswerForm ? (
        <ReferralDetailAnswerForm {...{ context, referral, setReferral }} />
      ) : null}
    </ShowAnswerFormContext.Provider>
  );
};
