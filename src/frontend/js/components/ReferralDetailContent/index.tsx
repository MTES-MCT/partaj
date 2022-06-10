import React from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { useUIDSeed } from 'react-uid';
import { useRouteMatch } from 'react-router-dom';

import { AttachmentsList } from 'components/AttachmentsList';
import { CreateAnswerButton } from 'components/CreateAnswerButton';
import { RichTextView } from 'components/RichText/view';
import { useCurrentUser } from 'data/useCurrentUser';
import { Referral } from 'types';
import { isUserUnitMember } from 'utils/unit';
import {nestedUrls} from "../../const";

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
  exportReferral: {
    defaultMessage: 'Download the referral',
    description: 'Message for export button.',
    id: 'components.ReferralDetailContent.exportReferral',
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

  const { currentUser } = useCurrentUser();

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

      <div className="flex space-x-4 pt-6 float-right">
        <a
          className="  relative btn btn-primary focus:shadow-outline "
          href={`/export-referral/${referral.id}/`}
        >
          <FormattedMessage {...messages.exportReferral} />
        </a>
        {referral.units.some((unit) => isUserUnitMember(currentUser, unit)) ? (
          <CreateAnswerButton
            getAnswerUrl={(answerId) => {
              const [__, ...urlParts] = url.split('/').reverse();
              return `${urlParts.reverse().join('/')}/${
                nestedUrls.draftAnswers
              }/${answerId}/form`;
            }}
            referral={referral}
          />
        ) : null}
      </div>
    </article>
  );
};
