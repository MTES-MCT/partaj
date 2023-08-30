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
      className="flex items-center relative btn btn-light-gray focus:ring"
      href={`/export-referral/${referralId}/`}
    >
      <div className="mr-2">
        <DownloadIcon />
      </div>
      <FormattedMessage {...messages.exportReferral} />
    </a>
  );
};
