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
  close: {
    defaultMessage: 'Close',
    description: 'Accessible text for close icon',
    id: 'components.Icons.Close.default',
  },
  search: {
    defaultMessage: 'Search',
    description: 'Accessible text for search icon',
    id: 'components.Icons.Search.default',
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
        {intl.formatMessage(messages.search)}
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

export const DownloadIcon = () => {
  return (
    <svg role="img" className={`w-4 h-4`}>
      <use xlinkHref={`${appData.assets.icons}#icon-download`} />
    </svg>
  );
};

export const DraftIcon = ({size= 4} : {size?: number }) => {
  return (
    <svg role="img" className={`w-${size} h-${size}`}>
      <use xlinkHref={`${appData.assets.icons}#icon-draft`} />
    </svg>
  );
};

export const EditIcon = ({size= 4} : {size?: number }) => {
  return (
    <svg role="img" className={`w-${size} h-${size}`}>
      <use xlinkHref={`${appData.assets.icons}#icon-edit`} />
    </svg>
  );
};

export const AddIcon = ({size= 4} : {size?: number }) => {
  return (
    <svg role="img" className={`w-${size} h-${size}`}>
      <use xlinkHref={`${appData.assets.icons}#icon-add`} />
    </svg>
  );
};

export const CloseIcon = () => {
  const intl = useIntl();
  const seed = useUIDSeed();

  return (
    <svg role="img" className={`w-4 h-4 icon-close`}>
      <use xlinkHref={`${appData.assets.icons}#icon-cross`} />
      <title id={seed('icon-close')}>{intl.formatMessage(messages.close)}</title>
    </svg>
  );
};
