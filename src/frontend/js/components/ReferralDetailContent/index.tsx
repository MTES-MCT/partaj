import React from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { useUIDSeed } from 'react-uid';

import { AttachmentsList } from 'components/AttachmentsList';
import { ReferralDetailAssignment } from 'components/ReferralDetailAssignment';
import { RichTextView } from 'components/RichText/view';
import { Referral } from 'types';
import { getUserFullname } from 'utils/user';
import { AnswerButton } from './AnswerButton';

const messages = defineMessages({
  attachments: {
    defaultMessage: 'Attachments',
    description: "Subtitle for the referral's attachments list.",
    id: 'components.ReferralDetailContent.attachments',
  },
  context: {
    defaultMessage: 'Context',
    description: "Subtitle for the referral's context.",
    id: 'components.ReferralDetailContent.context',
  },
  expectedResponseTime: {
    defaultMessage: 'Expected response time',
    description: "Subtitle for the referral's expected response time.",
    id: 'components.ReferralDetailContent.expectedResponseTime',
  },
  object: {
    defaultMessage: 'Referral object',
    description: 'Subtitle for the object on the referral detail view.',
    id: 'components.ReferralDetailContent.object',
  },
  priorWork: {
    defaultMessage: 'Prior work',
    description: 'Subtitle for the prior work on the referral.',
    id: 'components.ReferralDetailContent.priorWork',
  },
  officialRequester: {
    defaultMessage: 'Official requester: {requesterName}',
    description:
      'Formal requester to whom the answer to the referral should be addressed.',
    id: 'components.ReferralDetailContent.officialRequester',
  },
  question: {
    defaultMessage: 'Referral question',
    description: "Subtitle for the referral's question.",
    id: 'components.ReferralDetailContent.question',
  },
  requester: {
    defaultMessage: 'Requester',
    description: 'Referral requester.',
    id: 'components.ReferralDetailContent.requester',
  },
  requesterAs: {
    defaultMessage: 'As {requesterName}',
    description:
      'User who actually signed up to Partaj to make the referral (as opposed to formal requester).',
    id: 'components.ReferralDetailContent.requesterAs',
  },
  title: {
    defaultMessage: 'Referral #{caseNumber}',
    description: 'Title for the referral detail content view.',
    id: 'components.ReferralDetailContent.title',
  },
  topic: {
    defaultMessage: 'Referral topic',
    description: 'Subtitle for the topic of the referral.',
    id: 'components.ReferralDetailContent.topic',
  },
  urgencyExplanation: {
    defaultMessage: 'Urgency explanation',
    description: "Subtitle for the referral's urgency explanation.",
    id: 'components.ReferralDetailContent.urgencyExplanation',
  },
});

interface ReferralDetailContentProps {
  referral: Referral;
}

export const ReferralDetailContent: React.FC<ReferralDetailContentProps> = ({
  referral,
}) => {
  const seed = useUIDSeed();

  return (
    <article
      className="w-full lg:max-w-full border-gray-500 p-10 mt-8 mb-8 rounded-xl border"
      aria-labelledby={seed('referral-article')}
    >
      <ReferralDetailAssignment referral={referral} />

      <div className="space-y-6">
        <h3 className="text-4xl" id={seed('referral-article')}>
          <FormattedMessage
            {...messages.title}
            values={{ caseNumber: referral.id }}
          />
        </h3>

        <div>
          <h4 className="text-lg mb-2 text-gray-500">
            <FormattedMessage {...messages.requester} />
          </h4>
          <div className="font-semibold">
            <FormattedMessage
              {...messages.officialRequester}
              values={{ requesterName: referral.requester }}
            />
          </div>
          <div className="text-gray-500">
            <FormattedMessage
              {...messages.requesterAs}
              values={{ requesterName: getUserFullname(referral.user) }}
            />
            {referral.user.unit_name ? `, ${referral.user.unit_name}` : null}
          </div>
          <div className="text-gray-500">{referral.user.email}</div>
          {referral.user.phone_number ? (
            <div className="text-gray-500">{referral.user.phone_number}</div>
          ) : null}
        </div>

        <div>
          <h4 className="text-lg mb-2 text-gray-500">
            <FormattedMessage {...messages.topic} />
          </h4>
          <p>{referral.topic.name}</p>
        </div>

        {referral.object ? (
          <div>
            <h4 className="text-lg mb-2 text-gray-500">
              <FormattedMessage {...messages.object} />
            </h4>
            <p>{referral.object}</p>
          </div>
        ) : null}

        <div>
          <h4 className="text-lg mb-2 text-gray-500">
            <FormattedMessage {...messages.question} />
          </h4>
          <RichTextView content={referral.question} />
        </div>

        <div>
          <h4 className="text-lg mb-2 text-gray-500">
            <FormattedMessage {...messages.context} />
          </h4>
          <RichTextView content={referral.context} />
        </div>

        <div>
          <h4 className="text-lg mb-2 text-gray-500">
            <FormattedMessage {...messages.priorWork} />
          </h4>
          <RichTextView content={referral.prior_work} />
        </div>

        {referral.attachments.length > 0 ? (
          <div>
            <h4
              className="text-lg mb-2 text-gray-500"
              id={seed('referral-attachments')}
            >
              <FormattedMessage {...messages.attachments} />
            </h4>
            <AttachmentsList
              attachments={referral.attachments}
              labelId={seed('referral-attachments')}
            />
          </div>
        ) : null}

        <div>
          <h4 className="text-lg mb-2 text-gray-500">
            <FormattedMessage {...messages.expectedResponseTime} />
          </h4>
          <p>{referral.urgency_level.name}</p>
        </div>

        {referral.urgency_explanation ? (
          <div>
            <h4 className="text-lg mb-2 text-gray-500">
              <FormattedMessage {...messages.urgencyExplanation} />
            </h4>
            <p className="user-content">{referral.urgency_explanation}</p>
          </div>
        ) : null}
      </div>

      <AnswerButton referral={referral} />
    </article>
  );
};
