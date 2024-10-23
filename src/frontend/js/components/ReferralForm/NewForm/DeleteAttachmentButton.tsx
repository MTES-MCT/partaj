import React, { ReactNode, useContext, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { defineMessages, FormattedMessage } from 'react-intl';
import { useUIDSeed } from 'react-uid';
import { useAddReferralAttachment } from '../../../data/referralattachment';
import { ErrorResponse, Referral, ReferralAttachment } from '../../../types';
import { useDeleteAction } from '../../../data';
import { ReferralContext } from '../../../data/providers/ReferralProvider';

const messages = defineMessages({
  messageAttachmentButton: {
    defaultMessage: 'Choose attachments',
    description: 'Accessible label for the attachments button.',
    id: 'components.AddAttachmentButton.messageAttachmentButton',
  },
});

export const DeleteReferralAttachmentButton: React.FC<React.PropsWithChildren<{
  attachment: ReferralAttachment;
}>> = ({ attachment, children }) => {
  const deleteMutation = useDeleteAction();
  const { referral, setReferral } = useContext(ReferralContext);

  return (
    <>
      {referral && (
        <button
          type="button"
          className={`btn bg-grey-100 text-sm font-light relative border border-black py-1 px-2 flex items-center`}
          onClick={(e) => {
            e.stopPropagation();
            deleteMutation.mutate(
              {
                name: 'referralattachments',
                id: attachment.id,
              },
              {
                onSuccess: (data: ReferralAttachment) => {
                  setReferral((prevState: Referral) => {
                    prevState.attachments = prevState.attachments.filter(
                      (prevAttachment: ReferralAttachment) =>
                        attachment.id != prevAttachment.id,
                    );

                    return { ...prevState };
                  });
                },
              },
            );
          }}
        >
          {children}
        </button>
      )}
    </>
  );
};
