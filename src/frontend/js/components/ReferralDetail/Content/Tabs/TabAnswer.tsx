import React, { useContext } from 'react';

import { ReferralDetailAnswerDisplay } from 'components/ReferralDetailAnswerDisplay';
import { Referral, ReferralAnswerState } from 'types';
import { GenericErrorMessage } from 'components/GenericErrorMessage';
import { Nullable } from '../../../../types/utils';
import { ReferralContext } from '../../../../data/providers/ReferralProvider';

export const TabAnswer = () => {
  const { referral }: { referral: Nullable<Referral> } = useContext(
    ReferralContext,
  );

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
