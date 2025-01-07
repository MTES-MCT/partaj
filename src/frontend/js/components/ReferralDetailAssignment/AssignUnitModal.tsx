import React, { useContext, useEffect, useState } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { useUIDSeed } from 'react-uid';

import { appData } from 'appData';
import { useReferralAction } from 'data';
import { ReferralContext } from 'data/providers/ReferralProvider';
import { Referral, Unit } from 'types';
import { ModalContainer, ModalSize } from '../modals/ModalContainer';
import { Spinner } from '../Spinner';

const messages = defineMessages({
  cancel: {
    defaultMessage: 'Cancel',
    description: 'Button to cancel assigning a unit and close the modal.',
    id: 'components.ReferralDetail.AssignUnitModal.cancel',
  },
  formErrorMandatory: {
    defaultMessage: 'An explanation is required when assigning a unit.',
    description:
      'Error message when the user assign a unit without providing an explanation.',
    id: 'components.ReferralDetail.AssignUnitModal.formErrorMandatory',
  },
  formErrorServer: {
    defaultMessage:
      'There was an error while updating the referral. Please retry later or contact an administrator at {mail}.',
    description:
      'Error message when the close referral in the modal fails for an unknown reason.',
    id: 'components.ReferralDetail.AssignUnitModal.formErrorServer',
  },
  formLabelExplanation: {
    defaultMessage: 'Assignment explanation',
    description:
      'Label for the assignment explanation field in the modal to assign a new unit to a referral.',
    id: 'components.ReferralDetail.AssignUnitModal.formLabelExplanation',
  },
  modalTitle: {
    defaultMessage: 'New unit assignment',
    description: 'Title for the modal to assign a new unit to a referral.',
    id: 'components.ReferralDetail.AssignUnitModal.modalTitle',
  },
  modalMessage: {
    defaultMessage:
      'This action  will inform the unit <b>{ name }</b> of assigning this referral. You can provide an explanation to other stakeholders using the explanation field.',
    description: 'Message warning user why close referral.',
    id: 'components.ReferralDetail.AssignUnitModal.modalMessage',
  },
  update: {
    defaultMessage: 'Assign unit',
    description: 'Button to assign the unit in the relevant modal.',
    id: 'components.ReferralDetail.AssignUnitModal.update',
  },
});

interface AssignUnitModalProps {
  isAssignUnitModalOpen: boolean;
  setIsAssignUnitModalOpen: (isOpen: boolean) => void;
  referral: Referral;
  unit: Unit;
  setIsKeepDropdownMenu: (isOpen: boolean) => void;
}

export const AssignUnitModal: React.FC<AssignUnitModalProps> = ({
  isAssignUnitModalOpen,
  setIsAssignUnitModalOpen,
  referral,
  unit,
  setIsKeepDropdownMenu,
}) => {
  const seed = useUIDSeed();
  const { refetch } = useContext(ReferralContext);
  const mutation = useReferralAction({ onSuccess: () => refetch() });

  // Keep track of the first form submission to show validation errors
  const [isFormCleaned, setIsFormCleaned] = useState(false);
  const [AssigUnitExplanation, setAssigUnitExplanation] = useState('');

  useEffect(() => {
    if (mutation.isSuccess) {
      setIsAssignUnitModalOpen(false);
      setIsFormCleaned(false);
      setAssigUnitExplanation('');
    }
  }, [mutation.status]);

  return (
    <ModalContainer
      size={ModalSize.L}
      isModalOpen={isAssignUnitModalOpen}
      setModalOpen={setIsAssignUnitModalOpen}
    >
      <form
        aria-labelledby={seed('assign-unit-form')}
        onSubmit={(e) => {
          e.preventDefault();
          setIsFormCleaned(true);
          if (AssigUnitExplanation.length > 0) {
            mutation.mutate({
              action: 'assign_unit',
              payload: {
                unit: unit.id,
                assignunit_explanation: AssigUnitExplanation,
              },
              referral,
            });
            setIsKeepDropdownMenu(false);
          }
        }}
      >
        <div className="p-8 space-y-4">
          <h2 className="text-xl" id={seed('assign-unit-form')}>
            <FormattedMessage {...messages.modalTitle} />
          </h2>

          <p className="text-x2" id={seed('assign-unit-message')}>
            <FormattedMessage
              {...messages.modalMessage}
              values={{
                b: (chunks: any) => <strong>{chunks}</strong>,
                name: unit.name,
              }}
            />
          </p>

          <div className="space-y-2">
            <label htmlFor={seed('assign-unit-explanation')} className="mb-1">
              <FormattedMessage {...messages.formLabelExplanation} />
            </label>
            <textarea
              className="form-control"
              cols={40}
              rows={4}
              id={seed('assign-unit-explanation')}
              name="assign-unit-explanation"
              value={AssigUnitExplanation}
              onChange={(e) => {
                setAssigUnitExplanation(e.target.value);
              }}
            />
            {isFormCleaned &&
            (AssigUnitExplanation! === undefined ||
              AssigUnitExplanation.length === 0) ? (
              <div className="mt-4 text-danger-600">
                <FormattedMessage {...messages.formErrorMandatory} />
              </div>
            ) : null}
          </div>

          {mutation.isError ? (
            <div className="text-danger-600">
              <FormattedMessage
                {...messages.formErrorServer}
                values={{ mail: appData.contact_email }}
              />
            </div>
          ) : null}
        </div>
        <div className="flex justify-end bg-gray-300 p-8 space-x-4">
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => {
              setIsKeepDropdownMenu(false);
              setAssigUnitExplanation('');
              setIsAssignUnitModalOpen(false);
            }}
          >
            <FormattedMessage {...messages.cancel} />
          </button>

          <button
            type="submit"
            className={`relative btn btn-primary ${
              mutation.isLoading ? 'cursor-wait' : ''
            }`}
            aria-busy={mutation.isLoading}
            aria-disabled={mutation.isLoading}
          >
            {mutation.isLoading ? (
              <span aria-hidden="true">
                <span className="opacity-0">
                  <FormattedMessage {...messages.update} />
                </span>
                <Spinner
                  size="small"
                  color="white"
                  className="absolute inset-0"
                >
                  {/* No children with loading text as the spinner is aria-hidden (handled by aria-busy) */}
                </Spinner>
              </span>
            ) : (
              <FormattedMessage {...messages.update} />
            )}
          </button>
        </div>
      </form>
    </ModalContainer>
  );
};
