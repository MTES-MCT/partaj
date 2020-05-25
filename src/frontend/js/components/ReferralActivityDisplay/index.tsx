import React from 'react';

import { ReferralDetailAnswerDisplay } from 'components/ReferralDetailAnswerDisplay';
import { ReferralDetailContent } from 'components/ReferralDetailContent';
import { Referral, ReferralActivity, ReferralActivityVerb } from 'types';
import { ContextProps } from 'types/context';
import { Nullable } from 'types/utils';
import { ReferralActivityIndicator } from './ReferralActivityIndicator';

interface ReferralActivityDisplayProps {
  activity: ReferralActivity;
  referral: Referral;
  setReferral: React.Dispatch<React.SetStateAction<Nullable<Referral>>>;
}

export const ReferralActivityDisplay: React.FC<
  ReferralActivityDisplayProps & ContextProps
> = ({ activity, context, referral, setReferral }) => {
  let content: Nullable<JSX.Element>;
  switch (activity.verb) {
    case ReferralActivityVerb.ANSWERED:
      content = <ReferralDetailAnswerDisplay referral={referral} />;
      break;

    case ReferralActivityVerb.ASSIGNED:
      content = null;
      break;

    case ReferralActivityVerb.CREATED:
      content = (
        <ReferralDetailContent {...{ context, referral, setReferral }} />
      );
      break;
  }

  return (
    <>
      <ReferralActivityIndicator {...{ activity, context }} />
      {content}
    </>
  );
};
