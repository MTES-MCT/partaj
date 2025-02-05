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

  const openCrisp = () => {
    if (windowWithCrisp.$crisp) {
      windowWithCrisp.$crisp.push(['do', 'chat:open']);
      setChatOpen(true);
    }
  };

  const closeCrisp = () => {
    if (windowWithCrisp.$crisp) {
      windowWithCrisp.$crisp.push(['do', 'chat:close']);
      setChatOpen(false);
    }
  };

  const crispLoaded = (defaultButton: HTMLAnchorElement) => {
    closeCrisp();
    defaultButton.remove();
  };

  const detectCrisp = () => {
    const observer = new MutationObserver(() => {
      const crispDefaultButton = [
        document.querySelector('[aria-label="Ouvrir le chat"]'),
        document.querySelector('[aria-label="Fermer le chat"]'),
      ].find((el) => !!el);

      if (crispDefaultButton) {
        observer.disconnect();
        crispLoaded(crispDefaultButton as HTMLAnchorElement);
      }
    });
    observer.observe(document, { subtree: true, childList: true });
  };

  useEffect(() => {
    if (status === 'success' && data?.is_active) {
      detectCrisp();
    }
  }, [status, data?.is_active]);

  if (status !== 'success' || !data?.is_active) {
    return null;
  }

  return (
    <div className="fixed right-0 bottom-0 py-8 px-6 z-10">
      <button
        onClick={chatOpen ? closeCrisp : openCrisp}
        className="btn btn-secondary text-sm w-40"
      >
        {chatOpen && <FormattedMessage {...messages.closeChatSupport} />}
        {!chatOpen && <FormattedMessage {...messages.openChatSupport} />}
      </button>
    </div>
  );
};
