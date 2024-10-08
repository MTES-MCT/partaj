import React from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { DownloadIcon } from '../Icons';

const messages = defineMessages({
  exportReferral: {
    defaultMessage: 'Download the referral',
    description: 'Message for export button.',
    id: 'components.ReferralDetailContent.exportReferral',
  },
});

interface DownlodReferralButtonProps {
  referralId: string;
}

export const DownloadReferralButton: React.FC<DownlodReferralButtonProps> = ({
  referralId,
}) => {
  return (
    <a
      className="btn space-x-1 py-1 px-2 hover:bg-grey-100 flex items-center mr-2 border border-primary-700 text-primary-700 px-4 py-2"
      href={`/export-referral/${referralId}/`}
    >
      <DownloadIcon />
      <span className="text-sm">
        <FormattedMessage {...messages.exportReferral} />
      </span>
    </a>
  );
};
