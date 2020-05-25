import React, { useContext } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';

import { ShowAnswerFormContext } from 'components/ReferralDetail';
import { ReferralDetailAssignment } from 'components/ReferralDetailAssignment';
import { Referral, ReferralState } from 'types';
import { ContextProps } from 'types/context';
import { Nullable } from 'types/utils';
import { getUserFullname } from 'utils/user';

const messages = defineMessages({
  answer: {
    defaultMessage: 'Answer',
    description: 'Button to open the answer pane on the referral detail view.',
    id: 'components.ReferralDetailContent.answer',
  },
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
  setReferral: React.Dispatch<React.SetStateAction<Nullable<Referral>>>;
}

export const ReferralDetailContent: React.FC<
  ReferralDetailContentProps & ContextProps
> = ({ context, referral, setReferral }) => {
  const { showAnswerForm, setShowAnswerForm } = useContext(
    ShowAnswerFormContext,
  );

  return (
    <article
      className="max-w-sm w-full lg:max-w-full border-gray-600 p-10 mt-8 mb-8 rounded-xl border"
      aria-labelledby="referral-label-{{ referral.id }}"
    >
      <ReferralDetailAssignment {...{ context, referral, setReferral }} />

      <h3 className="text-4xl" id="referral-label-{{ referral.id }}">
        <FormattedMessage
          {...messages.title}
          values={{ caseNumber: referral.id }}
        />
      </h3>

      <h4 className="text-lg mt-6 mb-2 text-gray-600">
        <FormattedMessage {...messages.requester} />
      </h4>
      <div className="font-semibold">
        <FormattedMessage
          {...messages.officialRequester}
          values={{ requesterName: referral.requester }}
        />
      </div>
      <div className="text-gray-600">
        <FormattedMessage
          {...messages.requesterAs}
          values={{ requesterName: getUserFullname(referral.user) }}
        />
      </div>
      <div className="text-gray-600">{referral.user.email}</div>
      {referral.user.phone_number ? (
        <div className="text-gray-600">{referral.user.phone_number}</div>
      ) : null}

      <h4 className="text-lg mt-6 mb-2 text-gray-600">
        <FormattedMessage {...messages.topic} />
      </h4>
      <p>{referral.topic.name}</p>

      <h4 className="text-lg mt-6 mb-2 text-gray-600">
        <FormattedMessage {...messages.question} />
      </h4>
      <p className="user-content">{referral.question}</p>

      <h4 className="text-lg mt-6 mb-2 text-gray-600">
        <FormattedMessage {...messages.context} />
      </h4>
      <p className="user-content">{referral.context}</p>

      <h4 className="text-lg mt-6 mb-2 text-gray-600">
        <FormattedMessage {...messages.priorWork} />
      </h4>
      <p className="user-content">{referral.prior_work}</p>

      {referral.attachments.length > 0 ? (
        <>
          <h4 className="text-lg mt-6 mb-2 text-gray-600">
            <FormattedMessage {...messages.attachments} />
          </h4>
          <div className="list-group">
            {referral.attachments.map((attachment) => (
              <a
                className="list-group-item list-group-item-action"
                href={attachment.file}
              >
                {attachment.name_with_extension}
                {attachment.size ? ` — ${attachment.size_human}` : null}
              </a>
            ))}
          </div>
        </>
      ) : null}

      <h4 className="text-lg mt-6 mb-2 text-gray-600">
        <FormattedMessage {...messages.expectedResponseTime} />
      </h4>
      <p>{referral.urgency_human}</p>

      {referral.urgency_explanation ? (
        <>
          <h4 className="text-lg mt-6 mb-2 text-gray-600">
            <FormattedMessage {...messages.urgencyExplanation} />
          </h4>
          <p className="user-content">{referral.urgency_explanation}</p>
        </>
      ) : null}

      {!showAnswerForm &&
      [ReferralState.ASSIGNED, ReferralState.RECEIVED].includes(
        referral.state,
      ) ? (
        <div className="flex justify-end mt-6">
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white py-2 px-4 rounded"
            onClick={() => setShowAnswerForm(true)}
          >
            <FormattedMessage {...messages.answer} />
          </button>
        </div>
      ) : null}
    </article>
  );
};
