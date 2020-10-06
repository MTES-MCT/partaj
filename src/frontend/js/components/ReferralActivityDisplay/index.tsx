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

export const ReferralActivityDisplay: React.FC<
  ReferralActivityDisplayProps & ContextProps
> = ({ activity, context, referral }) => {
  let content: Nullable<JSX.Element>;
  switch (activity.verb) {
    case ReferralActivityVerb.ANSWERED:
      content = (
        <ReferralDetailAnswerDisplay
          answer={activity.item_content_object}
          referral={referral}
        />
      );
      break;

    case ReferralActivityVerb.ASSIGNED:
    case ReferralActivityVerb.UNASSIGNED:
      content = null;
      break;

    case ReferralActivityVerb.CREATED:
      content = <ReferralDetailContent {...{ context, referral }} />;
      break;

    case ReferralActivityVerb.DRAFT_ANSWERED:
      content = (
        <ReferralDetailAnswerDisplay
          answer={activity.item_content_object}
          referral={referral}
        />
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
