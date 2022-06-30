import React, { useContext, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { defineMessages, FormattedMessage } from 'react-intl';
import { useUIDSeed } from 'react-uid';

import { appData } from 'appData';
import { Spinner } from 'components/Spinner';
import { Attachment } from 'types';
import { ReferralContext } from '../../data/providers/ReferralProvider';
import { sendForm } from '../../utils/sendForm';

const messages = defineMessages({
  dropzone: {
    defaultMessage: 'Drag and drop some files here, or click to select files',
    description:
      'Helper text in the file dropzone input in the attachments form field.',
    id: 'components.DropzoneFileUploader.dropzone',
  },
  loadingReport: {
    defaultMessage: 'Loading report...',
    description:
      'Accessibility message for the spinner while loading the referral report',
    id: 'components.DropzoneFileUploader.loadingAnswer',
  },
  uploadingFile: {
    defaultMessage: 'Uploading file...',
    description:
      'Accessible alternative for the spinner for an answer attachment file upload in process.',
    id: 'components.DropzoneFileUploader.uploadingFile',
  },
});

export const DropzoneFileUploader = ({
  onSuccess,
  onError,
}: {
  onSuccess: (result: any) => void;
  onError: (error: any) => void;
}) => {
  const seed = useUIDSeed();
  const { referral } = useContext(ReferralContext);
  const [progression, setProgression] = useState<number>(0);
  const onDrop = (acceptedFiles: File[]) => {
    sendAttachment({
      file: acceptedFiles[0],
      onError,
      onSuccess,
    });
  };

  const { getRootProps, getInputProps } = useDropzone({ onDrop });

  const sendAttachment = async ({
    file,
    onSuccess,
    onError,
  }: {
    file: File;
    onSuccess: (attachment: Attachment) => void;
    onError: (error: any) => void;
  }) => {
    try {
      const attachment = await sendForm<any>({
        headers: { Authorization: `Token ${appData.token}` },
        keyValuePairs: [
          ['report', referral!.report!.id],
          ['files', file],
        ],
        url: `/api/referralreportversions/`,
        setProgress: (prevProgress) => setProgression(prevProgress),
      });
      setProgression(0);
      onSuccess(attachment);
    } catch (error) {
      onError(error);
    }
  };

  return (
    <>
      <div
        role="button"
        className="bg-gray-200 mt-2 py-3 px-5 border rounded text-center flex justify-center"
        {...getRootProps()}
      >
        <input
          {...getInputProps()}
          aria-labelledby={seed('attachments-list')}
        />
        {progression < 100 && progression > 0 ? (
          <Spinner>
            <span className="offscreen">
              <FormattedMessage {...messages.uploadingFile} />
            </span>
          </Spinner>
        ) : (
          <p>
            <FormattedMessage {...messages.dropzone} />
          </p>
        )}
      </div>
    </>
  );
};
