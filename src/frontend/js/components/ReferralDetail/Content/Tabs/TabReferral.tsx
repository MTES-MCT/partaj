import React from 'react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { useUIDSeed } from 'react-uid';
import { useRouteMatch } from 'react-router-dom';

import { AttachmentsList } from 'components/AttachmentsList';
import { RichTextView } from 'components/RichText/view';
import { useCurrentUser } from 'data/useCurrentUser';
import { Referral, RequesterUnitType, UnitType } from 'types';
import { isUserReferralUnitsMember, isUserUnitMember } from 'utils/unit';
import { CreateAnswerButton } from '../../../buttons/CreateAnswerButton';
import { ChangeTabButton } from '../../../buttons/ChangeTabButton';
import { DownloadReferralButton } from '../../../buttons/DowloadReferralBtn';
import { nestedUrls } from '../../../../const';
import { SatisfactionInset } from '../../../SatisfactionInset';
import { isInArray } from '../../../../utils/array';
import { sectionTitles } from '../../../ReferralForm/NewForm';
import { commonMessages } from '../../../../const/translations';
import { DownloadNewReferralButton } from '../../../buttons/DowloadNewReferralBtn';

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
  draftAnswer: {
    defaultMessage: 'Create a draft answer',
    description: 'Button to open the answer pane on the referral detail view.',
    id: 'components.ReferralDetailContent.draftAnswer',
  },
  completeReferral: {
    defaultMessage: 'Complete my referral',
    description: 'Button to go to exchange zone.',
    id: 'components.ReferralDetailContent.completeReferral',
  },
  surveyQuestion: {
    defaultMessage: 'What did you think of the referral?',
    description:
      'Question in the survey inset for referral request satisfaction',
    id: 'components.TabReferral.surveyQuestion',
  },
});

interface ReferralDetailContentProps {
  referral: Referral;
}

export const TabReferral: React.FC<ReferralDetailContentProps> = ({
  referral,
}) => {
  const seed = useUIDSeed();
  const { url } = useRouteMatch();
  const intl = useIntl();
  const { currentUser } = useCurrentUser();

  return (
    <div className="space-y-6">
      {referral &&
        currentUser &&
        isUserReferralUnitsMember(currentUser, referral) &&
        !isInArray(
          currentUser.id,
          referral.satisfaction_survey_participants,
        ) && (
          <div className="flex w-full justify-center">
            <SatisfactionInset
              question={intl.formatMessage(messages.surveyQuestion)}
              url={'satisfaction_request'}
            />
          </div>
        )}
      <article
        className="w-full lg:max-w-4xl bg-gray-200 border-gray-400 p-10 rounded-xl border space-y-6"
        aria-labelledby={seed('referral-article')}
        data-testid="tab-referral"
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
              <FormattedMessage {...sectionTitles.requesterUnit} />
            </h4>
            <p>
              {referral.requester_unit_type ===
                RequesterUnitType.CENTRAL_UNIT && (
                <FormattedMessage {...commonMessages[UnitType.CENTRAL]} />
              )}{' '}
            </p>
            <p>
              {referral.requester_unit_type ===
                RequesterUnitType.DECENTRALISED_UNIT && (
                <FormattedMessage {...commonMessages[UnitType.DECENTRALISED]} />
              )}{' '}
            </p>
          </div>
          <div>
            <h4 className="text-lg mb-2 text-gray-500">
              <FormattedMessage {...messages.priorWork} />
            </h4>
            {referral.has_prior_work === 'yes' && (
              <span>
                {' '}
                <b> Oui </b>{' '}
              </span>
            )}
            {referral.has_prior_work === 'no' && (
              <span>
                <b>
                  Le demandeur n’a pas saisi la direction métier compétente sur
                  le sujet pour le motif suivant et/ou dispose des éléments de
                  réponse suivants :
                </b>
              </span>
            )}
            {referral.requester_unit_contact ? (
              <div className="flex">
                <span>
                  Contact service métier:{' '}
                  <b>{referral.requester_unit_contact}</b>
                </span>
              </div>
            ) : (
              ''
            )}
            <RichTextView content={referral.prior_work} />
            {referral.no_prior_work_justification && (
              <p> {referral.no_prior_work_justification} </p>
            )}
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
        <div className="relative w-full h-6">
          {currentUser && currentUser.memberships.length === 0 ? (
            <div className="flex space-x-4 absolute left-0">
              <ChangeTabButton
                styleLink="link"
                redirectUrl={nestedUrls.messages}
              >
                <FormattedMessage {...messages.completeReferral} />
              </ChangeTabButton>
            </div>
          ) : null}
          <div className="flex space-x-4 absolute right-0">
            {referral.ff_new_form === 0 && (
              <DownloadReferralButton referralId={String(referral!.id)} />
            )}
            {referral.ff_new_form === 1 && (
              <DownloadNewReferralButton referralId={String(referral!.id)} />
            )}
            {referral.units.some((unit) =>
              isUserUnitMember(currentUser, unit),
            ) ? (
              <>
                {' '}
                {referral.feature_flag ? (
                  <ChangeTabButton redirectUrl={nestedUrls.draftAnswer}>
                    <FormattedMessage {...messages.draftAnswer} />
                  </ChangeTabButton>
                ) : (
                  <CreateAnswerButton
                    getAnswerUrl={(answerId) => {
                      const [__, ...urlParts] = url.split('/').reverse();
                      return `${urlParts.reverse().join('/')}/${
                        nestedUrls.draftAnswers
                      }/${answerId}/form`;
                    }}
                    referral={referral}
                  />
                )}
              </>
            ) : null}
          </div>
        </div>
      </article>
    </div>
  );
};
