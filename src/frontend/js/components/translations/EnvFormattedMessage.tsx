import React from 'react';
import { FormattedMessage } from 'react-intl';
import { appData } from 'appData';

interface EnvFormattedMessageProps {
  [key: string]: {
    defaultMessage: string;
    description: string;
    id: string;
  };
}

export const EnvFormattedMessage: React.FC<{
  messages: EnvFormattedMessageProps;
}> = ({ messages }) => {
  const currentMessage = Object.values(messages).find((value) => {
    return value?.id.split('.').at(-1) === appData.env_version;
  });

  return currentMessage ? <FormattedMessage {...currentMessage} /> : null;
};
