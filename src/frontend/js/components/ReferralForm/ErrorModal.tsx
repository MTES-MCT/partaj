import React, { useEffect, useState } from 'react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { useUIDSeed } from 'react-uid';
import { useReferralAction } from 'data';
import { Referral } from 'types';
import { ModalContainer, ModalSize } from '../modals/ModalContainer';
import { AlertIcon } from '../Icons';
import { appData } from 'appData';
import { ErrorMessage } from './ErrorMessage';

const messages = defineMessages({
  close: {
    defaultMessage: 'Close',
    description: 'Ok button to  the modal.',
    id: 'components.ReferralDetail.ErrorModal.Close',
  },
  modalTitle: {
    defaultMessage: 'Error',
    description: 'Title for the modal.',
    id: 'components.ReferralDetail.ErrorModal.Error',
  },
  modalExplanation: {
    defaultMessage: 'The form is incomplete and can not be submited.',
    description: 'Modal explanation',
    id: 'components.ReferralDetail.ErrorModal.modalExplanation',
  },
  topicError: {
    defaultMessage:
      'The information about the topic is mandatory. Please fill in the "Topic of the request field".',
    description: 'Topic error',
    id: 'components.ReferralDetail.ErrorModal.topicError',
  },
  contextError: {
    defaultMessage:
      'The information about the context is mandatory. Please fill in the "Context of the request field" ',
    description: 'Context error.',
    id: 'components.ReferralDetail.ErrorModal.contextError',
  },
  objectError: {
    defaultMessage:
      'The  information about the title is mandatory. Please fill in the "title of the request field" ',
    description: 'object error.',
    id: 'components.ReferralDetail.ErrorModal.objectError',
  },
  questionError: {
    defaultMessage:
      'The information about the object is mandatory. Please fill in the "Object of the request field" ',
    description: 'object error.',
    id: 'components.ReferralDetail.ErrorModal.questionError',
  },
  priorWorkError: {
    defaultMessage:
      'The information about the prior work is mandatory. Please fill in the "prior work of the request field"  ',
    description: 'question error.',
    id: 'components.ReferralDetail.ErrorModal.priorWorkError',
  },
  urgencyExplanationError: {
    defaultMessage: 'The selected level of urgency requires a justification',
    description: 'urgency level justification error.',
    id: 'components.ReferralDetail.ErrorModal.urgencyExplanationError',
  },
});

interface ErrorModalProps {
  isErrorModalOpen: boolean;
  setIsErrorModalOpen: (isOpen: boolean) => void;
  errorField: string[];
}

export const ErrorModal: React.FC<ErrorModalProps> = ({
  isErrorModalOpen,
  setIsErrorModalOpen,
  errorField,
}) => {
  const seed = useUIDSeed();
  const intl = useIntl();

  const errorMessages = Object.keys(messages);
  return (
    <ModalContainer
      isModalOpen={isErrorModalOpen}
      setModalOpen={setIsErrorModalOpen}
      size={ModalSize.L}
    >
      <div className="p-8 space-y-5">
        <div className="border-b border-black">
          <h2 className="text-xl items-center" id={seed('close-referral-form')}>
            <FormattedMessage {...messages.modalTitle} />
          </h2>
          <p className="text-x2" id={seed('close-referral-message')}>
            <FormattedMessage {...messages.modalExplanation} />
          </p>
        </div>

        {errorField.includes('topicError') ? (
          <ErrorMessage
            message={intl.formatMessage(messages.topicError)}
            icon={<AlertIcon />}
          />
        ) : null}

        {errorField.includes('objectError') ? (
          <ErrorMessage
            message={intl.formatMessage(messages.objectError)}
            icon={<AlertIcon />}
          />
        ) : null}

        {errorField.includes('questionError') ? (
          <ErrorMessage
            message={intl.formatMessage(messages.questionError)}
            icon={<AlertIcon />}
          />
        ) : null}

        {errorField.includes('contextError') ? (
          <ErrorMessage
            message={intl.formatMessage(messages.contextError)}
            icon={<AlertIcon />}
          />
        ) : null}

        {errorField.includes('prior_workError') ? (
          <ErrorMessage
            message={intl.formatMessage(messages.priorWorkError)}
            icon={<AlertIcon />}
          />
        ) : null}

        {errorField.includes('urgency_explanationError') ? (
          <ErrorMessage
            message={intl.formatMessage(messages.urgencyExplanationError)}
            icon={<AlertIcon />}
          />
        ) : null}
        <div className="flex justify-center p-8 space-x-4">
          <button
            className="btn btn-outline"
            onClick={() => {
              setIsErrorModalOpen(false);
            }}
          >
            <FormattedMessage {...messages.close} />
          </button>
        </div>
      </div>
    </ModalContainer>
  );
};
