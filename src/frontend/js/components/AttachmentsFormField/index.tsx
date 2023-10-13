import filesize from 'filesize';
import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { useUIDSeed } from 'react-uid';

import { appData } from 'appData';

const messages = defineMessages({
  delete: {
    defaultMessage: 'Delete',
    description:
      'Accessible text for delete icons in the list of selected files in attachments form field.',
    id: 'components.AttachmentsFormField.delete',
  },
  dropzone: {
    defaultMessage: 'Drag and drop some files here, or click to select files',
    description:
      'Helper text in the file dropzone input in the attachments form field.',
    id: 'components.AttachmentsFormField.dropzone',
  },
  filesList: {
    defaultMessage: 'Selected files',
    description:
      'Accessible text for the list of already selected files in attachments form field',
    id: 'components.AttachmentsFormField.filesList',
  },
});

const size = filesize.partial({
  locale: document.querySelector('html')?.getAttribute('lang') || 'en-US',
});

interface AttachmentsFormFieldProps {
  files: File[];
  'aria-describedby'?: string;
  'aria-labelledby': string;
  setFiles: (files: File[]) => void;
}

export const AttachmentsFormField: React.FC<AttachmentsFormFieldProps> = (
  props,
) => {
  const { files, setFiles } = props;
  const ariaDescribedby = props['aria-describedby'];
  const ariaLabelledby = props['aria-labelledby'];

  const intl = useIntl();
  const uidSeed = useUIDSeed();

  const onDrop = useCallback(
    (acceptedFiles: File[]): void => {
      setFiles([...files, ...acceptedFiles]);
    },
    [files],
  );
  const { getRootProps, getInputProps } = useDropzone({ onDrop });

  return (
    <>
      {files.length ? (
        <ul
          className="list-group mt-2"
          aria-label={intl.formatMessage(messages.filesList)}
        >
          {files.map((file, index) => (
            <li className="list-group-item justify-between" key={uidSeed(file)}>
              <span>
                {file.name} — {size(file.size)}
              </span>
              <button
                aria-labelledby={uidSeed(file)}
                className="relative text-gray-700 hover:text-danger-700"
                onClick={() =>
                  setFiles([
                    ...files.slice(0, index),
                    ...files.slice(index + 1),
                  ])
                }
              >
                <svg role="img" className="w-5 h-5 fill-current">
                  <use xlinkHref={`${appData.assets.icons}#icon-trash`} />
                  <title id={uidSeed(file)}>
                    {intl.formatMessage(messages.delete)}
                  </title>
                </svg>
                <div
                  className="absolute"
                  style={{
                    top: '-10px',
                    right: '-10px',
                    bottom: '-10px',
                    left: '-10px',
                  }}
                ></div>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <button
        type="button"
        aria-labelledby={ariaLabelledby}
        aria-describedby={ariaDescribedby}
        {...getRootProps()}
        className={`bg-gray-200 mt-2 py-3 px-5 border rounded text-center ${
          files.length ? '' : 'py-8'
        }`}
      >
        <input {...getInputProps()} />
        <p>
          <FormattedMessage {...messages.dropzone} />
        </p>
      </button>
    </>
  );
};
