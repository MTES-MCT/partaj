import React, { useContext, useState } from 'react';
import * as Sentry from '@sentry/react';
import { useValidateAppendixAction } from '../../data/reports';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { AppendixContext } from '../../data/providers/AppendixProvider';
import { ReferralContext } from '../../data/providers/ReferralProvider';
import { TextArea } from '../inputs/TextArea';
import { useCurrentUser } from '../../data/useCurrentUser';
import { BaseModal } from './BaseModal';
import { CheckIcon } from '../Icons';
import { AppendixSummary } from '../ReferralAppendices/AppendixSummary';

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
    defaultMessage: 'Add comment to your validation (optional)',
    description: 'Add comment text',
    id: 'components.ValidateModal.addComment',
  },
  addCommentDescription: {
    defaultMessage: 'It will be displayed in the private unit conversation',
    description: 'Add comment description',
    id: 'components.ValidateModal.addCommentDescription',
  },
  validateModalDescription: {
    defaultMessage:
      'Lawyers assigned to the referral will be notified by e-mail',
    description: 'Validate modal description',
    id: 'components.ValidateModal.validateModalDescription',
  },
});

export const ValidateAppendixModal = ({
  setModalOpen,
  isModalOpen,
  appendixNumber,
}: {
  setModalOpen: Function;
  isModalOpen: boolean;
  appendixNumber: number;
}) => {
  const validateMutation = useValidateAppendixAction();
  const [messageContent, setMessageContent] = useState('');
  const { referral } = useContext(ReferralContext);
  const { currentUser } = useCurrentUser();
  const { appendix, setAppendix } = useContext(AppendixContext);
  const intl = useIntl();

  const closeModal = () => {
    setModalOpen(false);
    setMessageContent('');
  };

  const submitForm = () => {
    appendix &&
      validateMutation.mutate(
        {
          appendix: appendix.id,
          comment: messageContent,
        },
        {
          onSuccess: (data) => {
            setAppendix(data);
            closeModal();
          },
          onError: (error) => {
            Sentry.captureException(error);
          },
        },
      );
  };

  return (
    <>
      {referral && appendix && currentUser && (
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
            icon: <CheckIcon className="fill-black" />,
          }}
        >
          <div className="flex flex-col flex-grow space-y-4">
            <p className="text-gray-500">
              <FormattedMessage {...messages.validateModalDescription} />
            </p>
            <div className="flex flex-col flex-grow space-y-4">
              <AppendixSummary appendixNumber={appendixNumber} />
              <div className="flex flex-col">
                <h3 className="font-normal">
                  <FormattedMessage {...messages.addComment} />
                </h3>
                <p className="text-sm text-gray-500">
                  <FormattedMessage {...messages.addCommentDescription} />
                </p>
                <div className="border border-gray-300 p-2">
                  <TextArea
                    focus={false}
                    messageContent={messageContent}
                    onChange={(value: string) => setMessageContent(value)}
                    customCss={{
                      container: '',
                      carbonCopy: {
                        height: '12rem',
                      },
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </BaseModal>
      )}
    </>
  );
};
