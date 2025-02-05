import React, { useEffect, useState } from 'react';

import { useFeatureFlag } from 'data';

type WindowWithCrisp = typeof window & { $crisp?: any };

export const CrispOverlay = () => {
  const windowWithCrisp: WindowWithCrisp = window;

  const { status, data } = useFeatureFlag('custom_crisp_overlay');
  const [isChatOpen, setChatOpen] = useState(false);

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
  }, [status]);

  if (status !== 'success' || !data?.is_active) {
    return null;
  }

  return (
    <div className="fixed right-0 bottom-0 py-8 px-6 z-10">
      <button
        onClick={isChatOpen ? closeCrisp : openCrisp}
        className="btn btn-secondary text-sm w-40"
      >
        {isChatOpen ? 'Fermer le support' : 'Contacter le support'}
      </button>
    </div>
  );
};
