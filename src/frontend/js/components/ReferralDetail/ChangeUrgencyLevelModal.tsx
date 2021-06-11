import React, { useState, useEffect } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import ReactModal from 'react-modal';
import { useUIDSeed } from 'react-uid';

import { GenericErrorMessage } from 'components/GenericErrorMessage';
import { Spinner } from 'components/Spinner';
import { useReferralAction, useReferralUrgencies } from 'data';
import { Referral } from 'types';

const messages = defineMessages({
  cancel: {
    defaultMessage: 'Cancel',
    description:
      "Button to cancel changing a referral's urgency level and close the modal.",
    id: 'components.ReferralDetail.ChangeUrgencyLevelModal.cancel',
  },
  formErrorMandatory: {
    defaultMessage: 'Urgency level changes require an explanation.',
    description:
      'Error message when the user changes the urgency level without providing an explanation.',
    id: 'components.ReferralDetail.ChangeUrgencyLevelModal.formErrorMandatory',
  },
  formErrorServer: {
    defaultMessage:
      'There was an error while updating the referral. Please retry later or contact an administrator.',
    description:
      'Error message when the urgency level change in the modal fails for an unknown reason.',
    id: 'components.ReferralDetail.ChangeUrgencyLevelModal.formErrorServer',
  },
  formLabelExplanation: {
    defaultMessage: 'Change explanation',
    description:
      'Label for the change explanation field in the modal to change urgency levels.',
    id:
      'components.ReferralDetail.ChangeUrgencyLevelModal.formLabelExplanation',
  },
  formLabelUrgencylevel: {
    defaultMessage: 'Expected response time',
    description:
      'Label for the urgency field in the modal to change urgency levels.',
    id:
      'components.ReferralDetail.ChangeUrgencyLevelModal.formLabelUrgencylevel',
  },
  loadingUrgencyLevels: {
    defaultMessage: 'Loading urgency levels...',
    description:
      'Accessible text for the spinner while loading urgency levels in the change urgency levels modal.',
    id:
      'components.ReferralDetail.ChangeUrgencyLevelModal.loadingUrgencyLevels',
  },
  modalTitle: {
    defaultMessage: "Change the referral's urgency level.",
    description:
      'Title for the modal that allows unit members to change urgency levels.',
    id: 'components.ReferralDetail.ChangeUrgencyLevelModal.modalTitle',
  },
  update: {
    defaultMessage: 'Update referral',
    description:
      'Button to perform the urgency level change in the relevant modal.',
    id: 'components.ReferralDetail.ChangeUrgencyLevelModal.update',
  },
});

// The `setAppElement` needs to happen in proper code but breaks our testing environment.
// This workaround is not satisfactory but it allows us to both test <SendAnswerModal />
// and avoid compromising accessibility in real-world use.
const isTestEnv = typeof jest !== 'undefined';
if (!isTestEnv) {
  ReactModal.setAppElement('#app-root');
}

interface ChangeUrgencyLevelModalProps {
  isChangeUrgencyLevelModalOpen: boolean;
  setIsChangeUrgencyLevelModalOpen: (isOpen: boolean) => void;
  referral: Referral;
}

export const ChangeUrgencyLevelModal: React.FC<ChangeUrgencyLevelModalProps> = ({
  isChangeUrgencyLevelModalOpen,
  setIsChangeUrgencyLevelModalOpen,
  referral,
}) => {
  const seed = useUIDSeed();
  const mutation = useReferralAction();

  // Keep track of the first form submission to show validation errors
  const [isFormCleaned, setIsFormCleaned] = useState(false);

  const [newUrgencyLevelId, setNewUrgencyLevelId] = useState(
    referral.urgency_level.id,
  );
  const [urgencyChangeExplanation, setUrgencyChangeExplanation] = useState('');

  useEffect(() => {
    if (mutation.isSuccess) {
      setIsChangeUrgencyLevelModalOpen(false);
      setIsFormCleaned(false);
      setUrgencyChangeExplanation('');
    }
  }, [mutation.status]);

  const { status, data } = useReferralUrgencies();
  switch (status) {
    case 'error':
      return <GenericErrorMessage />;

    case 'idle':
    case 'loading':
      return (
        <Spinner size="small">
          <FormattedMessage {...messages.loadingUrgencyLevels} />
        </Spinner>
      );
  }

  return (
    <ReactModal
      ariaHideApp={!isTestEnv}
      isOpen={isChangeUrgencyLevelModalOpen}
      onRequestClose={() => setIsChangeUrgencyLevelModalOpen(false)}
      style={{
        content: {
          maxWidth: '32rem',
          padding: '0',
          position: 'static',
        },
        overlay: {
          alignItems: 'center',
          backgroundColor: 'rgba(0,0,0,0.75)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        },
      }}
    >
      <form
        aria-labelledby={seed('change-urgency-level-form')}
        onSubmit={(e) => {
          e.preventDefault();
          setIsFormCleaned(true);
          if (urgencyChangeExplanation.length > 0) {
            mutation.mutate({
              action: 'change_urgencylevel',
              payload: {
                urgencylevel: newUrgencyLevelId,
                urgencylevel_explanation: urgencyChangeExplanation,
              },
              referral,
            });
          }
        }}
      >
        <div className="p-8 space-y-4">
          <h2 className="text-xl" id={seed('change-urgency-level-form')}>
            <FormattedMessage {...messages.modalTitle} />
          </h2>

          <div className="space-y-2">
            <label
              htmlFor={seed('referral-urgency-new-level')}
              className="mb-1 font-semibold"
            >
              <FormattedMessage {...messages.formLabelUrgencylevel} />
            </label>

            <select
              className="form-control"
              id={seed('referral-urgency-new-level')}
              name="urgency"
              onChange={(e) => {
                setNewUrgencyLevelId(Number(e.target.value));
              }}
            >
              {data!.results
                .sort((urgencyA, _) => (urgencyA.is_default ? -1 : 1))
                .map((urgency) => (
                  <option key={urgency.id} value={urgency.id}>
                    {urgency.name}
                  </option>
                ))}
            </select>
          </div>
          <div className="space-y-2">
            <label
              htmlFor={seed('referral-urgency-change-explanation')}
              className="mb-1 font-semibold"
            >
              <FormattedMessage {...messages.formLabelExplanation} />
            </label>
            <textarea
              className="form-control"
              cols={40}
              rows={4}
              id={seed('referral-urgency-change-explanation')}
              name="urgency-explanation"
              value={urgencyChangeExplanation}
              onChange={(e) => {
                setUrgencyChangeExplanation(e.target.value);
              }}
            />
            {isFormCleaned &&
            (urgencyChangeExplanation! === undefined ||
              urgencyChangeExplanation.length === 0) ? (
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
              setUrgencyChangeExplanation('');
              setIsChangeUrgencyLevelModalOpen(false);
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
    </ReactModal>
  );
};
