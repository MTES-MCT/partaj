import React from 'react';
import { appData } from 'appData';
import { defineMessages, FormattedMessage } from 'react-intl';

const messages = defineMessages({
  error: {
    defaultMessage:
      'There was an error. Please try reloading the page or contact us at {mail}.',
    description:
      'Generic error message to display when unexpected and unexplained errors happen.',
    id: 'components.GenericErrorMessage.error',
  },
});

export const GenericErrorMessage = () => (
  <div>
    <FormattedMessage
      {...messages.error}
      values={{
        mail: appData.contact_email,
      }}
    />
  </div>
);
