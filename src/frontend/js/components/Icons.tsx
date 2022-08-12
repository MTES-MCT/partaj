import { appData } from '../appData';
import React from 'react';
import { defineMessages, useIntl } from 'react-intl';
import { useUIDSeed } from 'react-uid';

const messages = defineMessages({
  notify: {
    defaultMessage: 'Notify',
    description: 'Accessible text for at icon',
    id: 'components.Icons.AtIcon.notify',
  },
  send: {
    defaultMessage: 'Send',
    description: 'Accessible text for send icon',
    id: 'components.Icons.ArrowUp.send',
  },
});

interface IconProps {
  active: boolean;
}

export const AtIcon = ({ active = false }: IconProps) => {
  const intl = useIntl();
  const seed = useUIDSeed();

  return (
    <svg
      role="img"
      className={`w-8 h-8 ${active ? 'icon-state-open' : 'icon-state-closed'}`}
    >
      <use xlinkHref={`${appData.assets.icons}#icon-at-line`} />
      <title id={seed('icon-at-line')}>
        {intl.formatMessage(messages.notify)}
      </title>
    </svg>
  );
};

export const ArrowUpIcon = () => {
  const intl = useIntl();
  const seed = useUIDSeed();

  return (
    <svg role="img" className={`w-6 h-6`}>
      <use xlinkHref={`${appData.assets.icons}#icon-arrow-up`} />
      <title id={seed('icon-arrow-up')}>
        {intl.formatMessage(messages.send)}
      </title>
    </svg>
  );
};

export const SearchIcon = () => {
  const intl = useIntl();
  const seed = useUIDSeed();

  return (
    <svg role="img" className={`w-4 h-4 icon-search`}>
      <use xlinkHref={`${appData.assets.icons}#icon-search`} />
      <title id={seed('icon-search')}>
        {intl.formatMessage(messages.send)}
      </title>
    </svg>
  );
};

export const MailSentIcon = () => {
  return (
    <svg role="img" className={`w-4 h-4`}>
      <use xlinkHref={`${appData.assets.icons}#icon-mail-sent`} />
    </svg>
  );
};

export const CloseIcon = () => {
  const intl = useIntl();
  const seed = useUIDSeed();

  return (
    <svg role="img" className={`w-4 h-4 icon-close`}>
      <use xlinkHref={`${appData.assets.icons}#icon-cross`} />
      <title id={seed('icon-close')}>{intl.formatMessage(messages.send)}</title>
    </svg>
  );
};
