import React, { useState } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { useUIDSeed } from 'react-uid';
import { ModalContainer, ModalSize } from '../../modals/ModalContainer';

const messages = defineMessages({
  modalMessage: {
    defaultMessage:
      'This new title is only visible to members of the DAJ. Applicants will continue to see the title they entered in the form.',
    description: 'Message warning user why close referral.',
    id: 'components.ReferralDetail.ChangeModalTitle.modalMessage',
  },
  close: {
    defaultMessage: 'Close',
    description: 'Ok button to  the modal.',
    id: 'components.ReferralDetail.ChangeModalTitle.Close',
  },
});

interface ChangeTitleModalProps {
  isCloseChangeTitleModalOpen: boolean;
  setIsCloseChangeTitleModalOpen: (isOpen: boolean) => void;
}

export const ChangeTitleModal: React.FC<ChangeTitleModalProps> = ({
  isCloseChangeTitleModalOpen,
  setIsCloseChangeTitleModalOpen,
}) => {
  const seed = useUIDSeed();

  return (
    <ModalContainer
      isModalOpen={isCloseChangeTitleModalOpen}
      setModalOpen={setIsCloseChangeTitleModalOpen}
      size={ModalSize.L}
    >
      <div className="p-8 space-y-4">
        <p className="text-x2" id={seed('change-title-message')}>
          <FormattedMessage
            {...messages.modalMessage}
            values={{
              linebreak: <br />,
            }}
          />
        </p>
        <div className="flex justify-center p-8 space-x-4">
          <button
            className="btn btn-outline"
            onClick={() => {
              setIsCloseChangeTitleModalOpen(false);
            }}
          >
            <FormattedMessage {...messages.close} />
          </button>
        </div>
      </div>
    </ModalContainer>
  );
};
