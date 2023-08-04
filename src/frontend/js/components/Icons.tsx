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
  alert: {
    defaultMessage: 'Alert',
    description: 'Accessible text for alert icon.',
    id: 'components.Icons.RemoveUserIcon.alert',
  },
});

/** Colors corresponding to theme fill into tailwind.config.js **/
export enum IconColor {
  DEFAULT = 'current',
  PRIMARY_100 = 'primary100',
  PRIMARY_200 = 'primary200',
  PRIMARY_400 = 'primary400',
  PRIMARY_500 = 'primary500',
  SUCCESS_700 = 'success700',
  PRIMARY_1000 = 'primary1000',
  WARNING_500 = 'warning500',
  DANGER_400 = 'danger400',
  DANGER_500 = 'danger500',
  DANGER_1000 = 'danger1000',
  GREY_400 = 'grey400',
  WHITE = 'white',
  BLACK = 'black',
  GRAY_300 = 'gray300',
  GRAY_500 = 'gray500',
}

interface IconProps {
  active: boolean;
}

/** SIMPLE ICONS **/
const SimpleIcon = ({
  size = 4,
  color = IconColor.DEFAULT,
  icon,
}: {
  size?: number;
  color?: IconColor;
  icon: string;
}) => {
  return (
    <svg role="img" className={`w-${size} h-${size} fill-${color}`}>
      <use xlinkHref={`${appData.assets.icons}#icon-${icon}`} />
    </svg>
  );
};

export const MailSentIcon = ({
  color = IconColor.DEFAULT,
}: {
  color?: IconColor;
}) => {
  return <SimpleIcon icon="mail-sent" color={color} />;
};

export const DownloadIcon = ({
  size = 4,
  color = IconColor.DEFAULT,
}: {
  size?: number;
  color?: IconColor;
}) => {
  return <SimpleIcon size={size} color={color} icon="download" />;
};

export const ChevronBottomIcon = ({
  size = 4,
  color = IconColor.WHITE,
}: {
  size?: number;
  color?: IconColor;
}) => {
  return <SimpleIcon size={size} color={color} icon="ri-arrow-down-s-line" />;
};

export const ChevronRightIcon = ({
  size = 4,
  color = IconColor.WHITE,
}: {
  size?: number;
  color?: IconColor;
}) => {
  return <SimpleIcon size={size} color={color} icon="ri-arrow-right-s-fill" />;
};

export const OpenNewTabIcon = ({
  size = 4,
  color = IconColor.WHITE,
}: {
  size?: number;
  color?: IconColor;
}) => {
  return <SimpleIcon size={size} color={color} icon="ri-share-box-line" />;
};

export const CheckIcon = ({
  size = 4,
  color = IconColor.DEFAULT,
}: {
  size?: number;
  color?: IconColor;
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
  color = IconColor.BLACK,
}: {
  size?: number;
  color?: IconColor;
}) => {
  return <SimpleIcon icon="ri-pencil-fill" size={size} color={color} />;
};

export const EditFileIcon = ({
  size = 4,
  color = IconColor.BLACK,
}: {
  size?: number;
  color?: IconColor;
}) => {
  return <SimpleIcon icon="edit-file" size={size} color={color} />;
};

export const SendIcon = ({
  size = 4,
  color,
}: {
  size?: number;
  color?: IconColor;
}) => {
  return <SimpleIcon icon="send-plane-fill" size={size} color={color} />;
};

export const AddIcon = ({
  size = 4,
  color = IconColor.BLACK,
}: {
  color?: IconColor;
  size?: number;
}) => {
  return <SimpleIcon icon="add" size={size} color={color} />;
};

export const SearchIcon = ({
  color = IconColor.DEFAULT,
  size = 4,
}: {
  color?: IconColor;
  size?: number;
}) => {
  return <SimpleIcon color={color} size={size} icon="search" />;
};

export const MailIcon = ({
  color = IconColor.DEFAULT,
  size = 4,
}: {
  color?: IconColor;
  size?: number;
}) => {
  return <SimpleIcon color={color} size={size} icon="ri-mail-line" />;
};

export const EyeIcon = ({
  color,
  size,
}: {
  color?: IconColor;
  size?: number;
}) => {
  return <SimpleIcon color={color} size={size} icon="ri-eye-fill" />;
};

export const QuitIcon = ({
  color,
  size,
}: {
  color?: IconColor;
  size?: number;
}) => {
  return <SimpleIcon color={color} size={size} icon="ri-logout-box-line" />;
};

export const QuoteIcon = ({
  color,
  size,
}: {
  color?: IconColor;
  size?: number;
}) => {
  return <SimpleIcon color={color} size={size} icon="ri-double-quotes-l" />;
};

export const DashboardIcon = ({
  color,
  size,
}: {
  color?: IconColor;
  size?: number;
}) => {
  return <SimpleIcon color={color} size={size} icon="ri-dashboard-3-line" />;
};

export const NotificationRestrictedIcon = ({
  color = IconColor.WHITE,
  size = 4,
}: {
  color?: IconColor;
  size?: number;
}) => {
  return <SimpleIcon color={color} size={size} icon="ri-notification-4-line" />;
};

export const NotificationNoneIcon = ({
  color = IconColor.WHITE,
  size = 4,
}: {
  color?: IconColor;
  size?: number;
}) => {
  return (
    <SimpleIcon color={color} size={size} icon="ri-notification-off-line" />
  );
};

export const NotificationAllIcon = ({
  color = IconColor.WHITE,
  size = 4,
}: {
  color?: IconColor;
  size?: number;
}) => {
  return <SimpleIcon color={color} size={size} icon="ri-notification-all" />;
};

export const PantoneIcon = ({
  color = IconColor.DEFAULT,
  size = 4,
}: {
  color?: IconColor;
  size?: number;
}) => {
  return <SimpleIcon color={color} size={size} icon="ri-pantone-line" />;
};

export const CalendarIcon = ({
  color = IconColor.DEFAULT,
  size = 4,
}: {
  color?: IconColor;
  size?: number;
}) => {
  return <SimpleIcon color={color} size={size} icon="ri-calendar-todo-line" />;
};

export const SortAscIcon = ({
  color = IconColor.DEFAULT,
  size = 4,
}: {
  color?: IconColor;
  size?: number;
}) => {
  return <SimpleIcon color={color} size={size} icon="ri-sort-asc" />;
};

export const HashtagIcon = ({
  color = IconColor.DEFAULT,
  size = 4,
}: {
  color?: IconColor;
  size?: number;
}) => {
  return <SimpleIcon color={color} size={size} icon="ri-hashtag" />;
};

export const ArrowDownIcon = ({
  color = IconColor.DEFAULT,
  size = 5,
}: {
  color?: IconColor;
  size?: number;
}) => {
  return <SimpleIcon color={color} size={size} icon="ri-arrow-down-s-fill" />;
};

export const GpsIcon = ({
  color = IconColor.DEFAULT,
  size = 4,
}: {
  color?: IconColor;
  size?: number;
}) => {
  return <SimpleIcon color={color} size={size} icon="ri-gps" />;
};

export const DeskIcon = ({
  color = IconColor.DEFAULT,
  size = 4,
}: {
  color?: IconColor;
  size?: number;
}) => {
  return <SimpleIcon color={color} size={size} icon="ri-government-line" />;
};

export const UserFillIcon = ({
  color = IconColor.DEFAULT,
  size = 4,
}: {
  color?: IconColor;
  size?: number;
}) => {
  return <SimpleIcon color={color} size={size} icon="ri-user-fill" />;
};

export const ValidationIcon = ({
  color = IconColor.DEFAULT,
  size = 4,
}: {
  color?: IconColor;
  size?: number;
}) => {
  return <SimpleIcon color={color} size={size} icon="ri-auction-line" />;
};

export const ChangeIcon = ({
  color = IconColor.DEFAULT,
  size = 4,
}: {
  color?: IconColor;
  size?: number;
}) => {
  return (
    <SimpleIcon color={color} size={size} icon="ri-arrow-left-right-line" />
  );
};

export const CloseIcon = ({
  color = IconColor.DEFAULT,
  size = 4,
}: {
  color?: IconColor;
  size?: number;
}) => {
  return <SimpleIcon color={color} size={size} icon="cross" />;
};

/** TITLED ICONS **/
const TitledIcon = ({
  size = 4,
  color = IconColor.DEFAULT,
  icon,
  title,
  fill = true,
}: {
  size?: number;
  color?: IconColor;
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
  color = IconColor.DEFAULT,
}: {
  color?: IconColor;
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

export const CrossIcon = ({
  color = IconColor.DEFAULT,
  size = 4,
}: {
  color?: IconColor;
  size?: number;
}) => {
  return <SimpleIcon color={color} size={size} icon="ri-close-fill" />;
};

export const AlertIcon = ({
  size = 4,
  color = IconColor.DANGER_1000,
}: {
  color?: IconColor;
  size?: number;
}) => {
  return (
    <TitledIcon
      size={size}
      fill={true}
      color={color}
      title={messages.alert}
      icon="alert"
    />
  );
};
