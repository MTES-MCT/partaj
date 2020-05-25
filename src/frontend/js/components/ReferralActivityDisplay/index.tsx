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
}

export const ReferralActivityDisplay = ({
  activity,
  context,
  referral,
}: ReferralActivityDisplayProps & ContextProps) => {
  let content: Nullable<JSX.Element>;
  switch (activity.verb) {
    case ReferralActivityVerb.ANSWERED:
      content = <ReferralDetailAnswerDisplay referral={referral} />;
      break;

    case ReferralActivityVerb.ASSIGNED:
      content = null;
      break;

    case ReferralActivityVerb.CREATED:
      content = <ReferralDetailContent referral={referral} />;
      break;
  }

  return (
    <>
      <ReferralActivityIndicator activity={activity} context={context} />
      {content}
    </>
  );
};
