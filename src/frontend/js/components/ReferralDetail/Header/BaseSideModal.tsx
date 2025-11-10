import React, { useContext, useEffect, useRef } from 'react';
import { useClickOutside } from '../../../utils/useClickOutside';
import { EscKeyCodes } from '../../../const';
import { ArrowRightIcon, CloseIcon } from '../../Icons';
import { BaseSideModalContext } from '../../../data/providers/BaseSideModalProvider';
import { IconTextButton } from '../../buttons/IconTextButton';
import { Title, TitleType } from '../../text/Title';
import { defineMessages, useIntl } from 'react-intl';

const messages = defineMessages({
  close: {
    defaultMessage: 'Close',
    description: 'Confirm button text',
    id: 'components.ApiModal.close',
  },
});

interface BaseSideModalProps {
  children?: React.ReactNode;
}
const getCss = (type?: string) => {
  switch (type) {
    case 'primary':
      return 'border-dsfr-primary-500';
    case 'warning':
      return 'border-dsfr-warning-500';
    case 'error':
      return 'border-dsfr-danger-500';
    case 'success':
      return 'border-dsfr-success-500';
    default:
      return 'border-dsfr-danger-500';
  }
};

export const BaseSideModal: React.FC<BaseSideModalProps> = ({
  children = null,
}) => {
  const {
    isBaseSideModalOpen,
    closeBaseSideModal,
    baseSideModalProperties,
  } = useContext(BaseSideModalContext);

  const modalRef = useRef(null);
  const previousFocusRef = useRef(null);
  const intl = useIntl();

  // Gestion du focus pour l'accessibilité
  useEffect(() => {
    if (isBaseSideModalOpen) {
      // Sauvegarder l'élément qui avait le focus avant l'ouverture
      // @ts-ignore
      previousFocusRef.current = document.activeElement;
      // Donner le focus au premier élément focusable de la modale
      // @ts-ignore
      const firstFocusableElement = modalRef.current?.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      firstFocusableElement?.focus();
    } else if (previousFocusRef.current) {
      // Restaurer le focus sur l'élément précédent
      // @ts-ignore
      previousFocusRef.current.focus();
    }
  }, [isBaseSideModalOpen]);

  // Gestion des touches clavier
  const handleKeyDown = (e: any) => {
    if (e.key === 'Escape') {
      closeBaseSideModal();
    }

    // Piéger le focus dans la modale (Tab trapping)
    if (e.key === 'Tab') {
      // @ts-ignore
      const focusableElements = modalRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );

      if (focusableElements?.length > 0) {
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          // Shift + Tab : aller vers l'arrière
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          // Tab : aller vers l'avant
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    }
  };

  // Empêcher le défilement du body quand la modale est ouverte
  useEffect(() => {
    if (isBaseSideModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isBaseSideModalOpen]);

  const closeModal = () => closeBaseSideModal();

  return (
    <>
      {/* Overlay et Modale */}
      {isBaseSideModalOpen && (
        <div
          className="fixed inset-0 z-50 m-0 font-marianne"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          aria-describedby="modal-description"
        >
          {/* Overlay avec animation de fondu */}
          <div
            className="fixed inset-0 bg-dsfr-overlay-primary bg-opacity-30 backdrop-blur-sm transition-all duration-300 ease-out"
            style={{
              animation: isBaseSideModalOpen
                ? 'fadeIn 0.3s ease-out'
                : 'fadeOut 0.3s ease-out',
            }}
            onClick={closeModal}
            aria-hidden="true"
          />

          {/* Modale avec animation de glissement */}
          <div
            ref={modalRef}
            className={`fixed overflow-auto right-0 top-0 h-full w-full max-w-3xl bg-white shadow-2xl transform transition-transform duration-300 ease-out border-l-8 ${getCss(
              baseSideModalProperties.css,
            )}`}
            style={{
              animation: isBaseSideModalOpen
                ? 'slideInRight 0.3s ease-out'
                : 'slideOutRight 0.3s ease-out',
            }}
            onKeyDown={handleKeyDown}
          >
            {/* Header de la modale */}
            <div className="flex flex-col items-center justify-between px-6 py-4 border-b border-gray-200">
              <div className="flex w-full justify-end">
                <button
                  onClick={closeModal}
                  className="flex items-center space-x-2 py-1 px-2 hover:bg-gray-200 rounded-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  aria-labelledby="close-side-modal-text"
                >
                  <span
                    className="mb-0.5"
                    id="close-side-modal-text text-dsfr-primary-500"
                  >
                    {intl.formatMessage(messages.close)}
                  </span>
                  <CloseIcon className="fill-primary700" />
                </button>
              </div>
              <div className="flex w-full space-x-4 items-center">
                <ArrowRightIcon className="h-12 w-12" />
                <h4 className="text-2xl font-medium">
                  {baseSideModalProperties.title}
                </h4>
              </div>
            </div>
            <div className="px-6 py-4">{baseSideModalProperties.content}</div>
          </div>
        </div>
      )}
    </>
  );
};
