import React, { useContext, useState } from 'react';

import { Referral, ReferralReport as RReport } from 'types';
import { nestedUrls } from '../../../../const';
import { NavLink } from 'react-router-dom';

import { GenericErrorMessage } from 'components/GenericErrorMessage';
import { Nullable } from '../../../../types/utils';
import { ReferralContext } from '../../../../data/providers/ReferralProvider';
import { useReferralReport } from '../../../../data';
import { useUIDSeed } from 'react-uid';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { getUserFullname } from '../../../../utils/user';
import {
  isUserReferralUnitsMember,
  isUserUnitMember,
} from '../../../../utils/unit';
import { RichTextView } from '../../../RichText/view';
import { AttachmentsList } from '../../../AttachmentsList';
import { Spinner } from '../../../Spinner';
import filesize from 'filesize';
import { userIsRequester } from '../../../../utils/referral';
import { useCurrentUser } from '../../../../data/useCurrentUser';
import { isInArray } from '../../../../utils/array';
import { SatisfactionInset } from '../../../SatisfactionInset';
import { Title, TitleType } from '../../../text/Title';
import { ReferralBlock } from './TabReferral';

const messages = defineMessages({
  loadingReport: {
    defaultMessage: 'Loading referral report...',
    description:
      'Accessibility message for the spinner in the referral detail report tab.',
    id: 'components.TabPublishedReport.loadingReport',
  },
  attachments: {
    defaultMessage: 'Other documents',
    description: 'Title for the list of attachments on the referral answer.',
    id: 'components.TabPublishedReport.attachments',
  },
  comment: {
    defaultMessage: 'Comment',
    description: 'Title for the comment attached to the published report.',
    id: 'components.TabPublishedReport.comment',
  },
  version: {
    defaultMessage: 'Final version',
    description: 'Title for the final report version',
    id: 'components.TabPublishedReport.version',
  },
  byWhom: {
    defaultMessage: 'By {name}, {unit_name}',
    description: 'Author of the referral answer',
    id: 'components.TabPublishedReport.byWhom',
  },
  publishedAnswerTitle: {
    defaultMessage: 'Referral answer number {referralId}',
    description:
      'Title for the final published answer on the referral detail view.',
    id: 'components.TabPublishedReport.publishedAnswerTitle',
  },
  thank: {
    defaultMessage:
      'If you wish to thank the DAJ or get additional information, please don’t hesitate to use {link}',
    description: 'Thanks message.',
    id: 'components.TabPublishedReport.thank',
  },
  exchangeZone: {
    defaultMessage: 'the exchange zone',
    description: 'Exchange Zone.',
    id: 'components.TabPublishedReport.exchangeZone',
  },
  surveyQuestion: {
    defaultMessage: 'What did you think of this referral?',
    description:
      'Question in the survey inset for referral response satisfaction',
    id: 'components.TabPublishedReport.surveyQuestion',
  },
});

const size = filesize.partial({
  locale: document.querySelector('html')?.getAttribute('lang') || 'en-US',
});

export const TabPublishedReport: React.FC = () => {
  const [report, setReport] = useState<RReport>();
  const { currentUser } = useCurrentUser();
  const { referral }: { referral: Nullable<Referral> } = useContext(
    ReferralContext,
  );
  const seed = useUIDSeed();
  const intl = useIntl();
  const { status: reportStatus } = useReferralReport(referral!.report!.id, {
    onSuccess: (data) => {
      setReport(data);
    },
  });

  if ([reportStatus].includes('error')) {
    return <GenericErrorMessage />;
  }

  if ([reportStatus].includes('idle') || [reportStatus].includes('loading')) {
    return (
      <Spinner size="large">
        <FormattedMessage {...messages.loadingReport} />
      </Spinner>
    );
  }

  return (
    <>
      {currentUser && referral && report && (
        <div className="space-y-6">
          {userIsRequester(currentUser, referral) &&
            !isUserReferralUnitsMember(currentUser, referral) &&
            !isInArray(
              currentUser.id,
              referral.satisfaction_survey_participants,
            ) && (
              <div className="flex w-full justify-center">
                <SatisfactionInset
                  question={intl.formatMessage(messages.surveyQuestion)}
                  url={'satisfaction_response'}
                />
              </div>
            )}

          {report.publishments.length > 0 ? (
            <>
              <article
                className="w-full flex flex-col space-y-6"
                aria-labelledby={seed('referral-answer-article')}
                id={`answer-${report.id}`}
              >
                <ReferralBlock>
                  <Title type={TitleType.H4} className="font-normal">
                    <FormattedMessage
                      {...messages.publishedAnswerTitle}
                      values={{ referralId: referral.id }}
                    />
                  </Title>

                  <div className="flex flex-col">
                    <p>
                      <FormattedMessage
                        {...messages.byWhom}
                        values={{
                          name: getUserFullname(
                            report.publishments[report.publishments.length - 1]
                              .created_by,
                          ),
                          unit_name:
                            referral.units.filter((unit) =>
                              isUserUnitMember(
                                report.publishments[
                                  report.publishments.length - 1
                                ].created_by,
                                unit,
                              ),
                            )[0]?.name || '',
                        }}
                      />
                    </p>
                    <p>
                      {
                        report.publishments[report.publishments.length - 1]
                          .created_by.email
                      }
                    </p>
                    <p>
                      {
                        report.publishments[report.publishments.length - 1]
                          .created_by.phone_number
                      }
                    </p>
                  </div>
                </ReferralBlock>

                {report.publishments[report.publishments.length - 1]
                  .comment && (
                  <ReferralBlock
                    title={<FormattedMessage {...messages.comment} />}
                  >
                    <RichTextView
                      content={
                        report.publishments[report.publishments.length - 1]
                          .comment
                      }
                    />
                  </ReferralBlock>
                )}

                <ReferralBlock
                  title={<FormattedMessage {...messages.version} />}
                  background={'bg-white'}
                >
                  <a
                    className="list-group-item focus:bg-gray-200 hover:text-primary-500 focus:text-primary-500 hover:underline focus:underline"
                    href={report.publishments[0].version.document.file}
                    key={report.publishments[0].version.document.id}
                  >
                    {
                      report.publishments[0].version.document
                        .name_with_extension
                    }
                    {report.publishments[0].version.document.size
                      ? ` — ${size(
                          report.publishments[0].version.document.size,
                        )}`
                      : null}
                  </a>
                </ReferralBlock>
                {report.attachments.length > 0 ? (
                  <ReferralBlock
                    title={<FormattedMessage {...messages.attachments} />}
                    background={'bg-white'}
                  >
                    <AttachmentsList
                      attachments={report.attachments}
                      labelId={seed('referral-answer-attachments')}
                    />
                  </ReferralBlock>
                ) : null}

                <div className="italic">
                  <FormattedMessage
                    {...messages.thank}
                    values={{
                      link: (
                        <NavLink
                          className="text-primary-500 underline "
                          to={`${nestedUrls.messages}`}
                          aria-current="true"
                        >
                          <FormattedMessage {...messages.exchangeZone} />
                        </NavLink>
                      ),
                    }}
                  />
                </div>
              </article>
            </>
          ) : (
            <>
              {report.final_version && (
                <article
                  className="w-full flex flex-col space-y-6"
                  aria-labelledby={seed('referral-answer-article')}
                  id={`answer-${report.id}`}
                >
                  <ReferralBlock>
                    <Title type={TitleType.H4} className="font-normal">
                      <FormattedMessage
                        {...messages.publishedAnswerTitle}
                        values={{ referralId: referral.id }}
                      />
                    </Title>

                    <div className="flex flex-col">
                      <p>
                        <FormattedMessage
                          {...messages.byWhom}
                          values={{
                            name: getUserFullname(
                              report.final_version.created_by,
                            ),
                            unit_name:
                              referral.units.filter((unit) =>
                                isUserUnitMember(
                                  report.final_version!.created_by,
                                  unit,
                                ),
                              )[0]?.name || '',
                          }}
                        />
                      </p>
                      <p>{report.final_version.created_by.email}</p>
                      <p>{report.final_version.created_by.phone_number}</p>
                    </div>
                  </ReferralBlock>

                  {report.comment && (
                    <ReferralBlock
                      title={<FormattedMessage {...messages.comment} />}
                    >
                      <RichTextView content={report.comment} />
                    </ReferralBlock>
                  )}

                  <ReferralBlock
                    title={<FormattedMessage {...messages.version} />}
                    background={'bg-white'}
                  >
                    <a
                      className="list-group-item focus:bg-gray-200 hover:text-primary-500 focus:text-primary-500 hover:underline focus:underline"
                      href={report?.final_version.document.file}
                      key={report?.final_version.document.id}
                    >
                      {report?.final_version.document.name_with_extension}
                      {report?.final_version.document.size
                        ? ` — ${size(report?.final_version.document.size)}`
                        : null}
                    </a>
                  </ReferralBlock>
                  {referral.attachments.length > 0 ? (
                    <ReferralBlock
                      title={<FormattedMessage {...messages.attachments} />}
                      background={'bg-white'}
                    >
                      <AttachmentsList
                        attachments={report.attachments}
                        labelId={seed('referral-answer-attachments')}
                      />
                    </ReferralBlock>
                  ) : null}

                  <div className="italic">
                    <FormattedMessage
                      {...messages.thank}
                      values={{
                        link: (
                          <NavLink
                            className="text-primary-500 underline "
                            to={`${nestedUrls.messages}`}
                            aria-current="true"
                          >
                            <FormattedMessage {...messages.exchangeZone} />
                          </NavLink>
                        ),
                      }}
                    />
                  </div>
                </article>
              )}
            </>
          )}
        </div>
      )}
    </>
  );
};
