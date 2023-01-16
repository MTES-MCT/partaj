import React from 'react';
import * as types from 'types';
import { ObserversBlock } from '../../../ReferralForm/ObserversBlock';
import { RequestersBlock } from '../../../ReferralForm/RequestersBlock';
import { defineMessages } from 'react-intl';

interface TabUsersProps {
  referral: types.Referral;
}

const messages = defineMessages({
  requesterListTitle: {
    defaultMessage: 'Requesters linked to this referral',
    description:
      'Title for the list of users linked to a referral as requesters.',
    id: 'components.TabUsers.requesterListTitle',
  },
  requesterListExplanation: {
    defaultMessage:
      'Add the members of your department who initiated the referral.',
    description:
      'Explanation text for the suggest box to add users to the referral.',
    id: 'components.TabUsers.requesterListExplanation',
  },
  observerListTitle: {
    defaultMessage: 'Observers linked to this referral',
    description:
      'Title for the list of users linked to a referral as observers.',
    id: 'components.TabUsers.observerListTitle',
  },
  observerListExplanation: {
    defaultMessage:
      'Add one or more persons from one or more departments interested in the outcome of the referral.',
    description:
      'Explanation text for the suggest box to add users to the referral.',
    id: 'components.TabUsers.observerListExplanation',
  },
});

export const TabUsers: React.FC<TabUsersProps> = ({ referral }) => {
  return (
    <>
      <RequestersBlock
        referral={referral}
        title={messages.requesterListTitle}
        description={messages.requesterListExplanation}
        invite
      />
      <ObserversBlock
        referral={referral}
        title={messages.observerListTitle}
        description={messages.observerListExplanation}
        invite
      />
    </>
  );
};
