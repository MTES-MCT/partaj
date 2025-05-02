import React from 'react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { useUIDSeed } from 'react-uid';

import { AttachmentsList } from 'components/AttachmentsList';
import { RichTextView } from 'components/RichText/view';
import { useCurrentUser } from 'data/useCurrentUser';
import {
  Referral,
  ReferralState,
  ReferralType,
  RequesterUnitType,
  UnitType,
  User,
} from 'types';
import { isUserReferralUnitsMember, isUserUnitMember } from 'utils/unit';
import { ChangeTabButton } from '../../../buttons/ChangeTabButton';
import { DownloadReferralButton } from '../../../buttons/DowloadReferralBtn';
import { nestedUrls } from '../../../../const';
import { sectionTitles } from '../../../ReferralForm/NewForm';
import { commonMessages } from '../../../../const/translations';
import { DownloadNewReferralButton } from '../../../buttons/DowloadNewReferralBtn';
import { Title, TitleType } from '../../../text/Title';
import { useFeatureFlag } from 'data';
import { SplitReferralButton } from '../../../buttons/SplitReferralButton';
import { InfoIcon } from '../../../Icons';
import { referralIsMain } from '../../../../utils/referral';
import { isInArray } from '../../../../utils/array';
import { SatisfactionInset } from '../../../SatisfactionInset';

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
    defaultMessage: 'Topic',
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
  noPriorWorkText: {
    defaultMessage:
      'The applicant has not referred the matter to the relevant business unit for the following reason and/or has the following information to hand response:',
    description: 'Introduction text for no prior work justification',
    id: 'components.TabReferral.noPriorWorkText',
  },
  splitPopupText: {
    defaultMessage:
      "This feature allows you to split a request into several parts if it is too large and/or involves several offices. {br} Once you've split the referral, a new referral will be created in identical draft form, still invisible to applicants, and you can edit it before sending it as a sub-part of the initial referral.",
    description: 'Introduction text for no prior work justification',
    id: 'components.TabReferral.splitPopupText',
  },
  emailContact: {
    defaultMessage: 'Business department contact: {email}',
    description: 'Email contact',
    id: 'components.TabReferral.emailContact',
  },
});

interface ReferralDetailContentProps {
  referral: Referral;
}

export const ReferralBlock: React.FC<{
  title?: React.ReactNode;
  background?: string;
}> = ({ children, title, background }) => (
  <div className="flex flex-col w-full space-y-2">
    {title && (
      <Title type={TitleType.H6} className="uppercase font-normal">
        {title}
      </Title>
    )}
    <div
      className={`flex flex-col ${
        background ?? 'bg-grey-100'
      } py-2 px-6 text-sm space-y-2`}
    >
      {children}
    </div>
  </div>
);

export const TabReferral: React.FC<ReferralDetailContentProps> = ({
  referral,
}) => {
  const seed = useUIDSeed();
  const intl = useIntl();
  const { currentUser } = useCurrentUser();
  const { status, data } = useFeatureFlag('referral_survey_buttons');
  const {
    status: splitReferralStatus,
    data: splitReferralData,
  } = useFeatureFlag('split_referral');

  const displaySurvey: boolean = !!(status === 'success' && data?.is_active);
  const displaySplitReferralFeature: boolean = !!(
    splitReferralStatus === 'success' && splitReferralData?.is_active
  );

  const canSplitReferral = (user: User, referral: Referral) => {
    return (
      isUserReferralUnitsMember(user, referral) &&
      referral.type === ReferralType.MAIN &&
      [
        ReferralState.PROCESSING,
        ReferralState.ASSIGNED,
        ReferralState.IN_VALIDATION,
        ReferralState.RECEIVED,
      ].includes(referral.state)
    );
  };

  return (
    <div className="font-marianne space-y-6">
      <article
        className="w-full flex flex-col space-y-6"
        aria-labelledby={seed('referral-article')}
        data-testid="tab-referral"
      >
        <ReferralBlock>
          <Title type={TitleType.H4} className="font-normal">
            {referral.object ? (
              referral.object
            ) : (
              <FormattedMessage
                {...messages.title}
                values={{ caseNumber: referral.id }}
              />
            )}
          </Title>

          <div className="flex justify-between">
            <p className="text-sm">
              <FormattedMessage {...sectionTitles.requesterUnit} />
              {' : '}
              {referral.requester_unit_type ===
                RequesterUnitType.CENTRAL_UNIT && (
                <FormattedMessage {...commonMessages[UnitType.CENTRAL]} />
              )}
              {referral.requester_unit_type ===
                RequesterUnitType.DECENTRALISED_UNIT && (
                <FormattedMessage {...commonMessages[UnitType.DECENTRALISED]} />
              )}
            </p>

            <p className="text-sm">
              <FormattedMessage {...messages.expectedResponseTime} />
              {' : '}
              {referral.urgency_level.name}
            </p>
          </div>
          <div className="flex justify-start">
            <FormattedMessage {...messages.topic} />
            {' : '}
            {referral.topic.name}
          </div>
        </ReferralBlock>

        <div className="flex w-full justify-between px-4">
          {currentUser &&
            referral.requesters
              .map((user) => user.id)
              .includes(currentUser.id) && (
              <ChangeTabButton
                styleLink="link"
                redirectUrl={nestedUrls.messages}
              >
                <FormattedMessage {...messages.completeReferral} />
              </ChangeTabButton>
            )}

          {referral.units.some((unit) =>
            isUserUnitMember(currentUser, unit),
          ) ? (
            <>
              {currentUser &&
                referral &&
                displaySplitReferralFeature &&
                canSplitReferral(currentUser, referral) && (
                  <div className="relative">
                    <SplitReferralButton referralId={referral.id} />
                    <div
                      className="absolute -bottom-4 w-full flex justify-center items-center space-x-1 popup popup-info whitespace-pre-line"
                      data-popup={intl.formatMessage(messages.splitPopupText, {
                        br: '\n',
                      })}
                    >
                      <InfoIcon className="w-4 h-4 fill-primary400" />
                      <span className="text-primary-400 text-xs">
                        Qu'est ce que c'est ?
                      </span>
                    </div>
                  </div>
                )}

              <ChangeTabButton redirectUrl={nestedUrls.draftAnswer}>
                <FormattedMessage {...messages.draftAnswer} />
              </ChangeTabButton>
            </>
          ) : null}

          {referral.ff_new_form === 0 && (
            <DownloadReferralButton referralId={String(referral!.id)} />
          )}
          {referral.ff_new_form === 1 && (
            <DownloadNewReferralButton referralId={String(referral!.id)} />
          )}
        </div>

        <div className="flex flex-col space-y-6 px-4">
          <ReferralBlock title={<FormattedMessage {...messages.question} />}>
            <RichTextView content={referral.question} />
          </ReferralBlock>

          <ReferralBlock title={<FormattedMessage {...messages.context} />}>
            <RichTextView content={referral.context} />
          </ReferralBlock>

          <ReferralBlock title={<FormattedMessage {...messages.priorWork} />}>
            {referral.has_prior_work === 'yes' && (
              <span>
                {' '}
                <b> Oui </b>{' '}
              </span>
            )}
            {referral.has_prior_work === 'no' && (
              <span>
                <b>
                  <FormattedMessage {...messages.noPriorWorkText} />
                </b>
              </span>
            )}
            {referral.requester_unit_contact ? (
              <span>
                <FormattedMessage
                  {...messages.emailContact}
                  values={{ email: referral.requester_unit_contact }}
                />
              </span>
            ) : (
              ''
            )}

            <RichTextView content={referral.prior_work} />

            {referral.no_prior_work_justification && (
              <p> {referral.no_prior_work_justification} </p>
            )}
          </ReferralBlock>

          {referral.attachments.length > 0 ? (
            <ReferralBlock
              title={<FormattedMessage {...messages.attachments} />}
              background={'bg-white'}
            >
              <AttachmentsList
                attachments={referral.attachments}
                labelId={seed('referral-attachments')}
              />
            </ReferralBlock>
          ) : null}

          {referral.urgency_explanation ? (
            <ReferralBlock
              title={<FormattedMessage {...messages.urgencyExplanation} />}
            >
              <p className="user-content">{referral.urgency_explanation}</p>
            </ReferralBlock>
          ) : null}
        </div>
      </article>
      {referral &&
        displaySurvey &&
        currentUser &&
        isUserReferralUnitsMember(currentUser, referral) &&
        referralIsMain(referral) &&
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
    </div>
  );
};
