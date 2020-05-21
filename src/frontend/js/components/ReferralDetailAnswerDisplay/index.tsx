import React from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { useUID } from 'react-uid';

import { Referral } from 'types';
import { getUserFullname } from 'utils/user';

const messages = defineMessages({
  answer: {
    defaultMessage: 'Referral answer',
    description: 'Title for the answer part of the referral detail view',
    id: 'components.ReferralDetailAnswer.answer',
  },
  byWhom: {
    defaultMessage: 'By {name}, {unit_name}',
    description: 'Author of the referral answer',
    id: 'components.ReferralDetailAnswer.byWhom',
  },
});

interface ReferralDetailAnswerDisplayProps {
  referral: Referral;
}

export const ReferralDetailAnswerDisplay = ({
  referral,
}: ReferralDetailAnswerDisplayProps) => {
  const uid = useUID();
  const author = referral.topic.unit.members.find(
    (member) => member.id === referral.answers[0].created_by,
  );

  return (
    <div role="region" aria-labelledby={uid}>
      <h4 id={uid}>
        <FormattedMessage {...messages.answer} />
      </h4>
      <FormattedMessage
        {...messages.byWhom}
        values={{
          name: getUserFullname(author!),
          unit_name: referral.topic.unit.name,
        }}
      />
      <p className="user-content">{referral.answers[0].content}</p>
    </div>
  );
};
