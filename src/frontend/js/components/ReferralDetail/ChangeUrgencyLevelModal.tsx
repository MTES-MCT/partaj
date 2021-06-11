import * as Sentry from '@sentry/react';
import { useMachine } from '@xstate/react';
import React from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import ReactModal from 'react-modal';
import { useQueryClient } from 'react-query';
import { useHistory, useRouteMatch } from 'react-router-dom';
import { Machine } from 'xstate';

import { appData } from 'appData';
import { nestedUrls } from 'components/ReferralDetail';
import { Spinner } from 'components/Spinner';
import { Referral, ReferralUrgency } from 'types';
import { getUserFullname } from 'utils/user';

import { useUIDSeed } from 'react-uid';
import { useReferralUrgencies } from 'data';
import {} from 'types';
import { UrgencyExplanationField } from 'components/ReferralForm/UrgencyExplanationField';
import { useState } from 'react';
import { useReferralAction } from 'data';

const messages = defineMessages({
  cancel: {
    defaultMessage: 'Cancel',
    description:
      'Button to cancel sending a referral answer and close the modal.',
    id: 'components.ReferralDetail.ChangeUrgencyLevelModal.cancel',
  },
  modalTitle: {
    defaultMessage: 'Referral #{ id }',
    description: 'Title for the modal to confirm sending a referral answer.',
    id: 'components.ReferralDetail.ChangeUrgencyLevelModal.modalTitle',
  },
  modalText: {
    defaultMessage: 'Change the urgency level.',
    description: 'change urgency level explantion text.',
    id: 'components.ReferralDetailAnswerDisplay.SendAnswerModal.modalText',
  },
  labelExplanation: {
    defaultMessage: 'Urgency explanation',
    description: 'Label for the urgency explanation field in the referral form',
    id: 'components.ReferralDetail.ChangeUrgencyLevelModal.label',
  },
  UrgencyLevel: {
    defaultMessage: 'Expected response time',
    description: 'Label for the urgency field in the ChangeUrgencyLevelModal',
    id: 'components.ReferralDetail.ChangeUrgencyLevelModal.description',
  },
  loadingUrgencies: {
    defaultMessage: 'Loading urgency options...',
    description:
      'Accessible text for the spinner while loading urgency options in the referral form',
    id: 'components.ReferralDetail.ChangeUrgencyLevelModal.loadingUrgencies',
  },
  change: {
    defaultMessage: 'change',
    description: 'Change the urgency level.',
    id: 'components.ReferralDetail.ChangeUrgencyLevelModal.change',
  },
  mandatory: {
    defaultMessage: 'The urgency level changing requires a justification.',
    description:
      'Error message when the user changes the  urgency level whitout justification ',
    id:
      'components.ReferralDetail.ChangeUrgencyLevelModal.explanation.mandatory',
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

  const [NewUrgencyLevelId, setNewUrgencyLevelId] = useState<number>();
  const [NewUrgencyExplanation, setNewUrgencyExplanation] = useState<string>();

  const { status, data } = useReferralUrgencies();
  if (status === 'loading') {
    return (
      <Spinner size="large">
        <FormattedMessage {...messages.loadingUrgencies} />
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
      <div className="p-4">
        <h2 className="text-xl">
          <FormattedMessage
            {...messages.modalTitle}
            values={{ id: referral.id }}
          />
        </h2>
      </div>
      <div className=" justify-end  p-2">
        <p>
          <FormattedMessage {...messages.modalText} />
        </p>
      </div>

      <div className="mb-8 pr-8 pl-8">
        <label
          htmlFor={seed('referral-urgency-description')}
          className="mb-1 font-semibold"
        >
          <FormattedMessage {...messages.UrgencyLevel} />
        </label>

        <select
          className="form-control"
          id={seed('referral-urgency-label')}
          name="urgency"
          aria-describedby={seed('referral-urgency-description')}
          value={referral!.urgency_level.id}
          onChange={(e) => {
            setNewUrgencyLevelId(
              data?.results.find(
                (urgency) => String(urgency.id) === String(e.target.value),
              )!.id,
            );
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
      <div className="mb-8 pr-8 pl-8">
        <label
          htmlFor={seed('referral-urgency-explanation-label')}
          className="mb-1 font-semibold"
        >
          <FormattedMessage {...messages.labelExplanation} />
        </label>
        <textarea
          className="form-control"
          cols={40}
          rows={4}
          id={seed('referral-urgency-explanation-label')}
          name="urgency-explanation"
          onChange={(e) => {
            setNewUrgencyExplanation(e.target.value);
          }}
        />
      </div>

      <div className="flex justify-end bg-gray-300 p-8 space-x-4">
        <button
          className="btn btn-outline"
          onClick={() => setIsChangeUrgencyLevelModalOpen(false)}
        >
          <FormattedMessage {...messages.cancel} />
        </button>
        <button
          className={`relative btn btn-primary `}
          onClick={() => {
            {
              mutation.mutate({
                action: 'change_urgencylevel',
                payload: {
                  urgencylevel: NewUrgencyLevelId!,
                  urgencylevel_explanation: NewUrgencyExplanation!,
                },
                referral,
              });
              setIsChangeUrgencyLevelModalOpen(false);
            }
          }}
        >
          <FormattedMessage {...messages.change} />
        </button>
      </div>
    </ReactModal>
  );
};
