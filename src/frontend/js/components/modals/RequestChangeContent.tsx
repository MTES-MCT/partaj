import React, { useContext, useState } from 'react';
import * as Sentry from '@sentry/react';
import { useRequestChangeAction } from '../../data/reports';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { ReferralContext } from '../../data/providers/ReferralProvider';
import { useCurrentUser } from '../../data/useCurrentUser';
import { ChangeIcon } from '../Icons';
import { Nullable } from '../../types/utils';
import { ReferralReportVersion } from '../../types';
import { BaseSideModalContext } from '../../data/providers/BaseSideModalProvider';
import { TextArea, TextAreaSize } from '../text/TextArea';
import { IconTextButton } from '../buttons/IconTextButton';
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

export const RequestChangeContent = ({
  version,
  setVersion,
}: {
  versionNumber: number;
  version: Nullable<ReferralReportVersion>;
  setVersion: Function;
}) => {
  const requestChangeMutation = useRequestChangeAction();
  const [messageContent, setMessageContent] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const { referral } = useContext(ReferralContext);
  const { currentUser } = useCurrentUser();
  const intl = useIntl();
  const { closeBaseSideModal } = useContext(BaseSideModalContext);

  const closeModal = () => {
    setMessageContent('');
    setErrorMessage('');
    closeBaseSideModal();
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
        <div className="flex flex-col flex-grow overflow-y-auto  space-y-6">
          <p className="text-gray-500">
            <FormattedMessage {...messages.requestChangeModalDescription} />
          </p>
          <VersionSummary version={version} />
          <div className="flex flex-col">
            <h3 className="font-normal">
              <FormattedMessage {...messages.addComment} />
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              <FormattedMessage {...messages.addCommentDescription} />
            </p>
            <TextArea
              id="request-change-version-content-textarea"
              size={TextAreaSize.L}
              value={messageContent}
              onChange={(value: string) => setMessageContent(value)}
            />
          </div>

          <div className="flex w-full justify-between z-20 bg-white">
            <button className="hover:underline" onClick={() => closeModal()}>
              Annuler
            </button>
            <IconTextButton
              otherClasses={'btn-danger px-4 py-3'}
              type={'submit'}
              icon={<ChangeIcon className="fill-black" />}
              onClick={() => submitForm()}
              text={intl.formatMessage(messages.requestChange)}
            />
          </div>
        </div>
      )}
    </>
  );
};
