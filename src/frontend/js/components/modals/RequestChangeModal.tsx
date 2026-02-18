import React, { useContext, useState } from 'react';
import * as Sentry from '@sentry/react';
import { useRequestChangeAction } from '../../data/reports';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { VersionContext } from '../../data/providers/VersionProvider';
import { ReferralContext } from '../../data/providers/ReferralProvider';
import { TextArea } from '../inputs/TextArea';
import { useCurrentUser } from '../../data/useCurrentUser';
import { BaseModal } from './BaseModal';
import { ChangeIcon } from '../Icons';
import { VersionSummary } from '../ReferralReport/VersionSummary';

const messages = defineMessages({
  mainTitle: {
    defaultMessage: 'Version request change',
    description: 'Modal main title',
    id: 'components.RequestChangeModal.mainTitle',
  },
  requestChange: {
    defaultMessage: 'Request change',
    description: 'CTA button text',
    id: 'components.RequestChangeModal.buttonText',
  },
  addComment: {
    defaultMessage: 'Add comment to your request (optional)',
    description: 'Add comment text',
    id: 'components.RequestChangeModal.addComment',
  },
  addCommentDescription: {
    defaultMessage: 'It will be displayed in the private unit conversation',
    description: 'Add comment description',
    id: 'components.RequestChangeModal.addCommentDescription',
  },
  requestChangeModalDescription: {
    defaultMessage:
      'Lawyers assigned to the referral will be notified by e-mail',
    description: 'Request change modal description',
    id: 'components.RequestChangeModal.requestChangeModalDescription',
  },
});

export const RequestChangeModal = ({
  setModalOpen,
  isModalOpen,
  versionNumber,
}: {
  setModalOpen: Function;
  isModalOpen: boolean;
  versionNumber: number;
}) => {
  const requestChangeMutation = useRequestChangeAction();
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
      requestChangeMutation.mutate(
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
            css: 'bg-danger-200',
          }}
          button={{
            text: intl.formatMessage(messages.requestChange),
            css: 'btn-danger',
            icon: <ChangeIcon className="fill-black" />,
          }}
        >
          <div className="flex flex-col flex-grow space-y-4">
            <p className="text-gray-500">
              <FormattedMessage {...messages.requestChangeModalDescription} />
            </p>
            <VersionSummary version={version} />
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
        </BaseModal>
      )}
    </>
  );
};
