import React from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';

import {
  ReferralAnswerValidationRequest,
  ReferralAnswerValidationResponseState,
} from 'types';

const messages = defineMessages({
  notValidated: {
    defaultMessage: 'Changes requested',
    description:
      'Text for the status badge for a non validated answer validation request.',
    id: 'components.ReferralAnswerValidationStatusBadge.notValidated',
  },
  pending: {
    defaultMessage: 'Pending',
    description:
      'Text for the status badge for a pending answer validation request.',
    id: 'components.ReferralAnswerValidationStatusBadge.pending',
  },
  validated: {
    defaultMessage: 'Validated',
    description:
      'Text for the status badge for a validated answer validation request.',
    id: 'components.ReferralAnswerValidationStatusBadge.validated',
  },
});

interface ReferralAnswerValidationStatusBadgeProps {
  validationRequest: ReferralAnswerValidationRequest;
}

export const ReferralAnswerValidationStatusBadge: React.FC<ReferralAnswerValidationStatusBadgeProps> = ({
  validationRequest,
}) => {
  if (
    !validationRequest.response ||
    validationRequest.response.state ===
      ReferralAnswerValidationResponseState.PENDING
  ) {
    return (
      <div
        className={`inline-block px-3 py-1 capitalize rounded-sm border-2
          border-gray-500 text-gray-500 bg-gray-transparent-8p`}
      >
        <FormattedMessage {...messages.pending} />
      </div>
    );
  }

  if (
    validationRequest.response.state ===
    ReferralAnswerValidationResponseState.VALIDATED
  ) {
    return (
      <div
        className={`inline-block px-3 py-1 capitalize rounded-sm border-2
          border-success-500 text-success-500 bg-success-200`}
      >
        <FormattedMessage {...messages.validated} />
      </div>
    );
  }

  return (
    <div
      className={`inline-block px-3 py-1 capitalize rounded-sm border-2
        border-warning-700 text-warning-800 bg-warning-transparent-8p`}
    >
      <FormattedMessage {...messages.notValidated} />
    </div>
  );
};
