import React, { useContext, useEffect } from 'react';
import { useClickOutside } from '../../utils/useClickOutside';
import { defineMessages, FormattedMessage } from 'react-intl';
import { VersionContext } from '../../data/providers/VersionProvider';
import { IconTextButton } from '../buttons/IconTextButton';
import { SendIcon } from '../Icons';

const messages = defineMessages({
  mainTitle: {
    defaultMessage: 'Warning',
    description: 'Modal main title',
    id: 'components.WarningModal.mainTitle',
  },
  cancel: {
    defaultMessage: 'Cancel',
    description: 'Cancel button text',
    id: 'components.WarningModal.cancel',
  },
  continue: {
    defaultMessage: 'Continue',
    description: 'Continue button text',
    id: 'components.WarningModal.continue',
  },
  contentText: {
    defaultMessage:
      'You are about to send a reply for which certain modifications have been requested. Are you sure to continue?',
    description: 'Content text',
    id: 'components.WarningModal.contentText',
  },
});

const EscKeyCodes = ['Escape', 'Esc', 27];

export const WarningModal = ({
  onContinue,
  onCancel,
  isModalOpen,
}: {
  isModalOpen: boolean;
  onContinue: Function;
  onCancel: Function;
}) => {
  const { version } = useContext(VersionContext);

  const cancelAction = () => {
    onCancel();
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    const key = event.key || event.keyCode;

    if (EscKeyCodes.includes(key)) {
      event.preventDefault();
      cancelAction();
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
      cancelAction();
    },
  });

  return (
    <>
      {version && (
        <div
          className={`${
            isModalOpen ? 'fixed' : 'hidden'
          } bg-gray-transparent-70p inset-0 z-19 flex justify-center items-center`}
          style={{ margin: 0 }}
        >
          <div
            ref={ref}
            className={`${
              isModalOpen ? 'fixed' : 'hidden'
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
              <span className="text-danger-700">
                <FormattedMessage {...messages.contentText} />
              </span>
              <div className="flex w-full justify-between z-20 bg-white">
                <button className="hover:underline" onClick={() => onCancel()}>
                  <FormattedMessage {...messages.cancel} />
                </button>
                <IconTextButton
                  otherClasses="btn-primary"
                  icon={<SendIcon className="fill-white" />}
                  onClick={() => onContinue()}
                >
                  <FormattedMessage {...messages.continue} />
                </IconTextButton>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
