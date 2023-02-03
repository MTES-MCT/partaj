import { appData } from '../appData';
import React from 'react';
import { defineMessages, useIntl } from 'react-intl';
import { useUIDSeed } from 'react-uid';
import { Message } from '../types';

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
  removeUser: {
    defaultMessage: 'Remove user from referral',
    description:
      'Accessible text for the button to remove a given user from a referral.',
    id: 'components.Icons.RemoveUserIcon.removeUser',
  },
});

/** Colors corresponding to theme fill into tailwind.config.js **/
export enum IconColor {
  DEFAULT = 'current',
  PRIMARY_100 = 'primary100',
  PRIMARY_200 = 'primary200',
  PRIMARY_400 = 'primary400',
  PRIMARY_500 = 'primary500',
  PRIMARY_1000 = 'primary1000',
  DANGER_500 = 'danger500',
  WHITE = 'my_drafts',
  BLACK = 'my_drafts',
  GRAY_500 = 'gray500',
}

interface IconProps {
  active: boolean;
}

/** SIMPLE ICONS **/
const SimpleIcon = ({
  size = 4,
  color = 'current',
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

export const ChevronBottomIcon = ({
  size = 4,
  color = 'white',
}: {
  size?: number;
  color?: string;
}) => {
  return <SimpleIcon size={size} color={color} icon="ri-arrow-down-s-line" />;
};

export const CheckIcon = ({
  size = 4,
  color = IconColor.DEFAULT,
}: {
  size?: number;
  color?: string;
}) => {
  return <SimpleIcon size={size} color={color} icon="ri-check-fill" />;
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
  color,
}: {
  size?: number;
  color?: string;
}) => {
  return <SimpleIcon icon="send-plane-fill" size={size} color={color} />;
};

export const AddIcon = ({
  size = 4,
  color = 'black',
}: {
  color?: string;
  size?: number;
}) => {
  return <SimpleIcon icon="add" size={size} color={color} />;
};

export const SearchIcon = ({
  color = 'current',
  size = 4,
}: {
  color?: string;
  size?: number;
}) => {
  return <SimpleIcon color={color} size={size} icon="search" />;
};

export const MailIcon = ({
  color = 'current',
  size = 4,
}: {
  color?: string;
  size?: number;
}) => {
  return <SimpleIcon color={color} size={size} icon="ri-mail-line" />;
};

export const EyeIcon = ({ color, size }: { color?: string; size?: number }) => {
  return <SimpleIcon color={color} size={size} icon="ri-eye-fill" />;
};

export const QuitIcon = ({
  color,
  size,
}: {
  color?: string;
  size?: number;
}) => {
  return <SimpleIcon color={color} size={size} icon="ri-logout-box-line" />;
};

export const DashboardIcon = ({
  color,
  size,
}: {
  color?: string;
  size?: number;
}) => {
  return <SimpleIcon color={color} size={size} icon="ri-dashboard-3-line" />;
};

export const NotificationRestrictedIcon = ({
  color = 'white',
  size = 4,
}: {
  color?: string;
  size?: number;
}) => {
  return <SimpleIcon color={color} size={size} icon="ri-notification-4-line" />;
};

export const NotificationNoneIcon = ({
  color = 'white',
  size = 4,
}: {
  color?: string;
  size?: number;
}) => {
  return (
    <SimpleIcon color={color} size={size} icon="ri-notification-off-line" />
  );
};

export const NotificationAllIcon = ({
  color = 'white',
  size = 4,
}: {
  color?: string;
  size?: number;
}) => {
  return <SimpleIcon color={color} size={size} icon="ri-notification-all" />;
};

/** TITLED ICONS **/
const TitledIcon = ({
  size = 4,
  color = 'current',
  icon,
  title,
  fill = true,
}: {
  size?: number;
  color?: string;
  icon: string;
  title: Message;
  fill?: boolean;
}) => {
  const intl = useIntl();
  const seed = useUIDSeed();

  return (
    <svg
      role="img"
      className={`w-${size} h-${size} ${fill && `fill-${color}`}`}
    >
      <use xlinkHref={`${appData.assets.icons}#icon-${icon}`} />
      <title id={seed(`icon-${icon}`)}>{intl.formatMessage(title)}</title>
    </svg>
  );
};

export const RemoveUserIcon = ({
  size = 4,
  color = 'current',
}: {
  color?: string;
  size?: number;
}) => {
  return (
    <TitledIcon
      size={size}
      fill={false}
      color={color}
      title={messages.removeUser}
      icon="user-disconnect"
    />
  );
};

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
