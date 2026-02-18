import React, { useContext, useState } from 'react';
import * as Sentry from '@sentry/react';
import { useValidateAction } from '../../data/reports';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { ReferralReportVersion } from '../../types';
import { ReferralContext } from '../../data/providers/ReferralProvider';
import { useCurrentUser } from '../../data/useCurrentUser';
import { CheckIcon } from '../Icons';
import { BaseSideModalContext } from '../../data/providers/BaseSideModalProvider';
import { IconTextButton } from '../buttons/IconTextButton';
import { TextArea, TextAreaSize } from '../text/TextArea';
import { Nullable } from '../../types/utils';
import { VersionSummary } from '../ReferralReport/VersionSummary';

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

export const ValidateContent = ({
  version,
  setVersion,
}: {
  versionNumber: number;
  version: Nullable<ReferralReportVersion>;
  setVersion: Function;
}) => {
  const { closeBaseSideModal } = useContext(BaseSideModalContext);
  const validateMutation = useValidateAction();
  const [messageContent, setMessageContent] = useState('');
  const { referral } = useContext(ReferralContext);
  const { currentUser } = useCurrentUser();
  const intl = useIntl();

  const closeModal = () => {
    setMessageContent('');
    closeBaseSideModal();
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
          },
        },
      );
  };

  return (
    <>
      {referral && currentUser && version && (
        <div className={'flex flex-col space-y-8'}>
          <div className="flex flex-col flex-grow space-y-8">
            <p className="text-gray-500">
              <FormattedMessage {...messages.validateModalDescription} />
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
                size={TextAreaSize.L}
                id="validate-appendix-content-textarea"
                value={messageContent}
                onChange={(value: string) => setMessageContent(value)}
              />
            </div>
          </div>
          <div className="flex w-full justify-between z-20 p-2">
            <button className="hover:underline" onClick={() => closeModal()}>
              Annuler
            </button>
            <IconTextButton
              otherClasses={'btn-success-light px-4 py-3'}
              type={'submit'}
              icon={<CheckIcon className="fill-black" />}
              onClick={() => submitForm()}
              text={intl.formatMessage(messages.validate)}
            />
          </div>
        </div>
      )}
    </>
  );
};
