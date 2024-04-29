import React from 'react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { Attachment, ScanStatus } from '../../types';
import { CheckIcon } from '../Icons';

const messages = defineMessages({
  verified: {
    defaultMessage: 'Verified file',
    description: 'Text for verified file',
    id: 'components.ScanVerified.verified',
  },
  verifiedTooltip: {
    defaultMessage: 'This file has been verified by our anti-malware scanner',
    description: 'Text for verified file tooltip',
    id: 'components.ScanVerified.verifiedTooltip',
  },
});

export const ScanVerified = ({ file }: { file: Attachment }) => {
  const intl = useIntl();
  return (
    <>
      {file.scan_status === ScanStatus.VERIFIED ? (
        <div
          className="flex tooltip tooltip-info"
          data-tooltip={intl.formatMessage(messages.verifiedTooltip)}
        >
          <CheckIcon className="fill-success600" />
          <span className="text-success-600 text-xs">
            <FormattedMessage {...messages.verified} />
          </span>
        </div>
      ) : null}
    </>
  );
};
