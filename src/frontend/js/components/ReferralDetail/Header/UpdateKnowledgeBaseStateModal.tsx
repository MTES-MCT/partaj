import React from 'react';

import { Referral } from 'types';
import { ModalContainer, ModalSize } from '../../modals/ModalContainer';
import { defineMessages, FormattedMessage } from 'react-intl';

const messages = defineMessages({
  addReferralTitle: {
    defaultMessage: 'Add this referral to the knowledge base',
    description:
      'Title for the modal to add a published referral to the knowledge base',
    id:
      'components.ReferralDetail.UpdateKnowledgeBaseStateModal.addReferralTitle',
  },
  removeReferralTitle: {
    defaultMessage: 'Remove this referral from the knowledge base',
    description:
      'Title for the modal to remove a published referral from the knowledge base',
    id:
      'components.ReferralDetail.UpdateKnowledgeBaseStateModal.removeReferralTitle',
  },
  addReferralDescription: {
    defaultMessage:
      'This referral will be added to the knowledge base, are you sure? This action will take effect by tomorrow.',
    description:
      'Description for the modal to add a published referral to the knowledge base',
    id:
      'components.ReferralDetail.UpdateKnowledgeBaseStateModal.addReferralDescription',
  },
  removeReferralDescription: {
    defaultMessage:
      'This referral will be removed from the knowledge base, are you sure? This action will take effect by tomorrow.',
    description:
      'Description for the modal to remove a published referral from the knowledge base',
    id:
      'components.ReferralDetail.UpdateKnowledgeBaseStateModal.removeReferralDescription',
  },
  addReferralButton: {
    defaultMessage: 'Send to knowledge base',
    description:
      'Button for the modal to add a published referral to the knowledge base',
    id:
      'components.ReferralDetail.UpdateKnowledgeBaseStateModal.addReferralButton',
  },
  removeReferralButton: {
    defaultMessage: 'Remove from knowledge base',
    description:
      'Button for the modal to remove a published referral from the knowledge base',
    id:
      'components.ReferralDetail.UpdateKnowledgeBaseStateModal.removeReferralButton',
  },
});

interface UpdateKnowledgeBaseStateModalProps {
  isOpen: boolean;
  setOpen: (isOpen: boolean) => void;
  updateSendToKnowledgeBaseState: () => void;
  referral: Referral;
}

export const UpdateKnowledgeBaseStateModal: React.FC<UpdateKnowledgeBaseStateModalProps> = ({
  isOpen,
  setOpen,
  updateSendToKnowledgeBaseState,
  referral,
}) => {
  const currentSendToKnowledgeBaseState = !!referral?.send_to_knowledge_base;

  return (
    <ModalContainer
      isModalOpen={isOpen}
      setModalOpen={setOpen}
      size={ModalSize.L}
      withCloseButton
    >
      <div className="p-8 space-y-4">
        <h2 className="text-xl">
          {currentSendToKnowledgeBaseState ? (
            <FormattedMessage {...messages.removeReferralTitle} />
          ) : (
            <FormattedMessage {...messages.addReferralTitle} />
          )}
        </h2>
        <p className="text-x2 whitespace-pre-line">
          {currentSendToKnowledgeBaseState ? (
            <FormattedMessage {...messages.removeReferralDescription} />
          ) : (
            <FormattedMessage {...messages.addReferralDescription} />
          )}
        </p>
      </div>
      <div className="flex justify-end bg-gray-300 p-8 space-x-4">
        <button
          onClick={(e) => {
            e.stopPropagation();
            updateSendToKnowledgeBaseState();
            setOpen(false);
          }}
          className="relative btn btn-primary"
        >
          {currentSendToKnowledgeBaseState ? (
            <FormattedMessage {...messages.removeReferralButton} />
          ) : (
            <FormattedMessage {...messages.addReferralButton} />
          )}
        </button>
      </div>
    </ModalContainer>
  );
};
