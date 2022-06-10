import React from 'react';
import {
  defineMessages,
  FormattedMessage,
  MessageDescriptor,
} from 'react-intl';

import { Spinner } from 'components/Spinner';
import { GenericErrorMessage } from 'components/GenericErrorMessage';
import { useReferralAnswerValidationRequests } from 'data';
import {
  ReferralAnswer,
  ReferralAnswerState,
  ReferralAnswerValidationResponseState,
} from 'types';

const messages = defineMessages({
  draft: {
    defaultMessage: 'Project',
    description: 'Label for the referral answer status badge.',
    id: 'components.ReferralAnswerStatusBadge.draft',
  },
  loadingAnswerStatus: {
    defaultMessage: 'Loading answer status...',
    description: 'Accessible message for answer status badge spinner.',
    id: 'components.ReferralAnswerStatusBadge.loadingAnswerStatus',
  },
  needsRevision: {
    defaultMessage: 'Needs revision',
    description: 'Label for the referral answer status badge.',
    id: 'components.ReferralAnswerStatusBadge.needsRevision',
  },
  pendingValidation: {
    defaultMessage: 'Pending validation',
    description: 'Label for the referral answer status badge.',
    id: 'components.ReferralAnswerStatusBadge.pendingValidation',
  },
  published: {
    defaultMessage: 'Sent',
    description: 'Label for the referral answer status badge.',
    id: 'components.ReferralAnswerStatusBadge.published',
  },
  validated: {
    defaultMessage: 'Validated',
    description: 'Label for the referral answer status badge.',
    id: 'components.ReferralAnswerStatusBadge.validated',
  },
});

const classes = {
  draft: 'border-gray-500 text-gray-500 bg-gray-transparent-8p',
  needsRevision: 'border-danger-600 text-danger-800 bg-danger-transparent-8p',
  pendingValidation:
    'border-warning-700 text-warning-800 bg-warning-transparent-8p',
  published: 'border-success-500 text-success-500 bg-success-transparent-8p',
  validated: 'border-primary-500 text-primary-500 bg-primary-transparent-8p',
};

interface ReferralAnswerStatusBadgeProps {
  answer: ReferralAnswer;
}

export const ReferralAnswerStatusBadge: React.FC<
  ReferralAnswerStatusBadgeProps
> = ({ answer }) => {
  const { data, status } = useReferralAnswerValidationRequests(answer.id);

  switch (status) {
    case 'error':
      return <GenericErrorMessage />;

    case 'idle':
    case 'loading':
      return (
        <Spinner>
          <FormattedMessage {...messages.loadingAnswerStatus} />
        </Spinner>
      );

    case 'success':
      let addClasses = '';
      let message: MessageDescriptor;

      if (
        answer.state === ReferralAnswerState.PUBLISHED ||
        !!answer.published_answer
      ) {
        addClasses = classes.published;
        message = messages.published;
      } else if (
        data!.results.some(
          (validationRequest) =>
            !!validationRequest.response &&
            validationRequest.response.state ===
              ReferralAnswerValidationResponseState.VALIDATED,
        )
      ) {
        addClasses = classes.validated;
        message = messages.validated;
      } else if (
        data!.results.some(
          (validationRequest) =>
            !!validationRequest.response &&
            validationRequest.response.state ===
              ReferralAnswerValidationResponseState.NOT_VALIDATED,
        )
      ) {
        addClasses = classes.needsRevision;
        message = messages.needsRevision;
      } else if (data!.count > 0) {
        addClasses = classes.pendingValidation;
        message = messages.pendingValidation;
      } else {
        addClasses = classes.draft;
        message = messages.draft;
      }

      return (
        <div
          className={`inline-block px-3 py-1 capitalize rounded-sm border-2 ${addClasses}`}
        >
          <FormattedMessage {...message} />
        </div>
      );
  }
};
