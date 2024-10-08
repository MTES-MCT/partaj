import React, { useContext, useEffect } from 'react';
import { useClickOutside } from '../../utils/useClickOutside';
import { defineMessages, useIntl } from 'react-intl';
import { IconTextButton } from '../buttons/IconTextButton';
import { CloseIcon } from '../Icons';
import { EscKeyCodes } from '../../const';
import { ErrorModalContext } from '../../data/providers/ErrorModalProvider';
import { Title, TitleType } from '../text/Title';

const messages = defineMessages({
  close: {
    defaultMessage: 'Close',
    description: 'Confirm button text',
    id: 'components.ErrorModal.close',
  },
});

export const ErrorModal = () => {
  const intl = useIntl();

  const {
    closeErrorModal,
    errorMessage,
    errorTitle,
    isErrorModalOpen,
  } = useContext(ErrorModalContext);

  const handleKeyDown = (event: KeyboardEvent) => {
    const key = event.key || event.keyCode;

    if (EscKeyCodes.includes(key)) {
      event.preventDefault();
      closeErrorModal();
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
      closeErrorModal();
    },
  });

  return (
    <div
      className={`${
        isErrorModalOpen ? 'fixed' : 'hidden'
      } bg-grey-transparent-64p inset-0 z-19 flex justify-center items-center`}
      style={{ margin: 0 }}
    >
      <div
        ref={ref}
        className={`${
          isErrorModalOpen ? 'fixed' : 'hidden'
        } z-20 flex flex-col w-full max-w-480 overflow-hidden bg-white p-2`}
        style={{
          margin: 0,
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      >
        <div className="flex w-full justify-end">
          <IconTextButton
            otherClasses="button-white"
            icon={<CloseIcon className="fill-primary700" />}
            onClick={() => {
              closeErrorModal();
            }}
            text={intl.formatMessage(messages.close)}
          />
        </div>
        <Title type={TitleType.H4}>{errorTitle}</Title>
        <div className="flex flex-col flex-grow p-2 space-y-6 border-l-2 border-dsfr-danger-500">
          {errorMessage}
        </div>
      </div>
    </div>
  );
};
