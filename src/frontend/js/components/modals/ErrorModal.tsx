import React, { useContext, useEffect } from 'react';
import { useClickOutside } from '../../utils/useClickOutside';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { IconTextButton } from '../buttons/IconTextButton';
import { CheckIcon } from '../Icons';
import { EscKeyCodes } from '../../const';
import { ErrorModalContext } from '../../data/providers/ErrorModalProvider';

const messages = defineMessages({
  mainTitle: {
    defaultMessage: 'Error',
    description: 'Modal main title',
    id: 'components.ErrorModal.mainTitle',
  },
  confirm: {
    defaultMessage: 'OK',
    description: 'Confirm button text',
    id: 'components.ErrorModal.continue',
  },
});

export const ErrorModal = ({ onConfirm }: { onConfirm?: Function }) => {
  const intl = useIntl();

  const { closeErrorModal, errorMessage, isErrorModalOpen } = useContext(
    ErrorModalContext,
  );

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
      } bg-gray-transparent-70p inset-0 z-19 flex justify-center items-center`}
      style={{ margin: 0 }}
    >
      <div
        ref={ref}
        className={`${
          isErrorModalOpen ? 'fixed' : 'hidden'
        } z-20 flex flex-col w-full max-w-320 overflow-hidden rounded-sm bg-white shadow-2xl`}
        style={{
          margin: 0,
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      >
        <div className="flex w-full items-center justify-center sticky top-0 z-20 bg-primary-600 text-white px-2 py-1">
          <FormattedMessage {...messages.mainTitle} />
        </div>
        <div className="flex flex-col flex-grow p-2 space-y-6">
          <span className="text-danger-700">{errorMessage}</span>
          <div className="flex w-full justify-center z-20 bg-white">
            <IconTextButton
              otherClasses="btn-primary"
              icon={<CheckIcon className="fill-white" />}
              onClick={() => {
                closeErrorModal();
                onConfirm && onConfirm();
              }}
              text={intl.formatMessage(messages.confirm)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
