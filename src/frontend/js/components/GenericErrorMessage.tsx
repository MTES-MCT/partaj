import React from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';

const messages = defineMessages({
  error: {
    defaultMessage:
      'There was an error. Please try reloading the page or contact us at partaj@beta.gouv.fr.',
    description:
      'Generic error message to display when unexpected and unexplained errors happen.',
    id: 'components.GenericErrorMessage.error',
  },
});

export const GenericErrorMessage = () => (
  <div>
    <FormattedMessage {...messages.error} />
  </div>
);
