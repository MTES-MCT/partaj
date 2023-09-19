import React from 'react';
import { defineMessages, useIntl } from 'react-intl';
import { useUIDSeed } from 'react-uid';
import clsx from 'clsx';

import { appData } from '../appData';
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

interface IconProps {
  active: boolean;
}

/** SIMPLE ICONS **/
const SimpleIcon = ({
  className,
  icon,
}: {
  className?: string;
  icon: string;
}) => {
  return (
    <svg role="img" className={clsx('w-4 h-4 fill-current', className)}>
      <use xlinkHref={`${appData.assets.icons}#icon-${icon}`} />
    </svg>
  );
};

export const MailSentIcon = ({ className }: { className?: string }) => {
  return <SimpleIcon icon="mail-sent" className={className} />;
};

export const DownloadIcon = ({ ...props }) => (
  <SimpleIcon icon="download" {...props} />
);

export const ExclamationMarkIcon = ({ ...props }) => (
  <SimpleIcon icon="ri-error-warning-line" {...props} />
);

export const ChevronBottomIcon = ({ className }: { className?: string }) => {
  return (
    <SimpleIcon
      icon="ri-arrow-down-s-line"
      className={clsx('fill-white', className)}
    />
  );
};

export const ChevronRightIcon = ({ className }: { className?: string }) => (
  <SimpleIcon
    icon="ri-arrow-right-s-fill"
    className={clsx('fill-white', className)}
  />
);

export const OpenNewTabIcon = ({ className }: { className?: string }) => (
  <SimpleIcon
    icon="ri-share-box-line"
    className={clsx('fill-white', className)}
  />
);

export const CheckIcon = ({ ...props }) => (
  <SimpleIcon icon="ri-check-fill" {...props} />
);

export const DraftIcon = ({ ...props }) => (
  <SimpleIcon icon="draft" {...props} />
);

export const DiscussIcon = ({ ...props }) => (
  <SimpleIcon icon="discuss-line" {...props} />
);

export const EditIcon = ({ className }: { className?: string }) => (
  <SimpleIcon icon="ri-pencil-fill" className={clsx('fill-black', className)} />
);

export const EditFileIcon = ({ className }: { className?: string }) => (
  <SimpleIcon icon="edit-file" className={clsx('fill-black', className)} />
);

export const SendIcon = ({ ...props }) => {
  return <SimpleIcon icon="send-plane-fill" {...props} />;
};

export const AddIcon = ({ className }: { className?: string }) => (
  <SimpleIcon icon="add" className={clsx('fill-black', className)} />
);

export const SearchIcon = ({ ...props }) => (
  <SimpleIcon icon="search" {...props} />
);

export const MailIcon = ({ ...props }) => (
  <SimpleIcon icon="ri-mail-line" {...props} />
);

export const EyeIcon = ({ ...props }) => (
  <SimpleIcon icon="ri-eye-fill" {...props} />
);

export const QuitIcon = ({ ...props }) => (
  <SimpleIcon icon="ri-logout-box-line" {...props} />
);

export const QuoteIcon = ({ ...props }) => (
  <SimpleIcon icon="ri-double-quotes-l" {...props} />
);

export const DashboardIcon = ({ ...props }) => (
  <SimpleIcon icon="ri-dashboard-3-line" {...props} />
);

export const NotificationRestrictedIcon = ({
  className,
}: {
  className?: string;
}) => (
  <SimpleIcon
    icon="ri-notification-4-line"
    className={clsx('fill-white', className)}
  />
);

export const NotificationNoneIcon = ({ className }: { className?: string }) => (
  <SimpleIcon
    icon="ri-notification-off-line"
    className={clsx('fill-white', className)}
  />
);

export const NotificationAllIcon = ({ className }: { className?: string }) => (
  <SimpleIcon
    icon="ri-notification-all"
    className={clsx('fill-white', className)}
  />
);

export const PantoneIcon = ({ ...props }) => (
  <SimpleIcon icon="ri-pantone-line" {...props} />
);

export const CalendarIcon = ({ ...props }) => (
  <SimpleIcon icon="ri-calendar-todo-line" {...props} />
);

export const SortAscIcon = ({ ...props }) => (
  <SimpleIcon icon="ri-sort-asc" {...props} />
);

export const HashtagIcon = ({ ...props }) => (
  <SimpleIcon icon="ri-hashtag" {...props} />
);

export const ArrowDownIcon = ({ className }: { className?: string }) => (
  <SimpleIcon
    icon="ri-arrow-down-s-fill"
    className={clsx('w-5 h-5', className)}
  />
);

export const GpsIcon = ({ ...props }) => (
  <SimpleIcon icon="ri-gps" {...props} />
);

export const DeskIcon = ({ ...props }) => (
  <SimpleIcon icon="ri-government-line" {...props} />
);

export const UserFillIcon = ({ ...props }) => (
  <SimpleIcon icon="ri-user-fill" {...props} />
);

export const ValidationIcon = ({ ...props }) => (
  <SimpleIcon icon="ri-auction-line" {...props} />
);

export const ChangeIcon = ({ ...props }) => (
  <SimpleIcon icon="ri-arrow-left-right-line" {...props} />
);

export const CloseIcon = ({ ...props }) => (
  <SimpleIcon icon="cross" {...props} />
);

/** TITLED ICONS **/
const TitledIcon = ({
  className,
  icon,
  title,
  fill = true,
}: {
  className?: string;
  icon: string;
  title: Message;
  fill?: boolean;
}) => {
  const intl = useIntl();
  const seed = useUIDSeed();

  return (
    <svg
      role="img"
      className={clsx(`w-4 h-4 ${fill && 'fill-current'}`, className)}
    >
      <use xlinkHref={`${appData.assets.icons}#icon-${icon}`} />
      <title id={seed(`icon-${icon}`)}>{intl.formatMessage(title)}</title>
    </svg>
  );
};

export const RemoveUserIcon = ({ ...props }) => (
  <TitledIcon
    fill={false}
    title={messages.removeUser}
    icon="user-disconnect"
    {...props}
  />
);

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

export const CrossIcon = ({ ...props }) => (
  <SimpleIcon icon="ri-close-fill" {...props} />
);

export const AlertIcon = ({ className }: { className?: string }) => (
  <TitledIcon
    className={clsx('fill-danger1000', className)}
    fill={true}
    title={messages.alert}
    icon="alert"
  />
);
