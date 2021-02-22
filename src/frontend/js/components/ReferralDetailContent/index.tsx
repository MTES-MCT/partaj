import React from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { useUIDSeed } from 'react-uid';
import { useRouteMatch } from 'react-router-dom';

import { AttachmentsList } from 'components/AttachmentsList';
import { CreateAnswerButton } from 'components/CreateAnswerButton';
import { nestedUrls } from 'components/ReferralDetail';
import { RichTextView } from 'components/RichText/view';
import { Referral } from 'types';

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
  priorWork: {
    defaultMessage: 'Prior work',
    description: 'Subtitle for the prior work on the referral.',
    id: 'components.ReferralDetailContent.priorWork',
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
  const { url } = useRouteMatch();

  return (
    <article
      className="w-full lg:max-w-4xl bg-gray-200 border-gray-400 p-10 mt-8 mb-8 rounded-xl border"
      aria-labelledby={seed('referral-article')}
    >
      <div className="space-y-6">
        <h3 className="text-4xl" id={seed('referral-article')}>
          {referral.object ? (
            referral.object
          ) : (
            <FormattedMessage
              {...messages.title}
              values={{ caseNumber: referral.id }}
            />
          )}
        </h3>

        <div>
          <h4 className="text-lg mb-2 text-gray-500">
            <FormattedMessage {...messages.requester} />
          </h4>
          <div className="font-semibold">{referral.requester}</div>
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

      <CreateAnswerButton
        getAnswerUrl={(answerId) => {
          const [__, ...urlParts] = url.split('/').reverse();
          return `${urlParts.reverse().join('/')}/${
            nestedUrls.draftAnswers
          }/${answerId}/form`;
        }}
        referral={referral}
      />
    </article>
  );
};
