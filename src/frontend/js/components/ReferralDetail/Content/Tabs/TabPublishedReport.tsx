import React, { useContext, useState } from 'react';

import { Referral, ReferralReport as RReport } from 'types';
import { nestedUrls } from '../../../../const';
import { NavLink } from 'react-router-dom';

import { GenericErrorMessage } from 'components/GenericErrorMessage';
import { Nullable } from '../../../../types/utils';
import { ReferralContext } from '../../../../data/providers/ReferralProvider';
import { useReferralReport } from '../../../../data';
import { useUIDSeed } from 'react-uid';
import { defineMessages, FormattedMessage } from 'react-intl';
import { getUserFullname } from '../../../../utils/user';
import { isUserUnitMember } from '../../../../utils/unit';
import { RichTextView } from '../../../RichText/view';
import { AttachmentsList } from '../../../AttachmentsList';
import { Spinner } from '../../../Spinner';
import filesize from 'filesize';

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
    defaultMessage: 'Referral answer',
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
});

const size = filesize.partial({
  locale: document.querySelector('html')?.getAttribute('lang') || 'en-US',
});

export const TabPublishedReport: React.FC = () => {
  const [report, setReport] = useState<RReport>();
  const { referral }: { referral: Nullable<Referral> } = useContext(
    ReferralContext,
  );
  const seed = useUIDSeed();

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
      {referral && report && (
        <article
          className="max-w-sm w-full lg:max-w-full border-gray-500 bg-gray-200 p-10 mt-8 mb-8 rounded-xl border space-y-6 overflow-hidden"
          aria-labelledby={seed('referral-answer-article')}
          id={`answer-${report.id}`}
        >
          <h4
            id={seed('referral-answer-article')}
            className="text-4xl"
            // Make sure the dropdown menu does not create unwanted spacing
            style={{ marginTop: 0 }}
          >
            <FormattedMessage {...messages.publishedAnswerTitle} />
          </h4>
          {report.final_version && (
            <>
              <div>
                <div className="font-semibold">
                  <FormattedMessage
                    {...messages.byWhom}
                    values={{
                      name: getUserFullname(report.final_version.created_by),
                      unit_name:
                        referral.units.filter((unit) =>
                          isUserUnitMember(
                            report.final_version!.created_by,
                            unit,
                          ),
                        )[0]?.name || '',
                    }}
                  />
                </div>
                <div className="text-gray-500">
                  {report.final_version.created_by.email}
                </div>
                <div className="text-gray-500">
                  {report.final_version.created_by.phone_number}
                </div>
              </div>
              {report.comment && (
                <div>
                  <h5
                    id={seed('referral-answer-attachments')}
                    className="text-lg font-medium mb-2"
                  >
                    <FormattedMessage {...messages.comment} />
                  </h5>
                  <RichTextView content={report.comment} />
                </div>
              )}
              <div>
                <h5
                  id={seed('referral-answer-attachments')}
                  className="text-lg font-medium mb-2"
                >
                  <FormattedMessage {...messages.version} />
                </h5>
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
              </div>
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
            </>
          )}

          {report.attachments.length ? (
            <div>
              <h5
                id={seed('referral-answer-attachments')}
                className="text-lg font-medium mb-2"
              >
                <FormattedMessage {...messages.attachments} />
              </h5>
              <AttachmentsList
                attachments={report.attachments}
                labelId={seed('referral-answer-attachments')}
              />
            </div>
          ) : null}
        </article>
      )}
    </>
  );
};
