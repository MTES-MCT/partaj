import React from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';

import { useFeatureFlag } from 'data';
import { appData } from 'appData';

const messages = defineMessages({
  openSupportLink: {
    defaultMessage: 'Contact support',
    description: 'Button to open support platform in a new tab',
    id: 'components.SupportOverlay.openChatSupport',
  },
});

export const SupportOverlay = () => {
  const { status, data } = useFeatureFlag('use_support_overlay');
  const url = appData.url_support;

  const openSupport = () => {
    window.open(url, '_blank')?.focus();
  };

  return (
    <div className="fixed right-0 bottom-0 py-8 px-6 z-10">
      {status === 'success' && data?.is_active && (
        <button
          onClick={openSupport}
          className="btn btn-secondary justify-center text-sm w-40 bg-white"
        >
          <FormattedMessage {...messages.openSupportLink} />
        </button>
      )}
    </div>
  );
};
