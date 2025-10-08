import React from 'react';

import { Referral } from 'types';
import { ModalContainer, ModalSize } from '../../modals/ModalContainer';

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
  const sendToKnowledgeBase = !(
    referral.override_send_to_knowledge_base ??
    referral.default_send_to_knowledge_base
  );

  return (
    <ModalContainer
      isModalOpen={isOpen}
      setModalOpen={setOpen}
      size={ModalSize.L}
      withCloseButton
    >
      <div className="p-8 space-y-4">
        <h2 className="text-xl">
          {sendToKnowledgeBase
            ? 'Envoyer une saisine en base de connaissance'
            : 'Retirer une saisine de la base de connaissance'}
        </h2>
        <p className="text-x2 whitespace-pre-line">
          {sendToKnowledgeBase
            ? "Vous êtes sur le point d'envoyer cette saisine en base de connaissance, êtes vous sûr de votre choix ? Cette action sera effective à partir de demain."
            : 'Vous êtes sur le point de retirer cette saisine de la base de connaissance, êtes vous sûr de votre choix ? Cette action sera effective à partir de demain.'}
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
          {sendToKnowledgeBase ? 'Envoyer' : 'Retirer'}
        </button>
      </div>
    </ModalContainer>
  );
};
