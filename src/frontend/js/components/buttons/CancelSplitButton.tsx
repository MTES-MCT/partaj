import React, { useContext } from 'react';
import { ReferralLite } from '../../types';
import { defineMessages, FormattedMessage } from 'react-intl';
import { CrossIcon } from '../Icons';
import { ConfirmCancelSplitButton } from './ConfirmCancelSplitButton';
import { ApiModalContext } from '../../data/providers/ApiModalProvider';

const messages = defineMessages({
  cancelSplitReferral: {
    defaultMessage: 'Cancel split',
    description: 'Cancel split referral text button',
    id: 'components.ReferralHeader.cancelSplitReferral',
  },
});

export const CancelSplitButton = ({ referral }: { referral: ReferralLite }) => {
  const { openApiModal } = useContext(ApiModalContext);

  return (
    <button
      className="btn btn-danger-secondary"
      onClick={(e) => {
        openApiModal({
          title: 'Confirmation de la suppression',
          content: () =>
            `Souhaitez-vous vraiment annuler la scission ? Cette action entraînera la suppression définitive de la sous-saisine #${referral.id}.`,
          button: <ConfirmCancelSplitButton referralId={referral.id} />,
        });
      }}
    >
      <div className="flex relative w-full space-x-1 items-center">
        <CrossIcon />
        <span className="text-sm">
          <FormattedMessage {...messages.cancelSplitReferral} />
        </span>
      </div>
    </button>
  );
};
