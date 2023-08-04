import React, { useContext, useState } from 'react';
import * as Sentry from '@sentry/react';
import { useRequestChangeAction } from '../../data/reports';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { VersionContext } from '../../data/providers/VersionProvider';
import { ReferralContext } from '../../data/providers/ReferralProvider';
import { TextArea } from '../inputs/TextArea';
import { useCurrentUser } from '../../data/useCurrentUser';
import { BaseModal } from './BaseModal';
import { ChangeIcon, IconColor } from '../Icons';
import { VersionSummary } from '../ReferralReport/VersionSummary';

const messages = defineMessages({
  mainTitle: {
    defaultMessage: 'Version request change',
    description: 'Modal main title',
    id: 'components.RequestChangeModal.mainTitle',
  },
  validate: {
    defaultMessage: 'Request change',
    description: 'CTA button text',
    id: 'components.RequestChangeModal.buttonText',
  },
  addComment: {
    defaultMessage: 'Add comment to your request (optional)',
    description: 'Add comment text',
    id: 'components.RequestChangeModal.addComment',
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
            text: intl.formatMessage(messages.validate),
            css: 'btn-danger',
            icon: <ChangeIcon color={IconColor.BLACK} />,
          }}
        >
          <>
            <div className="flex flex-col flex-grow space-y-4">
              <VersionSummary versionNumber={versionNumber} />
              <div className="flex flex-col">
                <h3 className="font-medium">
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
                        height: '12rem',
                      },
                    }}
                  />
                </div>
              </div>
            </div>
          </>
        </BaseModal>
      )}
    </>
  );
};
