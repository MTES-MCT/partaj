import React from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { useUIDSeed } from 'react-uid';

import { AttachmentsList } from 'components/AttachmentsList';
import { Referral } from 'types';
import { getUserFullname } from 'utils/user';

const messages = defineMessages({
  answer: {
    defaultMessage: 'Referral answer',
    description: 'Title for the answer part of the referral detail view',
    id: 'components.ReferralDetailAnswer.answer',
  },
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
});

interface ReferralDetailAnswerDisplayProps {
  referral: Referral;
}

export const ReferralDetailAnswerDisplay = ({
  referral,
}: ReferralDetailAnswerDisplayProps) => {
  const seed = useUIDSeed();
  const author = referral.topic.unit.members.find(
    (member) => member.id === referral.answers[0].created_by,
  );

  return (
    <article
      className="max-w-sm w-full lg:max-w-full border-gray-600 p-10 mt-8 mb-8 rounded-xl border"
      aria-labelledby={seed('referral-answer-article')}
    >
      <h4 id={seed('referral-answer-article')} className="text-4xl mb-6">
        <FormattedMessage {...messages.answer} />
      </h4>

      <section className="mb-6">
        <div className="font-semibold">
          <FormattedMessage
            {...messages.byWhom}
            values={{
              name: getUserFullname(author!),
              unit_name: referral.topic.unit.name,
            }}
          />
        </div>
        <div className="text-gray-600">{author?.email}</div>
        <div className="text-gray-600">{author?.phone_number}</div>
      </section>
      <p className="user-content mb-6">{referral.answers[0].content}</p>
      {referral.answers[0].attachments.length ? (
        <>
          <h5 id={seed('referral-answer-attachments')} className="text-lg text-gray-600 mb-2">
            <FormattedMessage {...messages.attachments} />
          </h5>
          <AttachmentsList
            attachments={referral.answers[0].attachments}
            labelId={seed('referral-answer-attachments')}
          />
        </>
      ) : null}
    </article>
  );
};
