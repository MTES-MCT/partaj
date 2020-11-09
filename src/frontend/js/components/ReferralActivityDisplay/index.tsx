import React, { useContext } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';

import { ShowAnswerFormContext } from 'components/ReferralDetail';
import { ReferralDetailAnswerDisplay } from 'components/ReferralDetailAnswerDisplay';
import { ReferralDetailAnswerForm } from 'components/ReferralDetailAnswerForm';
import { ReferralDetailContent } from 'components/ReferralDetailContent';
import { Referral, ReferralActivity, ReferralActivityVerb } from 'types';
import { ContextProps } from 'types/context';
import { Nullable } from 'types/utils';
import { ReferralActivityIndicator } from './ReferralActivityIndicator';

const messages = defineMessages({
  answerLink: {
    defaultMessage: 'See the answer',
    description: 'Link to scroll to an answer on answer related activities',
    id: 'components.ReferralActivityDisplay.answerLink',
  },
});

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
        content = (
          <ReferralDetailAnswerForm
            {...{ context, referral }}
            answerId={activity.item_content_object.id}
          />
        );
      } else {
        content = (
          <ReferralDetailAnswerDisplay
            {...{ context, referral }}
            answer={activity.item_content_object}
          />
        );
      }
      break;

    case ReferralActivityVerb.VALIDATED:
    case ReferralActivityVerb.VALIDATION_DENIED:
    case ReferralActivityVerb.VALIDATION_REQUESTED:
      content = (
        <a
          className="btn btn-outline inline-block"
          href={`answer-${activity.item_content_object.answer.id}`}
          onClick={(e) => {
            e.preventDefault();

            const display = document.querySelector(
              `#answer-${activity.item_content_object.answer.id}`,
            );
            if (display) {
              display.scrollIntoView({ behavior: 'smooth' });
              return;
            }

            document
              .querySelector(
                `#answer-${activity.item_content_object.answer.id}-form`,
              )
              ?.scrollIntoView({ behavior: 'smooth' });
          }}
        >
          <FormattedMessage {...messages.answerLink} />
        </a>
      );
  }

  return (
    <div className="space-y-4">
      <ReferralActivityIndicator {...{ activity, context }} />
      {content}
    </div>
  );
};
