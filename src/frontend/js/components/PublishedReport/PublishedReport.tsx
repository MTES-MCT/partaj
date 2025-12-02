import React from 'react';

import { Referral, ReferralReport, ReferralReportPublishment } from 'types';
import { useUIDSeed } from 'react-uid';
import { defineMessages, FormattedDate, FormattedMessage } from 'react-intl';
import { getUserFullname } from '../../utils/user';
import { isUserUnitMember } from '../../utils/unit';
import { Title, TitleType } from '../text/Title';
import { Text, TextType } from '../text/Text';
import { VersionDocument } from '../ReferralReport/VersionDocument';
import { QuoteIcon } from '../Icons';
import { RichTextView } from '../RichText/view';
import { ReportAttachment } from '../Attachment/ReportAttachment';

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

export const PublishedReport: React.FC<{
  referral: Referral;
  report: ReferralReport;
  publishment: ReferralReportPublishment;
}> = ({ referral, report, publishment }) => {
  const seed = useUIDSeed();

  return (
    <article
      className="w-full flex flex-col space-y-6 border border-dsfr-grey-500 px-6 py-2"
      aria-labelledby={seed('referral-answer-article')}
      id={`answer-${publishment.id}`}
    >
      <div className="flex flex-col">
        <div className="flex justify-between items-start">
          <div className="flex flex-col">
            <Text type={TextType.SPAN_SMALL} className="font-medium">
              <FormattedMessage
                {...messages.byWhom}
                values={{
                  name: getUserFullname(publishment.created_by),
                  unit_name:
                    referral.units.filter((unit) =>
                      isUserUnitMember(publishment.created_by, unit),
                    )[0]?.name || '',
                }}
              />
            </Text>

            <Text type={TextType.SPAN_SMALL} className="font-normal">
              {publishment.created_by.email}
            </Text>

            {publishment.created_by.phone_number && (
              <Text
                type={TextType.SPAN_SUPER_SMALL}
                className="text-dsfr-grey-500 font-normal"
              >
                {publishment.created_by.phone_number}
              </Text>
            )}
          </div>
          <div>
            <span className="text-dsfr-grey-500 text-xs">
              Publié le{' '}
              <FormattedDate
                year="numeric"
                month="long"
                day="numeric"
                value={publishment.created_at}
              />
            </span>
          </div>
        </div>
      </div>

      <div>
        <Title className="uppercase font-medium" type={TitleType.H6}>
          {' '}
          AVIS JURIDIQUE
        </Title>
        <VersionDocument version={publishment.version} />
      </div>
      {publishment.comment && (
        <div>
          <div>
            <Title className="uppercase font-medium" type={TitleType.H6}>
              <FormattedMessage {...messages.comment} />
            </Title>
            <div className="flex items-start space-x-2">
              <QuoteIcon />
              <RichTextView content={publishment.comment} />
            </div>
          </div>
        </div>
      )}

      {report && report.attachments?.length > 0 ? (
        <div>
          <Title className="uppercase font-medium" type={TitleType.H6}>
            <FormattedMessage {...messages.attachments} />
          </Title>
          {report &&
            report.attachments?.map((attachment) => (
              <ReportAttachment document={attachment} />
            ))}
        </div>
      ) : null}
    </article>
  );
};
