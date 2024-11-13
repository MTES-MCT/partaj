import React, { useContext } from 'react';
import { AddAttachmentButton } from '../AddAttachmentButton';
import { Referral, ReferralAttachment } from '../../../../types';
import { defineMessages, FormattedMessage } from 'react-intl';
import { FileIcon } from '../../../Icons';
import { ReferralContext } from '../../../../data/providers/ReferralProvider';
import { DeleteReferralAttachmentButton } from '../DeleteAttachmentButton';
import * as Sentry from '@sentry/react';
const messages = defineMessages({
  delete: {
    defaultMessage: 'Delete',
    description: 'Text for delete button',
    id: 'components.ReferralAttachmentsBlock.delete',
  },
  addFile: {
    defaultMessage: 'Add file',
    description: 'Text for add file button',
    id: 'components.ReferralAttachmentsBlock.addFile',
  },
});

export const ReferralAttachmentsBlock: React.FC<React.PropsWithChildren<{
  hasError: boolean;
}>> = ({ hasError }) => {
  const { referral, setReferral } = useContext(ReferralContext);

  return (
    <>
      {referral && (
        <div className="space-y-2">
          {referral.attachments.map((attachment: ReferralAttachment) => (
            <div
              key={`form-attachment-${attachment.id}`}
              className="flex space-x-2 items-center"
            >
              <div className="flex w-fit space-x-1 items-center">
                <FileIcon />
                <span className="font-light text-sm pb-0.5">
                  {attachment.name_with_extension}
                </span>
              </div>
              <DeleteReferralAttachmentButton attachment={attachment}>
                <span className="font-light text-xs">
                  <FormattedMessage {...messages.delete} />
                </span>
              </DeleteReferralAttachmentButton>
            </div>
          ))}
          <AddAttachmentButton
            className={hasError ? 'border-red' : ''}
            referralId={referral.id}
            onSuccess={(data) => {
              setReferral((prevState: Referral) => {
                prevState.attachments = [...prevState.attachments, data];

                return { ...prevState };
              });
            }}
            onError={(e) => Sentry.captureException(e)}
          >
            <span>
              <FormattedMessage {...messages.addFile} />
            </span>
          </AddAttachmentButton>
        </div>
      )}
    </>
  );
};
