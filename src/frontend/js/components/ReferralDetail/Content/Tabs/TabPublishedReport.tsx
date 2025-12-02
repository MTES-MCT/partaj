import React, { useContext, useState } from 'react';

import { Referral, ReferralReport as RReport } from 'types';
import { nestedUrls } from '../../../../const';
import { NavLink } from 'react-router-dom';

import { GenericErrorMessage } from 'components/GenericErrorMessage';
import { Nullable } from '../../../../types/utils';
import { ReferralContext } from '../../../../data/providers/ReferralProvider';
import { useReferralReport } from '../../../../data';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { isUserReferralUnitsMember } from '../../../../utils/unit';
import { Spinner } from '../../../Spinner';
import { userIsRequester } from '../../../../utils/referral';
import { useCurrentUser } from '../../../../data/useCurrentUser';
import { isInArray } from '../../../../utils/array';
import { SatisfactionInset } from '../../../SatisfactionInset';
import { Title, TitleType } from '../../../text/Title';
import { PublishedReport } from '../../../PublishedReport/PublishedReport';

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

export const TabPublishedReport: React.FC = () => {
  const [report, setReport] = useState<RReport>();
  const { currentUser } = useCurrentUser();
  const { referral }: { referral: Nullable<Referral> } = useContext(
    ReferralContext,
  );
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

          <div className="bg-grey-100 text-sm px-6 py-2">
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

          {report.publishments.length > 0 && (
            <>
              <Title
                type={TitleType.H4}
                className="font-medium text-dsfr-primary-500"
              >
                <FormattedMessage
                  {...messages.publishedAnswerTitle}
                  values={{ referralId: referral.id }}
                />
              </Title>
              <PublishedReport
                report={report}
                referral={referral}
                publishment={report.publishments[0]}
              />
            </>
          )}

          {report.publishments.length > 1 && (
            <>
              <Title type={TitleType.H5} className="text-dsfr-grey-700">
                {' '}
                Réponses antérieures
              </Title>

              {report.publishments.map((publishment, index) => {
                return index === 0 ? null : (
                  <PublishedReport
                    key={publishment.id}
                    referral={referral}
                    report={report}
                    publishment={publishment}
                  />
                );
              })}
            </>
          )}
        </div>
      )}
    </>
  );
};
