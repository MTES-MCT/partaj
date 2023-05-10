import React, { useEffect, useState } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { useUIDSeed } from 'react-uid';
import { uniq } from 'lodash-es';

import { useReferralAction } from 'data';
import { useCurrentUser } from 'data/useCurrentUser';
import { hasMembership } from 'utils/user';
import { Referral } from 'types';
import { getLastItem } from 'utils/string';
import { ModalContainer, ModalSize } from '../../modals/ModalContainer';
import { Spinner } from '../../Spinner';

const messages = defineMessages({
  cancel: {
    defaultMessage: 'Cancel',
    description: 'Button to cancel closing a referral and close the modal.',
    id: 'components.ReferralDetail.CloseReferralModal.cancel',
  },
  formErrorMandatory: {
    defaultMessage: 'An explanation is required when closing a referral.',
    description:
      'Error message when the user closes the referral without providing an explanation.',
    id: 'components.ReferralDetail.CloseReferralModal.formErrorMandatory',
  },
  formErrorServer: {
    defaultMessage:
      'There was an error while updating the referral. Please retry later or contact an administrator.',
    description:
      'Error message when the close referral in the modal fails for an unknown reason.',
    id: 'components.ReferralDetail.CloseReferralModal.formErrorServer',
  },
  formLabelExplanation: {
    defaultMessage: 'Closure explanation',
    description:
      'Label for the change explanation field in the modal to close the referral.',
    id: 'components.ReferralDetail.CloseReferralModal.formLabelExplanation',
  },
  modalTitle: {
    defaultMessage: 'Close the referral',
    description:
      'Title for the modal that allows unit members to close the referral.',
    id: 'components.ReferralDetail.CloseReferralModal.modalTitle',
  },
  modalMessage: {
    defaultMessage:
      'This action will close the referral without an answer. You can provide an explanation to other stakeholders using the explanation field.',
    description: 'Message warning user why close referral.',
    id: 'components.ReferralDetail.CloseReferralModal.modalMessage',
  },
  modalMessageRequester: {
    defaultMessage:
      "This action will close the referral without receiving an answer. Once closed, you won't be able to reopen or edit it. Please provider an explanation, it will be sent to {units}",
    description:
      'Message specific to the requester warning him and asking why he wishes to close the referral',
    id: 'components.ReferralDetail.CloseReferralModal.modalMessageRequester',
  },
  update: {
    defaultMessage: 'Close referral',
    description: 'Button toclose the referral in the relevant modal.',
    id: 'components.ReferralDetail.CloseReferralModal.update',
  },
});

interface CloseReferralModalProps {
  isCloseReferralModalOpen: boolean;
  setIsCloseReferralModalOpen: (isOpen: boolean) => void;
  referral: Referral;
}

export const CloseReferralModal: React.FC<CloseReferralModalProps> = ({
  isCloseReferralModalOpen,
  setIsCloseReferralModalOpen,
  referral,
}) => {
  const seed = useUIDSeed();
  const mutation = useReferralAction();
  const { currentUser } = useCurrentUser();

  const isUserRequester = !hasMembership(currentUser);
  const modalMessage = isUserRequester
    ? messages.modalMessageRequester
    : messages.modalMessage;

  const unitsFullNames = isUserRequester
    ? referral.units.map((unit) => unit.name)
    : uniq(referral.users.map((user) => user.unit_name));

  const unitsNames = unitsFullNames
    .map((unit) => getLastItem(unit, '/'))
    .join(', ');

  // Keep track of the first form submission to show validation errors
  const [isFormCleaned, setIsFormCleaned] = useState(false);

  const [CloseReferralExplanation, setCloseReferralExplanation] = useState('');

  useEffect(() => {
    if (mutation.isSuccess) {
      setIsCloseReferralModalOpen(false);
      setIsFormCleaned(false);
      setCloseReferralExplanation('');
    }
  }, [mutation.status]);

  return (
    <ModalContainer
      isModalOpen={isCloseReferralModalOpen}
      setModalOpen={setIsCloseReferralModalOpen}
      size={ModalSize.L}
      withCloseButton
    >
      <form
        aria-labelledby={seed('close-referral-form')}
        onSubmit={(e) => {
          e.preventDefault();
          setIsFormCleaned(true);
          if (CloseReferralExplanation.length > 0) {
            mutation.mutate({
              action: 'close_referral',
              payload: {
                close_explanation: CloseReferralExplanation,
              },
              referral,
            });
          }
        }}
      >
        <div className="p-8 space-y-4">
          <h2 className="text-xl" id={seed('close-referral-form')}>
            <FormattedMessage {...messages.modalTitle} />
          </h2>

          <p className="text-x2" id={seed('close-referral-message')}>
            <FormattedMessage
              {...modalMessage}
              values={{
                units: unitsNames,
              }}
            />
          </p>

          <div className="space-y-2">
            <label
              htmlFor={seed('close-referral-explanation')}
              className="mb-1 font-semibold"
            >
              <FormattedMessage {...messages.formLabelExplanation} />
            </label>
            <textarea
              className="form-control"
              cols={40}
              rows={4}
              id={seed('close-referral-explanation')}
              name="urgency-explanation"
              value={CloseReferralExplanation}
              onChange={(e) => {
                setCloseReferralExplanation(e.target.value);
              }}
            />
            {isFormCleaned &&
            (CloseReferralExplanation! === undefined ||
              CloseReferralExplanation.length === 0) ? (
              <div className="mt-4 text-danger-600">
                <FormattedMessage {...messages.formErrorMandatory} />
              </div>
            ) : null}
          </div>

          {mutation.isError ? (
            <div className="text-danger-600">
              <FormattedMessage {...messages.formErrorServer} />
            </div>
          ) : null}
        </div>
        <div className="flex justify-end bg-gray-300 p-8 space-x-4">
          <button
            className="btn btn-outline"
            onClick={() => {
              setCloseReferralExplanation('');
              setIsCloseReferralModalOpen(false);
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
