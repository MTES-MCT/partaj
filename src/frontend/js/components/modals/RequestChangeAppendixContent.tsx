import React, { useContext, useState } from 'react';
import * as Sentry from '@sentry/react';
import { useRequestChangeAppendixAction } from '../../data/reports';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { ReferralContext } from '../../data/providers/ReferralProvider';

import { useCurrentUser } from '../../data/useCurrentUser';
import { ChangeIcon } from '../Icons';
import { AppendixSummary } from '../ReferralAppendices/AppendixSummary';
import { IconTextButton } from '../buttons/IconTextButton';
import { ReferralReportAppendix } from '../../types';
import { TextArea, TextAreaSize } from '../text/TextArea';
import { Nullable } from '../../types/utils';

const messages = defineMessages({
  mainTitle: {
    defaultMessage: 'Version request change',
    description: 'Modal main title',
    id: 'components.RequestChangeAppendixModal.mainTitle',
  },
  requestChange: {
    defaultMessage: 'Request change',
    description: 'CTA button text',
    id: 'components.RequestChangeAppendixModal.buttonText',
  },
  addComment: {
    defaultMessage: 'Add comment to your request (optional)',
    description: 'Add comment text',
    id: 'components.RequestChangeAppendixModal.addComment',
  },
  addCommentDescription: {
    defaultMessage: 'It will be displayed in the private unit conversation',
    description: 'Add comment description',
    id: 'components.RequestChangeAppendixModal.addCommentDescription',
  },
  requestChangeModalDescription: {
    defaultMessage:
      'Lawyers assigned to the referral will be notified by e-mail',
    description: 'Request change modal description',
    id: 'components.RequestChangeAppendixModal.requestChangeModalDescription',
  },
});

export const RequestChangeAppendixContent = ({
  appendix,
  setAppendix,
}: {
  appendixNumber: number;
  appendix: Nullable<ReferralReportAppendix>;
  setAppendix: Function;
}) => {
  const requestChangeMutation = useRequestChangeAppendixAction();
  const [messageContent, setMessageContent] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const { referral } = useContext(ReferralContext);
  const { currentUser } = useCurrentUser();
  const intl = useIntl();

  const closeModal = () => {
    setMessageContent('');
    setErrorMessage('');
  };

  const submitForm = () => {
    appendix &&
      requestChangeMutation.mutate(
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
            setErrorMessage(
              'Une erreur est survenue, veuillez réessayer plus tard',
            );
          },
        },
      );
  };

  return (
    <>
      {referral && appendix && currentUser && (
        <div className="flex flex-col flex-grow overflow-y-auto  space-y-6">
          <p className="text-gray-500">
            <FormattedMessage {...messages.requestChangeModalDescription} />
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
              id="request-change-appendix-content-textarea"
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
