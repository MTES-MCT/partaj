import React from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { useUIDSeed } from 'react-uid';

import { AttachmentsList } from 'components/AttachmentsList';
import { RichTextView } from 'components/RichText/view';
import * as types from 'types';
import { isUserUnitMember } from 'utils/unit';
import { getUserFullname } from 'utils/user';
import { ReferralAnswerActions } from 'components/ReferralAnswerActions';

const messages = defineMessages({
  attachments: {
    defaultMessage: 'Attachments',
    description: 'Title for the list of attachments on the referral answer.',
    id: 'components.ReferralDetailAnswer.attachments',
  },
  byWhom: {
    defaultMessage: 'By {name}, {unit_name}',
    description: 'Author of the referral answer',
    id: 'components.ReferralDetailAnswer.byWhom',
  },
  draftAnswerTitle: {
    defaultMessage: 'Referral answer draft',
    description: 'Title for all the draft answers on the referral detail view.',
    id: 'components.ReferralDetailAnswer.draftAnswerTitle',
  },
  publishedAnswerTitle: {
    defaultMessage: 'Referral answer',
    description:
      'Title for the final published answer on the referral detail view.',
    id: 'components.ReferralDetailAnswer.publishedAnswerTitle',
  },
});

interface ReferralDetailAnswerDisplayProps {
  answer: types.ReferralAnswer;
  referral: types.Referral;
}

export const ReferralDetailAnswerDisplay = ({
  answer,
  referral,
}: ReferralDetailAnswerDisplayProps) => {
  const seed = useUIDSeed();

  return (
    <article
      className={`max-w-sm w-full lg:max-w-full border-gray-500 bg-gray-200 p-10 mt-8 mb-8 rounded-xl border space-y-6 ${
        answer.state === types.ReferralAnswerState.DRAFT ? 'border-dashed' : ''
      } overflow-hidden`}
      aria-labelledby={seed('referral-answer-article')}
      id={`answer-${answer.id}`}
    >
      <div className="float-right">
        <ReferralAnswerActions answer={answer} referral={referral} />
      </div>

      <h4
        id={seed('referral-answer-article')}
        className="text-4xl"
        // Make sure the dropdown menu does not create unwanted spacing
        style={{ marginTop: 0 }}
      >
        {answer.state === types.ReferralAnswerState.DRAFT ? (
          <FormattedMessage {...messages.draftAnswerTitle} />
        ) : (
          <FormattedMessage {...messages.publishedAnswerTitle} />
        )}
      </h4>

      <div>
        <div className="font-semibold">
          <FormattedMessage
            {...messages.byWhom}
            values={{
              name: getUserFullname(answer.created_by),
              unit_name:
                referral.units.filter((unit) =>
                  isUserUnitMember(answer.created_by, unit),
                )[0]?.name || '',
            }}
          />
        </div>
        <div className="text-gray-500">{answer.created_by.email}</div>
        <div className="text-gray-500">{answer.created_by.phone_number}</div>
      </div>

      <div>
        <RichTextView content={answer.content} />
      </div>

      {answer.attachments.length ? (
        <div>
          <h5
            id={seed('referral-answer-attachments')}
            className="text-lg text-gray-500 mb-2"
          >
            <FormattedMessage {...messages.attachments} />
          </h5>
          <AttachmentsList
            attachments={answer.attachments}
            labelId={seed('referral-answer-attachments')}
          />
        </div>
      ) : null}
    </article>
  );
};
