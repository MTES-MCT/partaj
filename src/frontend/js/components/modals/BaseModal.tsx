import React, { PropsWithChildren, ReactNode, useEffect, useRef } from 'react';
import { useClickOutside } from '../../utils/useClickOutside';
import { defineMessages, FormattedMessage } from 'react-intl';

import { IconTextButton } from '../buttons/IconTextButton';
import { EscKeyCodes } from '../../const';
import { useUIDSeed } from 'react-uid';

const messages = defineMessages({
  cancel: {
    defaultMessage: 'Cancel',
    description: 'Cancel button text',
    id: 'components.BaseModal.cancel',
  },
});

export const BaseModal = ({
  isModalOpen,
  onCloseModal,
  onSubmit,
  title,
  button,
  children,
}: PropsWithChildren<{
  isModalOpen: boolean;
  onCloseModal: Function;
  title: {
    text: string;
    css: string;
  };
  button: {
    text: string;
    css: string;
    icon: ReactNode;
  };
  onSubmit: Function;
}>) => {
  const seed = useUIDSeed();

  const closeModal = () => {
    onCloseModal();
  };

  const submitForm = () => {
    onSubmit();
    closeModal();
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    const key = event.key || event.keyCode;

    if (EscKeyCodes.includes(key)) {
      event.preventDefault();
      closeModal();
    }
  };

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown, false);

    return () => {
      document.removeEventListener('keydown', handleKeyDown, false);
    };
  }, [handleKeyDown]);

  const { ref } = useClickOutside({
    onClick: () => {
      closeModal();
    },
  });

  const dialogRef = useRef<any>(null);

  useEffect(() => {
    const modalElement = dialogRef.current;

    if (modalElement) {
      if (isModalOpen) {
        modalElement.showModal();
      } else {
        modalElement.close();
      }
    }
  }, [isModalOpen]);

  return (
    <dialog
      aria-modal="true"
      tabIndex={-1}
      ref={dialogRef}
      aria-labelledby="modal-title"
      className="max-w-480 max-h-4/5 rounded-sm bg-white shadow-2xl"
    >
      <div ref={ref}>
        <div
          id={seed('modal-title')}
          className={`flex w-full items-center justify-center sticky top-0 ${title.css} p-2`}
        >
          {title.text}
        </div>

        <div className="flex flex-col flex-grow p-4 space-y-6">
          {children}
          <div className="sticky bottom-0 flex w-full justify-between bg-white">
            <button className="hover:underline" onClick={() => closeModal()}>
              <FormattedMessage {...messages.cancel} />
            </button>
            <IconTextButton
              otherClasses={button.css}
              type={'submit'}
              icon={button.icon}
              onClick={() => submitForm()}
              text={button.text}
            />
          </div>
        </div>
      </div>
    </dialog>
  );
};
