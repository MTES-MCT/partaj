import React, { useContext, useEffect } from 'react';
import { useClickOutside } from '../../utils/useClickOutside';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { IconTextButton } from '../buttons/IconTextButton';
import { CloseIcon } from '../Icons';
import { EscKeyCodes } from '../../const';
import { Title, TitleType } from '../text/Title';
import { ApiModalContext } from '../../data/providers/ApiModalProvider';
import { Text } from '../text/Text';

const messages = defineMessages({
  close: {
    defaultMessage: 'Close',
    description: 'Confirm button text',
    id: 'components.ApiModal.close',
  },
  cancel: {
    defaultMessage: 'Cancel',
    description: 'Confirm button text',
    id: 'components.ApiModal.cancel',
  },
});

export const ApiModal = () => {
  const intl = useIntl();

  const { closeApiModal, apiModalProperties, isApiModalOpen } = useContext(
    ApiModalContext,
  );

  const handleKeyDown = (event: KeyboardEvent) => {
    const key = event.key || event.keyCode;

    if (EscKeyCodes.includes(key)) {
      event.preventDefault();
      closeApiModal();
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
      closeApiModal();
    },
  });

  return (
    <div
      className={`${
        isApiModalOpen ? 'fixed' : 'hidden'
      } bg-grey-transparent-64p inset-0 z-19 flex justify-center items-center`}
      style={{ margin: 0 }}
    >
      <div
        ref={ref}
        className={`${
          isApiModalOpen ? 'fixed' : 'hidden'
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
              closeApiModal();
            }}
            text={intl.formatMessage(messages.close)}
          />
        </div>
        <Title type={TitleType.H4}>{apiModalProperties.title}</Title>
        <div
          className={`flex flex-col flex-grow p-2 space-y-6 border-l-2 ${apiModalProperties.css}`}
        >
          {apiModalProperties.content}
        </div>
        <div className="flex justify-between pt-4">
          <button
            className="btn button-white"
            onClick={() => {
              closeApiModal();
            }}
          >
            <FormattedMessage {...messages.cancel} />
          </button>
          {apiModalProperties.button}
        </div>
      </div>
    </div>
  );
};
