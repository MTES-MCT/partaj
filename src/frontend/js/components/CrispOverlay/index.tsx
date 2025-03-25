import React, { useEffect, useState } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';

import { useFeatureFlag } from 'data';

type WindowWithCrisp = typeof window & { $crisp?: any };

const messages = defineMessages({
  openChatSupport: {
    defaultMessage: 'Contact support',
    description: 'Button to open Crisp support chat',
    id: 'components.CrispOverlay.openChatSupport',
  },
  closeChatSupport: {
    defaultMessage: 'Close support',
    description: 'Button to close Crisp support chat',
    id: 'components.CrispOverlay.closeChatSupport',
  },
});

export const CrispOverlay = () => {
  const windowWithCrisp: WindowWithCrisp = window;

  const { status, data } = useFeatureFlag('custom_crisp_overlay');
  const [chatOpen, setChatOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const openCrisp = () => {
    windowWithCrisp?.$crisp.push(['do', 'chat:open']);
  };

  const closeCrisp = () => {
    windowWithCrisp?.$crisp.push(['do', 'chat:close']);
  };

  useEffect(() => {
    if (status !== 'success' || !data?.is_active) {
      return;
    }

    if (windowWithCrisp.$crisp) {
      windowWithCrisp.$crisp.push([
        'on',
        'session:loaded',
        () => {
          setLoaded(true);
          windowWithCrisp.$crisp.push([
            'on',
            'chat:opened',
            () => setChatOpen(true),
          ]);
          windowWithCrisp.$crisp.push([
            'on',
            'chat:closed',
            () => setChatOpen(false),
          ]);

          if (windowWithCrisp.$crisp.is('chat:opened')) {
            setChatOpen(true);
          }
          if (windowWithCrisp.$crisp.is('chat:closed')) {
            setChatOpen(false);
          }
        },
      ]);
    }

    const observer = new MutationObserver(() => {
      document.querySelector('[aria-label="Ouvrir le chat"]')?.remove();
      document.querySelector('[aria-label="Fermer le chat"]')?.remove();
    });

    observer.observe(document, { subtree: true, childList: true });

    return () => observer.disconnect();
  }, [status, data?.is_active, windowWithCrisp.$crisp]);

  if (status !== 'success' || !data?.is_active || !loaded) {
    return null;
  }

  return (
    <div className="fixed right-0 bottom-0 py-8 px-6 z-10">
      <button
        onClick={chatOpen ? closeCrisp : openCrisp}
        className="btn btn-secondary text-sm w-40 bg-white"
      >
        {chatOpen ? (
          <FormattedMessage {...messages.closeChatSupport} />
        ) : (
          <FormattedMessage {...messages.openChatSupport} />
        )}
      </button>
    </div>
  );
};
