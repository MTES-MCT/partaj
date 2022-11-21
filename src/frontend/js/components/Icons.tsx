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

/** SIMPLE ICONS **/
const SimpleIcon = ({
  size = 4,
  color = 'black',
  icon,
}: {
  size?: number;
  color?: string;
  icon: string;
}) => {
  return (
    <svg role="img" className={`w-${size} h-${size} fill-${color}`}>
      <use xlinkHref={`${appData.assets.icons}#icon-${icon}`} />
    </svg>
  );
};

export const MailSentIcon = () => {
  return <SimpleIcon icon="mail-sent" />;
};

export const DownloadIcon = () => {
  return <SimpleIcon icon="download" />;
};

export const DraftIcon = ({ size = 4 }: { size?: number }) => {
  return <SimpleIcon icon="draft" size={size} />;
};

export const DiscussIcon = ({ size = 4 }: { size?: number }) => {
  return <SimpleIcon icon="discuss-line" size={size} />;
};

export const EditIcon = ({
  size = 4,
  color = 'black',
}: {
  size?: number;
  color?: string;
}) => {
  return <SimpleIcon icon="edit" size={size} color={color} />;
};

export const EditFileIcon = ({
  size = 4,
  color = 'black',
}: {
  size?: number;
  color?: string;
}) => {
  return <SimpleIcon icon="edit-file" size={size} color={color} />;
};

export const SendIcon = ({
  size = 4,
  color = 'black',
}: {
  size?: number;
  color?: string;
}) => {
  return <SimpleIcon icon="send-plane-fill" size={size} color={color} />;
};

export const AddIcon = ({ size = 4 }: { size?: number }) => {
  return <SimpleIcon icon="add" size={size} />;
};

export const SearchIcon = () => {
  return <SimpleIcon icon="search" />;
};

export const EyeIcon = ({ color, size }: { color?: string; size?: number }) => {
  return <SimpleIcon color={color} size={size} icon="ri-eye-fill" />;
};

export const FollowIcon = ({
  color,
  size,
}: {
  color?: string;
  size?: number;
}) => {
  return <SimpleIcon color={color} size={size} icon="ri-user-follow-line" />;
};

/** TITLED ICONS **/
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

export const CloseIcon = () => {
  const intl = useIntl();
  const seed = useUIDSeed();

  return (
    <svg role="img" className={`w-4 h-4 icon-close`}>
      <use xlinkHref={`${appData.assets.icons}#icon-cross`} />
      <title id={seed('icon-close')}>
        {intl.formatMessage(messages.close)}
      </title>
    </svg>
  );
};
