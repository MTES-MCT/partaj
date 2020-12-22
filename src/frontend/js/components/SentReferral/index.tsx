import React from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';

import { useCurrentUser } from 'data/useCurrentUser';
import { Referral } from 'types';

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
});

interface SentReferralProps {
  referral: Referral['id'];
}

export const SentReferral: React.FC<SentReferralProps> = ({ referral }) => {
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
        </div>
      </div>
    </section>
  );
};
