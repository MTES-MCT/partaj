import React from 'react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { useParams } from 'react-router-dom';

import { useCurrentUser } from 'data/useCurrentUser';

import { NavLink } from 'react-router-dom';
import { useTitle } from 'utils/useTitle';
import { useFeatureFlag } from 'data';

const messages = defineMessages({
  caseNumber: {
    defaultMessage: 'Case number: #{ id }',
    description:
      'Mention in the "referral sent" view after a user sends a referral.',
    id: 'components.SentReferral.caseNumber',
  },
  p1: {
    defaultMessage:
      'Your referral will now be dispatched to the relevant department.',
    description:
      'Mention in the "referral senté view after a user sends a referral.',
    id: 'components.SentReferral.p1',
  },
  p2: {
    defaultMessage: 'You will receive a confirmation email at { email }.',
    description:
      'Mention in the "referral senté view after a user sends a referral.',
    id: 'components.SentReferral.p2',
  },
  title: {
    defaultMessage: 'Referral sent',
    description:
      'Title for the "referral sent" view after a user sends a referral',
    id: 'components.SentReferral.title',
  },
  messagingMessage: {
    defaultMessage:
      'You can send any additional documents or information to the DAJ via the {link}.',
    description: 'exchange message link',
    id: 'components.SentReferral.messagingMessage',
  },
  exchangeZone: {
    defaultMessage: 'the exchange zone',
    description: 'Exchange Zone.',
    id: 'components.SentReferral.exchangeZone',
  },
  processSurveyLink: {
    defaultMessage: 'I give my opinion',
    description: 'Link to a survey about the referral creation process',
    id: 'components.SentReferral.processSurveyLink',
  },
  processSurveyDescription: {
    defaultMessage: 'Help us improve this process',
    description:
      'Description of the survey about the referral creation process',
    id: 'components.SentReferral.processSurveyDescription',
  },
});

interface SentReferralRouteParams {
  referral: string;
}

export const SentReferral: React.FC = () => {
  useTitle('sentReferral');
  const { referral } = useParams<SentReferralRouteParams>();
  const { currentUser } = useCurrentUser();
  const intl = useIntl();
  const { status, data } = useFeatureFlag('je_donne_mon_avis_link');
  const displayLinkToSurvey: boolean = !!(
    status === 'success' && data?.is_active
  );

  return (
    <section className="container mx-auto px-8">
      <div className="row">
        <div className="col-sm-12 flex justify-center mt-20">
          <img
            width={96}
            height={96}
            src="/static/core/img/check-circle.png"
            alt=""
          />
        </div>
      </div>
      <div className="row">
        <div className="col-sm-12 flex flex-col justify-center items-center text-center">
          <h1 className="text-4xl my-4">
            <FormattedMessage {...messages.title} />
          </h1>
          <p className="mb-3">
            <FormattedMessage
              {...messages.caseNumber}
              values={{ id: referral }}
            />
          </p>
          <p className="mb-3">
            <FormattedMessage {...messages.p1} />
          </p>
          {currentUser ? (
            <p className="mb-3">
              <FormattedMessage
                {...messages.p2}
                values={{ email: currentUser.email }}
              />
            </p>
          ) : null}
          <div className="italic">
            <FormattedMessage
              {...messages.messagingMessage}
              values={{
                link: (
                  <NavLink
                    className="text-primary-500 underline"
                    to={`/sent-referrals/referral-detail/${referral}/messages`}
                    aria-current="true"
                  >
                    <FormattedMessage {...messages.exchangeZone} />
                  </NavLink>
                ),
              }}
            />
          </div>
          {displayLinkToSurvey && (
            <div className="bg-white mt-8 p-4 relative flex flex-col text-center justify-center items-center rounded-sm border border-gray-300 shadow-sm">
              <p className="mb-4">
                <FormattedMessage {...messages.processSurveyDescription} />
              </p>
              <a
                target="_blank"
                href="https://jedonnemonavis.numerique.gouv.fr/Demarches/3136?button=3345"
              >
                <img
                  src="https://jedonnemonavis.numerique.gouv.fr/static/bouton-bleu.svg"
                  alt={intl.formatMessage(messages.processSurveyLink)}
                />
              </a>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
