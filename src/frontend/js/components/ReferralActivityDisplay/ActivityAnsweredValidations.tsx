import React from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { QueryStatus } from 'react-query';

import { GenericErrorMessage } from 'components/GenericErrorMessage';
import { Spinner } from 'components/Spinner';
import { useReferralAnswerValidationRequests } from 'data';
import { ReferralAnswer, ReferralAnswerValidationResponseState } from 'types';
import { ContextProps } from 'types/context';
import { getUserFullname } from 'utils/user';

const messages = defineMessages({
  answeredValidations: {
    defaultMessage: 'Validations',
    description:
      'Second line of the activity indicator for answers, listing validators',
    id:
      'components.ReferralActivityIndicator.ActivityAnsweredValidations.answeredValidations',
  },
  loadingValidations: {
    defaultMessage: 'Loading validations...',
    description:
      'Accessibility message for the spinner while loading validations',
    id:
      'components.ReferralActivityIndicator.ActivityAnsweredValidations.loadingValidations',
  },
});

interface ActivityAnsweredValidationsProps extends ContextProps {
  answer: ReferralAnswer;
}

export const ActivityAnsweredValidations: React.FC<ActivityAnsweredValidationsProps> = ({
  answer,
  context,
}) => {
  const { data, status } = useReferralAnswerValidationRequests(
    context,
    answer.draft_answer,
  );

  switch (status) {
    case QueryStatus.Idle:
    case QueryStatus.Loading:
      return (
        <Spinner size="small">
          <FormattedMessage {...messages.loadingValidations} />
        </Spinner>
      );

    case QueryStatus.Success:
      const validations = data!.results.filter(
        (validation) =>
          !!validation.response &&
          validation.response.state ===
            ReferralAnswerValidationResponseState.VALIDATED,
      );
      return validations.length > 0 ? (
        <>
          <FormattedMessage {...messages.answeredValidations} />:{' '}
          {validations
            .map((validation) => getUserFullname(validation.validator))
            .join(', ')}
        </>
      ) : null;

    case QueryStatus.Error:
      return <GenericErrorMessage />;
  }
};
