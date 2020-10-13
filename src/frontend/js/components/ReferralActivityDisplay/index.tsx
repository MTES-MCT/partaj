import React, { useContext } from 'react';

import { ShowAnswerFormContext } from 'components/ReferralDetail';
import { ReferralDetailAnswerDisplay } from 'components/ReferralDetailAnswerDisplay';
import { ReferralDetailContent } from 'components/ReferralDetailContent';
import { Referral, ReferralActivity, ReferralActivityVerb } from 'types';
import { ContextProps } from 'types/context';
import { Nullable } from 'types/utils';
import { ReferralActivityIndicator } from './ReferralActivityIndicator';
import { ReferralDetailAnswerForm } from 'components/ReferralDetailAnswerForm';

interface ReferralActivityDisplayProps {
  activity: ReferralActivity;
  referral: Referral;
}

export const ReferralActivityDisplay: React.FC<
  ReferralActivityDisplayProps & ContextProps
> = ({ activity, context, referral }) => {
  const { showAnswerForm } = useContext(ShowAnswerFormContext);

  let content: Nullable<JSX.Element>;
  switch (activity.verb) {
    case ReferralActivityVerb.ANSWERED:
      content = (
        <ReferralDetailAnswerDisplay
          answer={activity.item_content_object}
          context={context}
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
      if (showAnswerForm === activity.item_content_object.id) {
        content = <ReferralDetailAnswerForm {...{ context, referral }} />;
      } else {
        content = (
          <ReferralDetailAnswerDisplay
            {...{ context, referral }}
            answer={activity.item_content_object}
          />
        );
      }
      break;
  }

  return (
    <>
      <ReferralActivityIndicator {...{ activity, context }} />
      {content}
    </>
  );
};
