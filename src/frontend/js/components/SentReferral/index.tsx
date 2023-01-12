import React from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { useParams } from 'react-router-dom';

import { useCurrentUser } from 'data/useCurrentUser';

import { Link, NavLink, useLocation } from 'react-router-dom';
import { nestedUrls } from '../../const';

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
});

interface SentReferralRouteParams {
  referral: string;
}

export const SentReferral: React.FC = () => {
  const { referral } = useParams<SentReferralRouteParams>();
  const { currentUser } = useCurrentUser();

  return (
    <section className="container mx-auto">
      <div className="row">
        <div className="col-sm-12 flex justify-center mt-20">
          <img src="/static/core/img/check-circle.png" alt="" />
        </div>
      </div>
      <div className="row">
        <div className="col-sm-12 flex flex-col justify-center text-center">
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
                    className="text-primary-500 hover:underline "
                    to={`/sent-referrals/referral-detail/${referral}/messages`}
                    aria-current="true"
                  >
                    <FormattedMessage {...messages.exchangeZone} />
                  </NavLink>
                ),
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
};
