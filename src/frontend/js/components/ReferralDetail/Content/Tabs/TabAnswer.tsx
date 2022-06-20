import React, { useContext } from 'react';

import { ReferralDetailAnswerDisplay } from 'components/ReferralDetailAnswerDisplay';
import { Referral, ReferralAnswerState } from 'types';
import { GenericErrorMessage } from 'components/GenericErrorMessage';
import { Nullable } from '../../../../types/utils';
import { ReferralContext } from '../../../../data/providers/ReferralProvider';

interface TabAnswerProps {
  referralId: Referral['id'];
}

export const TabAnswer = ({ referralId }: TabAnswerProps) => {
  const { referral }: { referral: Nullable<Referral> } =
    useContext(ReferralContext);

  const publishedAnswer = referral?.answers.find(
    (answer) => answer.state === ReferralAnswerState.PUBLISHED,
  );

  if (!publishedAnswer) {
    return <GenericErrorMessage />;
  }

  return (
    <ReferralDetailAnswerDisplay
      referral={referral!}
      answer={publishedAnswer}
    />
  );
};
