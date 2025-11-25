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
  title?: string;
}

/** SIMPLE ICONS **/
const SimpleIcon = ({
  className,
  icon,
  label,
  title,
}: {
  className?: string;
  icon: string;
  label?: string;
  title?: string;
}) => {
  return (
    <svg
      role="presentation"
      className={twMerge('w-4 h-4 fill-current', className)}
      aria-label={label}
    >
      <use xlinkHref={`${appData.assets.icons}#icon-${icon}`} />
      {title && <title>{title}</title>}
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
  return <SimpleIcon icon="mail-sent" className={className} label={label} />;
};

export const DownloadIcon = ({ ...props }) => (
  <SimpleIcon icon="download" {...props} />
);

export const SplitIcon = ({ ...props }) => (
  <SimpleIcon icon="ri-git-branch-line" {...props} />
);

export const ScalesIcon = ({ ...props }) => (
  <SimpleIcon icon="ri-scales-fill" {...props} />
);

export const LockerIcon = ({ ...props }) => (
  <SimpleIcon icon="ri-private" {...props} />
);

export const GroupIcon = ({ ...props }) => (
  <SimpleIcon icon="ri-group" {...props} />
);

export const SaveIcon = ({ ...props }) => (
  <SimpleIcon icon="ri-save-line" {...props} />
);

export const ExternalLinkIcon = ({ ...props }) => (
  <SimpleIcon icon="ri-external-link-line" {...props} />
);
export const InfoIcon = ({ ...props }) => (
  <SimpleIcon icon="ri-information-line" {...props} />
);

export const ExclamationMarkIcon = ({ ...props }) => (
  <SimpleIcon icon="ri-error-warning-line" {...props} />
);

export const LinkIcon = ({ ...props }) => (
  <SimpleIcon icon="ri-links-line" {...props} />
);

export const ChevronBottomIcon = ({ className, label }: IconProps) => {
  return (
    <SimpleIcon
      className={className}
      icon="ri-arrow-down-s-line"
      label={label}
    />
  );
};

export const ChevronRightIcon = ({ className, label }: IconProps) => (
  <SimpleIcon
    icon="ri-arrow-right-s-fill"
    className={twMerge('fill-white', className)}
    label={label}
  />
);

export const LineChevronRightIcon = ({
  className,
  label,
  title,
}: IconProps) => (
  <SimpleIcon
    icon="ri-arrow-right-s-line"
    className={className}
    label={label}
    title={title}
  />
);

export const ArrowRightIcon = ({ className, label }: IconProps) => (
  <SimpleIcon
    icon="ri-arrow-right-line"
    label={label}
    className={twMerge(className)}
  />
);

export const InboxIcon = ({ className, label }: IconProps) => (
  <SimpleIcon
    icon="ri-inbox-2-line"
    label={label}
    className={twMerge(className)}
  />
);

export const OpenNewTabIcon = ({ className, label }: IconProps) => (
  <SimpleIcon
    icon="ri-share-box-line"
    className={twMerge('fill-white', className)}
    label={label}
  />
);

export const SmileyHappyIcon = ({ className, label }: IconProps) => (
  <SimpleIcon
    icon="ri-emotion-happy-line"
    className={twMerge(className)}
    label={label}
  />
);

export const SmileyNormalIcon = ({ className, label }: IconProps) => (
  <SimpleIcon
    icon="ri-emotion-normal-line"
    className={twMerge(className)}
    label={label}
  />
);

export const SmileyUnhappyIcon = ({ className, label }: IconProps) => (
  <SimpleIcon
    icon="ri-emotion-unhappy-line"
    className={twMerge(className)}
    label={label}
  />
);

export const CheckIcon = ({ ...props }) => (
  <SimpleIcon icon="ri-check-fill" {...props} />
);

export const CircleCheckIcon = ({ ...props }) => (
  <SimpleIcon icon="ri-checkbox-circle-fill" {...props} />
);

export const CircleFillIcon = ({ ...props }) => (
  <SimpleIcon icon="ri-circle-fill" {...props} />
);

export const DraftIcon = ({ ...props }) => (
  <SimpleIcon icon="draft" {...props} />
);

export const ArrowCornerDownRight = ({ ...props }) => (
  <SimpleIcon icon="ri-corner-down-right-line" {...props} />
);

export const QuillPen = ({ ...props }) => (
  <SimpleIcon icon="ri-quill-pen-ai-line" {...props} />
);

export const DiscussIcon = ({ ...props }) => (
  <SimpleIcon icon="discuss-line" {...props} />
);

export const EditFileIcon = ({ className, label }: IconProps) => (
  <SimpleIcon
    icon="edit-file"
    className={twMerge('fill-black', className)}
    label={label}
  />
);

export const EditIcon = ({ className, label }: IconProps) => (
  <SimpleIcon
    icon="ri-pencil-fill"
    className={twMerge('fill-black', className)}
    label={label}
  />
);

export const SendIcon = ({ ...props }) => {
  return <SimpleIcon icon="send-plane-fill" {...props} />;
};

export const ListIcon = ({ ...props }) => {
  return <SimpleIcon icon="ri-list-view" {...props} />;
};

export const FolderIcon = ({ ...props }) => {
  return <SimpleIcon icon="ri-folder-6-line" {...props} />;
};

export const ChartIcon = ({ ...props }) => {
  return <SimpleIcon icon="ri-bar-chart-2-fill" {...props} />;
};

export const AddIcon = ({ className, label }: IconProps) => (
  <SimpleIcon icon="add" className={twMerge('fill-black', className)} />
);

export const SearchIcon = ({ ...props }) => (
  <SimpleIcon icon="search" {...props} />
);
export const FileDraftIcon = ({ ...props }) => (
  <SimpleIcon icon="ri-draft-line" {...props} />
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

export const EmptyFolder = ({ ...props }) => (
  <SimpleIcon icon="ri-folder-check-fill" {...props} />
);

export const DashboardIcon = ({ ...props }) => (
  <SimpleIcon icon="ri-dashboard-3-line" {...props} />
);

export const NotificationRestrictedIcon = ({ className, label }: IconProps) => (
  <SimpleIcon
    icon="ri-notification-4-line"
    className={twMerge('fill-white', className)}
    label={label}
  />
);

export const NotificationNoneIcon = ({ className, label }: IconProps) => (
  <SimpleIcon
    icon="ri-notification-off-line"
    className={twMerge('fill-white', className)}
    label={label}
  />
);

export const NotificationAllIcon = ({ className, label }: IconProps) => (
  <SimpleIcon
    icon="ri-notification-all"
    className={twMerge('fill-white', className)}
    label={label}
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

export const ArrowDownIcon = ({ className, label }: IconProps) => (
  <SimpleIcon
    icon="ri-arrow-down-s-fill"
    className={twMerge('w-5 h-5', className)}
    label={label}
  />
);

export const GpsIcon = ({ ...props }) => (
  <SimpleIcon icon="ri-gps" {...props} />
);

export const FileIcon = ({ ...props }) => (
  <SimpleIcon icon="ri-file-line" {...props} />
);

export const ErrorIcon = ({ ...props }) => (
  <SimpleIcon icon="ri-error-warning-fill" {...props} />
);

export const DeskIcon = ({ ...props }) => (
  <SimpleIcon icon="ri-government-line" {...props} />
);

export const UserFillIcon = ({ ...props }) => (
  <SimpleIcon icon="ri-user-fill" {...props} />
);

export const ArrowGoBackIcon = ({ ...props }) => (
  <SimpleIcon icon="ri-arrow-go-back-fill" {...props} />
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

export const RemoveUserIcon = ({ ...props }) => (
  <SimpleIcon icon="user-disconnect" {...props} />
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
      role="presentation"
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
    <svg role="presentation" className={`w-6 h-6`} aria-label={label}>
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

export const AlertIcon = ({ ...props }) => (
  <SimpleIcon icon="alert" className={'fill-danger1000'} {...props} />
);

export const ArrowDropRight = ({ ...props }) => (
  <SimpleIcon icon="ri-arrow-drop-right-line" {...props} />
);

export const ArrowDropLeft = ({ ...props }) => (
  <SimpleIcon icon="ri-arrow-drop-left-line" {...props} />
);

export const SkipLeft = ({ ...props }) => (
  <SimpleIcon icon="ri-skip-left-line" {...props} />
);

export const SkipRight = ({ ...props }) => (
  <SimpleIcon icon="ri-skip-right-line" {...props} />
);
