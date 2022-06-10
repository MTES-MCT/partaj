import React from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';

import { ReferralAnswer } from 'types';
import { getUserFullname } from 'utils/user';

const messages = defineMessages({
  answeredValidations: {
    defaultMessage: 'Validations',
    description:
      'Second line of the activity indicator for answers, listing validators',
    id: 'components.ReferralActivityIndicator.ActivityAnsweredValidations.answeredValidations',
  },
  loadingValidations: {
    defaultMessage: 'Loading validations...',
    description:
      'Accessibility message for the spinner while loading validations',
    id: 'components.ReferralActivityIndicator.ActivityAnsweredValidations.loadingValidations',
  },
});

interface ActivityAnsweredValidationsProps {
  answer: ReferralAnswer;
}

export const ActivityAnsweredValidations: React.FC<
  ActivityAnsweredValidationsProps
> = ({ answer }) => {
  return answer.validators.length > 0 ? (
    <>
      <FormattedMessage {...messages.answeredValidations} />:{' '}
      {answer.validators
        .map((validator) => getUserFullname(validator))
        .join(', ')}
    </>
  ) : null;
};
