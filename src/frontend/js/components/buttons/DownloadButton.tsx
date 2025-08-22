import React from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { DownloadIcon } from '../Icons';

const messages = defineMessages({
  exportReferral: {
    defaultMessage: 'Download the referral',
    description: 'Message for export button.',
    id: 'components.DownloadButton.exportReferral',
  },
});

interface DownloadButtonProps {
  referralId: string;
  type?: 'new' | 'standard';
}

export const DownloadButton: React.FC<DownloadButtonProps> = ({
  referralId,
  type = 'standard',
}) => {
  const baseClasses = "btn space-x-1 hover:bg-grey-100 flex items-center border border-primary-700 text-primary-700 px-4 py-2";
  const url = type === 'new' ? `/export-new-referral/${referralId}/` : `/export-referral/${referralId}/`;

  return (
    <a
      className={baseClasses}
      href={url}
    >
      <DownloadIcon />
      <span className="text-sm">
        <FormattedMessage {...messages.exportReferral} />
      </span>
    </a>
  );
};
