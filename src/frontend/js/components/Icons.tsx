import React from 'react';
import { defineMessages, useIntl } from 'react-intl';
import { useUIDSeed } from 'react-uid';
import { twMerge } from 'tailwind-merge';

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
  label?: string;
  className?: string;
}

/** SIMPLE ICONS **/
const SimpleIcon = ({
  className,
  icon,
  label,
}: {
  className?: string;
  icon: string;
  label?: string;
}) => {
  return (
    <svg
      className={twMerge('w-4 h-4 fill-current', className)}
      aria-hidden="true"
      focusable="false"
      aria-label={label}
    >
      <use xlinkHref={`${appData.assets.icons}#icon-${icon}`} />
    </svg>
  );
};

const ImgIcon = ({
  className,
  icon,
  label,
}: {
  className?: string;
  icon: string;
  label?: string;
}) => {
  return (
    <svg
      role="img"
      className={twMerge('w-4 h-4 fill-current', className)}
      aria-label={label}
    >
      <use xlinkHref={`${appData.assets.icons}#icon-${icon}`} />
    </svg>
  );
};

export const MailSentIcon = ({
  className,
  label,
}: {
  className?: string;
  label?: string;
}) => {
  return <ImgIcon icon="mail-sent" className={className} label={label} />;
};

export const DownloadIcon = ({ ...props }) => (
  <ImgIcon icon="download" {...props} />
);

export const ExclamationMarkIcon = ({ ...props }) => (
  <SimpleIcon icon="ri-error-warning-line" {...props} />
);

export const ChevronBottomIcon = ({ className, label }: IconProps) => {
  return <SimpleIcon icon="ri-arrow-down-s-line" label={label} />;
};

export const ChevronRightIcon = ({ className, label }: IconProps) => (
  <SimpleIcon
    icon="ri-arrow-right-s-fill"
    className={twMerge('fill-white', className)}
    label={label}
  />
);

export const ArrowRightIcon = ({ className, label }: IconProps) => (
  <SimpleIcon icon="ri-arrow-right-line" label={label} />
);

export const OpenNewTabIcon = ({ className, label }: IconProps) => (
  <ImgIcon
    icon="ri-share-box-line"
    className={twMerge('fill-white', className)}
    label={label}
  />
);

export const CheckIcon = ({ ...props }) => (
  <ImgIcon icon="ri-check-fill" {...props} />
);

export const DraftIcon = ({ ...props }) => <ImgIcon icon="draft" {...props} />;

export const DiscussIcon = ({ ...props }) => (
  <ImgIcon icon="discuss-line" {...props} />
);

export const EditFileIcon = ({ className, label }: IconProps) => (
  <ImgIcon
    icon="edit-file"
    className={twMerge('fill-black', className)}
    label={label}
  />
);

export const EditIcon = ({ className, label }: IconProps) => (
  <ImgIcon
    icon="ri-pencil-fill"
    className={twMerge('fill-black', className)}
    label={label}
  />
);

export const SendIcon = ({ ...props }) => {
  return <ImgIcon icon="send-plane-fill" {...props} />;
};

export const AddIcon = ({ className, label }: IconProps) => (
  <ImgIcon icon="add" className={twMerge('fill-black', className)} />
);

export const SearchIcon = ({ ...props }) => (
  <ImgIcon icon="search" {...props} />
);

export const MailIcon = ({ ...props }) => (
  <ImgIcon icon="ri-mail-line" {...props} />
);

export const EyeIcon = ({ ...props }) => (
  <ImgIcon icon="ri-eye-fill" {...props} />
);

export const QuoteIcon = ({ ...props }) => (
  <ImgIcon icon="ri-double-quotes-l" {...props} />
);

export const DashboardIcon = ({ ...props }) => (
  <ImgIcon icon="ri-dashboard-3-line" {...props} />
);

export const NotificationRestrictedIcon = ({ className, label }: IconProps) => (
  <ImgIcon
    icon="ri-notification-4-line"
    className={twMerge('fill-white', className)}
    label={label}
  />
);

export const NotificationNoneIcon = ({ className, label }: IconProps) => (
  <ImgIcon
    icon="ri-notification-off-line"
    className={twMerge('fill-white', className)}
    label={label}
  />
);

export const NotificationAllIcon = ({ className, label }: IconProps) => (
  <ImgIcon
    icon="ri-notification-all"
    className={twMerge('fill-white', className)}
    label={label}
  />
);

export const PantoneIcon = ({ ...props }) => (
  <ImgIcon icon="ri-pantone-line" {...props} />
);

export const CalendarIcon = ({ ...props }) => (
  <ImgIcon icon="ri-calendar-todo-line" {...props} />
);

export const SortAscIcon = ({ ...props }) => (
  <ImgIcon icon="ri-sort-asc" {...props} />
);

export const HashtagIcon = ({ ...props }) => (
  <ImgIcon icon="ri-hashtag" {...props} />
);

export const ArrowDownIcon = ({ className, label }: IconProps) => (
  <ImgIcon
    icon="ri-arrow-down-s-fill"
    className={twMerge('w-5 h-5', className)}
    label={label}
  />
);

export const GpsIcon = ({ ...props }) => <ImgIcon icon="ri-gps" {...props} />;

export const DeskIcon = ({ ...props }) => (
  <ImgIcon icon="ri-government-line" {...props} />
);

export const UserFillIcon = ({ ...props }) => (
  <ImgIcon icon="ri-user-fill" {...props} />
);

export const ValidationIcon = ({ ...props }) => (
  <ImgIcon icon="ri-auction-line" {...props} />
);

export const ChangeIcon = ({ ...props }) => (
  <ImgIcon icon="ri-arrow-left-right-line" {...props} />
);

export const CloseIcon = ({ ...props }) => <ImgIcon icon="cross" {...props} />;

/** TITLED ICONS **/
const TitledIcon = ({
  className,
  icon,
  title,
  label,
  fill = true,
}: {
  className?: string;
  icon: string;
  title: Message;
  fill?: boolean;
  label?: string;
}) => {
  const intl = useIntl();
  const seed = useUIDSeed();

  return (
    <svg
      role="img"
      className={twMerge(`w-4 h-4 ${fill && 'fill-current'}`, className)}
      aria-label={label}
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

export const AtIcon = ({
  active = false,
  label,
}: {
  active: boolean;
  label?: string;
}) => {
  return (
    <svg
      role="img"
      className={`w-8 h-8 ${active ? 'icon-state-open' : 'icon-state-closed'}`}
      aria-label={label}
    >
      <use xlinkHref={`${appData.assets.icons}#icon-at-line`} />
    </svg>
  );
};

export const ArrowUpIcon = ({ label }: { label?: string }) => {
  const intl = useIntl();
  const seed = useUIDSeed();

  return (
    <svg role="img" className={`w-6 h-6`} aria-label={label}>
      <use xlinkHref={`${appData.assets.icons}#icon-arrow-up`} />
      <title id={seed('icon-arrow-up')}>
        {intl.formatMessage(messages.send)}
      </title>
    </svg>
  );
};

export const CrossIcon = ({ ...props }) => (
  <ImgIcon icon="ri-close-fill" {...props} />
);

export const AlertIcon = ({ className, label }: IconProps) => (
  <TitledIcon
    className={twMerge('fill-danger1000', className)}
    fill={true}
    title={messages.alert}
    icon="alert"
    label={label}
  />
);
