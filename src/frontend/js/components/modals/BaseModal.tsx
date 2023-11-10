import React, { PropsWithChildren, ReactNode, useEffect } from 'react';
import { useClickOutside } from '../../utils/useClickOutside';
import { defineMessages, FormattedMessage } from 'react-intl';

import { IconTextButton } from '../buttons/IconTextButton';
import { EscKeyCodes } from '../../const';

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

  useEffect(() => {
    if (isModalOpen) {
      (ref.current! as HTMLElement).focus();
    }
  }, [isModalOpen]);

  return (
    <div
      className={`${
        isModalOpen ? 'fixed' : 'hidden'
      } bg-gray-transparent-70p inset-0 z-19 flex justify-center items-center`}
      style={{ margin: 0 }}
    >
      <div
        ref={ref}
        tabIndex={-1}
        className={`${
          isModalOpen ? 'fixed' : 'hidden'
        } z-20 flex flex-col w-full max-w-480 overflow-hidden rounded-sm bg-white h-560 shadow-2xl`}
        style={{
          margin: 0,
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      >
        <div
          className={`flex w-full items-center justify-center sticky top-0 z-20 ${title.css} p-2`}
        >
          {title.text}
        </div>
        <div className="flex flex-col flex-grow p-4 space-y-6">
          {children}
          <div className="flex w-full justify-between z-20 bg-white">
            <button className="hover:underline" onClick={() => closeModal()}>
              <FormattedMessage {...messages.cancel} />
            </button>
            <IconTextButton
              otherClasses={button.css}
              type={'submit'}
              icon={button.icon}
              onClick={() => submitForm()}
            >
              {button.text}
            </IconTextButton>
          </div>
        </div>
      </div>
    </div>
  );
};
