import React, { useState } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';

import { Spinner } from 'components/Spinner';
import { Referral, ReferralState } from 'types';
import { ContextProps } from 'types/context';
import { Nullable } from 'types/utils';
import { handle } from 'utils/errors';
import { useAsyncEffect } from 'utils/useAsyncEffect';
import { ReferralDetailAnswerDisplay } from 'components/ReferralDetailAnswerDisplay';
import { ReferralDetailAnswerForm } from 'components/ReferralDetailAnswerForm';
import { useCurrentUser } from 'data/useCurrentUser';
import { isUserUnitMember } from 'utils/unit';

const messages = defineMessages({
  loadingAnswer: {
    defaultMessage: 'Loading answer...',
    description:
      'Accessible loading message for the answer spinner on the referral detail view',
    id: 'components.ReferralDetailAnswer.loadingAnswer',
  },
});

interface ReferralDetailAnswerProps {
  referralId: number;
}

export const ReferralDetailAnswer = ({
  context,
  referralId,
}: ReferralDetailAnswerProps & ContextProps) => {
  const { currentUser } = useCurrentUser();
  const [referral, setReferral] = useState<Nullable<Referral>>(null);

  useAsyncEffect(async () => {
    const response = await fetch(`/api/referrals/${referralId}/`);
    if (!response.ok) {
      return handle(
        new Error('Failed to get referral in ReferralDetailAnswer.'),
      );
    }
    const newReferral: Referral = await response.json();
    setReferral(newReferral);
  }, []);

  if (referral?.state === ReferralState.ANSWERED) {
    return <ReferralDetailAnswerDisplay referral={referral} />;
  } else if (referral && isUserUnitMember(currentUser, referral?.topic.unit)) {
    return (
      <ReferralDetailAnswerForm
        context={context}
        referral={referral}
        setReferral={setReferral}
      />
    );
  } else if (referral) {
    return null;
  }

  return (
    <Spinner>
      <FormattedMessage {...messages.loadingAnswer} />
    </Spinner>
  );
};
