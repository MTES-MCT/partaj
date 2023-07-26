import React, { useContext, useState } from 'react';
import * as Sentry from '@sentry/react';
import { useValidateAction } from '../../data/reports';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { VersionContext } from '../../data/providers/VersionProvider';
import { ReferralContext } from '../../data/providers/ReferralProvider';
import { TextArea } from '../inputs/TextArea';
import { useCurrentUser } from '../../data/useCurrentUser';
import { BaseModal } from './BaseModal';
import { CheckIcon, IconColor } from "../Icons";

const messages = defineMessages({
  mainTitle: {
    defaultMessage: 'Validate version',
    description: 'Modal main title',
    id: 'components.ValidateModal.mainTitle',
  },
  validate: {
    defaultMessage: 'Validate',
    description: 'CTA button text',
    id: 'components.ValidateModal.buttonText',
  },
  addComment: {
    defaultMessage: 'Add comment to your request (optional)',
    description: 'Add comment text',
    id: 'components.ValidateModal.addComment',
  },
});

export const ValidateModal = ({
  setModalOpen,
  isModalOpen,
}: {
  setModalOpen: Function;
  isModalOpen: boolean;
}) => {
  const validateMutation = useValidateAction();
  const [messageContent, setMessageContent] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const { referral } = useContext(ReferralContext);
  const { currentUser } = useCurrentUser();
  const { version, setVersion } = useContext(VersionContext);
  const intl = useIntl();

  const closeModal = () => {
    setModalOpen(false);
    setMessageContent('');
    setErrorMessage('');
  };

  const submitForm = () => {
    version &&
      validateMutation.mutate(
        {
          version: version.id,
          comment: messageContent,
        },
        {
          onSuccess: (data) => {
            setVersion(data);
            closeModal();
          },
          onError: (error) => {
            Sentry.captureException(error);
            setErrorMessage(
              'Une erreur est survenue, veuillez réessayer plus tard',
            );
          },
        },
      );
  };

  return (
    <>
      {referral && version && currentUser && (
        <BaseModal
          isModalOpen={isModalOpen}
          onCloseModal={closeModal}
          onSubmit={submitForm}
          title={{
            text: intl.formatMessage(messages.mainTitle),
            css: 'bg-success-200',
          }}
          button={{
            text: intl.formatMessage(messages.validate),
            css: 'btn-success-light',
            icon: <CheckIcon color={IconColor.BLACK} />
          }}
        >
          <>
            <div className="flex flex-col flex-grow">
              <h3>
                <FormattedMessage {...messages.addComment} />
              </h3>
              <div className="border border-gray-300 p-2">
                <TextArea
                  focus={false}
                  messageContent={messageContent}
                  onChange={(value: string) => setMessageContent(value)}
                  customCss={{
                    container: '',
                    carbonCopy: {
                      height: '10rem',
                    },
                  }}
                />
              </div>
            </div>
            <span
              className="absolute text-danger-500 text-sm"
              style={{ bottom: '50px' }}
            >
              {errorMessage}
            </span>
          </>
        </BaseModal>
      )}
    </>
  );
};
