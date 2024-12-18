import React from 'react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { useUIDSeed } from 'react-uid';
import { useHistory, useRouteMatch } from 'react-router-dom';
import { useCurrentUser } from 'data/useCurrentUser';
import { Referral } from 'types';
import { isUserReferralUnitsMember, isUserUnitMember } from 'utils/unit';
import { CreateAnswerButton } from '../../../buttons/CreateAnswerButton';
import { ChangeTabButton } from '../../../buttons/ChangeTabButton';
import { DownloadReferralButton } from '../../../buttons/DowloadReferralBtn';
import { nestedUrls } from '../../../../const';
import { SatisfactionInset } from '../../../SatisfactionInset';
import { isInArray } from '../../../../utils/array';
import { Title, TitleType } from '../../../text/Title';
import { Text, TextType } from '../../../text/Text';
import { AddIcon, FileIcon } from '../../../Icons';
import { IconTextButton } from '../../../buttons/IconTextButton';
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

export const TabNewReferral: React.FC<ReferralDetailContentProps> = ({
  referral,
}) => {
  const seed = useUIDSeed();
  const { url } = useRouteMatch();
  const history = useHistory();
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
      <article className="" aria-labelledby={seed('referral-article')}>
        <div className="space-y-6">
          <Title type={TitleType.H5}>
            {referral.object ? (
              referral.object
            ) : (
              <FormattedMessage
                {...messages.title}
                values={{ caseNumber: referral.id }}
              />
            )}
          </Title>
          <div className="w-full flex justify-start">
            {currentUser && currentUser.memberships.length === 0 ? (
              <div className="flex space-x-4">
                <IconTextButton
                  onClick={(e) => {
                    e.preventDefault();
                    const [__, ...urlParts] = url.split('/').reverse();
                    const redirection = `${urlParts.reverse().join('/')}/${
                      nestedUrls.messages
                    }`;
                    history.push(redirection);
                  }}
                  icon={<AddIcon className="fill-primary700" />}
                  otherClasses="border border-primary-700 text-primary-700 px-4 py-2"
                  spanClasses="text-sm"
                  text={intl.formatMessage(messages.completeReferral)}
                />
              </div>
            ) : null}
            <div className="flex space-x-4">
              <DownloadReferralButton referralId={String(referral!.id)} />

              {referral.units.some((unit) =>
                isUserUnitMember(currentUser, unit),
              ) ? (
                <>
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
          <div>
            <Title type={TitleType.H5}>
              <FormattedMessage {...messages.topic} />
            </Title>
            <Text type={TextType.PARAGRAPH_NORMAL}>{referral.topic.name}</Text>
          </div>

          <div>
            <Title type={TitleType.H5}>
              <FormattedMessage {...messages.question} />
            </Title>
            <Text type={TextType.PARAGRAPH_NORMAL}>{referral.question}</Text>
          </div>
          <div>
            <Title type={TitleType.H5}>
              <FormattedMessage {...messages.context} />
            </Title>
            <Text type={TextType.PARAGRAPH_NORMAL}>{referral.context}</Text>
          </div>

          <div>
            <Title type={TitleType.H5}>
              <FormattedMessage {...messages.priorWork} />
            </Title>
            <Text type={TextType.PARAGRAPH_NORMAL}>{referral.prior_work}</Text>
          </div>

          {referral.attachments.length > 0 ? (
            <>
              {referral.attachments.map((attachment) => (
                <a href={attachment.file} key={attachment.id}>
                  <div className="flex space-x-2 items-center">
                    <div className="flex w-fit space-x-1 items-center">
                      <FileIcon />
                      <span className="font-light text-sm pb-0.5">
                        {attachment.name_with_extension}
                      </span>
                    </div>
                  </div>
                </a>
              ))}
            </>
          ) : null}

          <div>
            <Title type={TitleType.H5}>
              <FormattedMessage {...messages.priorWork} />
            </Title>
            <Text type={TextType.PARAGRAPH_NORMAL}>{referral.prior_work}</Text>
          </div>

          <div>
            <Title type={TitleType.H5}>
              <FormattedMessage {...messages.expectedResponseTime} />
            </Title>
            <Text type={TextType.PARAGRAPH_NORMAL}>
              {referral.urgency_level.name}
            </Text>
          </div>

          {referral.urgency_explanation ? (
            <div>
              <Title type={TitleType.H5}>
                <FormattedMessage {...messages.urgencyExplanation} />
              </Title>
              <Text type={TextType.PARAGRAPH_NORMAL}>
                {referral.urgency_explanation}
              </Text>
            </div>
          ) : null}
        </div>
      </article>
    </div>
  );
};
