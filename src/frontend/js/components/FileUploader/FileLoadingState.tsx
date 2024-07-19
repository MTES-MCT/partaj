import React from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { Spinner } from 'components/Spinner';

const messages = defineMessages({
  uploadingFile: {
    defaultMessage: 'File loading and analysis in progress . \n Please wait.',
    description: 'Uploading file text',
    id: 'components.FileLoadingState.uploadingFile',
  },
});

export const FileLoadingState = () => {
  return (
    <div className="flex flex-col z-20 items-center justify-center bg-white-transparent-90p absolute inset-0">
      <span>
        <FormattedMessage {...messages.uploadingFile} />
        <Spinner />
      </span>
    </div>
  );
};
