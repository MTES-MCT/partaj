import React, { useContext, useState } from 'react';
import * as Sentry from '@sentry/react';
import { useValidateAppendixAction } from '../../data/reports';
import { ReferralReportAppendix } from '../../types';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { ReferralContext } from '../../data/providers/ReferralProvider';
import { useCurrentUser } from '../../data/useCurrentUser';
import { CheckIcon } from '../Icons';
import { AppendixSummary } from '../ReferralAppendices/AppendixSummary';
import { BaseSideModalContext } from '../../data/providers/BaseSideModalProvider';
import { IconTextButton } from '../buttons/IconTextButton';
import { TextArea, TextAreaSize } from '../text/TextArea';
import { Nullable } from '../../types/utils';

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

export const ValidateAppendixContent = ({
  appendix,
  setAppendix,
}: {
  appendixNumber: number;
  appendix: Nullable<ReferralReportAppendix>;
  setAppendix: Function;
}) => {
  const { closeBaseSideModal } = useContext(BaseSideModalContext);
  const validateMutation = useValidateAppendixAction();
  const [messageContent, setMessageContent] = useState('');
  const { referral } = useContext(ReferralContext);
  const { currentUser } = useCurrentUser();
  const intl = useIntl();

  const closeModal = () => {
    setMessageContent('');
    closeBaseSideModal();
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
      {referral && currentUser && appendix && (
        <div className={'flex flex-col space-y-8'}>
          <div className="flex flex-col flex-grow space-y-8">
            <p className="text-gray-500">
              <FormattedMessage {...messages.validateModalDescription} />
            </p>
            <AppendixSummary appendix={appendix} />
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
