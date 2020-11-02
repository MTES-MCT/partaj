import React from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { QueryStatus } from 'react-query';

import { Spinner } from 'components/Spinner';
import { useReferralAnswerValidationRequests } from 'data';
import { ContextProps } from 'types/context';
import { GenericErrorMessage } from 'components/GenericErrorMessage';

const messages = defineMessages({
  loadingAnswerValidations: {
    defaultMessage: 'Loading answer validations...',
    description:
      'Accessible message for the spinner while answer validations are loading',
    id:
      'components.ReferralDetailAnswerDisplay.AnswerValidations.loadingAnswerValidations',
  },
  noValidationRequests: {
    defaultMessage: 'No validations have been requested yet.',
    description: 'Empty message when there are not validation requests yet.',
    id:
      'components.ReferralDetailAnswerDisplay.AnswerValidations.noValidationRequests',
  },
  validations: {
    defaultMessage: 'Validations',
    description:
      'Button to open the validation interface on a referral answer.',
    id: 'components.ReferralDetailAnswerDisplay.AnswerValidations.validations',
  },
});

interface AnswerValidationsProps {
  answerId: string;
}

export const AnswerValidations: React.FC<
  AnswerValidationsProps & ContextProps
> = ({ answerId, context }) => {
  const { status, data } = useReferralAnswerValidationRequests(
    context,
    answerId,
  );

  switch (status) {
    case QueryStatus.Success:
      return (
        <div className="bg-gray-300 -mx-10 px-10 py-4 shadow-inner">
          <h5 className="text-lg text-gray-700 mb-2">
            <FormattedMessage {...messages.validations} />
          </h5>

          {data!.count > 0 ? (
            <ul>
              {data!.results.map((validationRequest) => (
                <li key={validationRequest.id}>{validationRequest}</li>
              ))}
            </ul>
          ) : (
            <div>
              <FormattedMessage {...messages.noValidationRequests} />
            </div>
          )}
        </div>
      );

    case QueryStatus.Loading:
      return (
        <Spinner size={'large'}>
          <FormattedMessage {...messages.loadingAnswerValidations} />
        </Spinner>
      );

    case QueryStatus.Error:
    default:
      return <GenericErrorMessage />;
  }
};
