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

export const DownloadNewReferralButton: React.FC<DownlodReferralButtonProps> = ({
  referralId,
}) => {
  return (
    <a
      className="btn btn-secondary flex items-center"
      href={`/export-new-referral/${referralId}/`}
    >
      <DownloadIcon />
      <span className="text-sm">
        <FormattedMessage {...messages.exportReferral} />
      </span>
    </a>
  );
};
