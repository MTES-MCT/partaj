import React from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';

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
      className="relative btn btn-primary focus:shadow-outline"
      href={`/export-referral/${referralId}/`}
    >
      <FormattedMessage {...messages.exportReferral} />
    </a>
  );
};
