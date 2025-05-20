import React, { useContext } from 'react';
import { Referral, ReferralLite } from '../../types';
import { defineMessages, FormattedMessage } from 'react-intl';
import { CheckIcon } from '../Icons';
import { appData } from '../../appData';
import { useMutation } from 'react-query';
import { ReferralContext } from '../../data/providers/ReferralProvider';

const messages = defineMessages({
  confirmSplitReferral: {
    defaultMessage: 'Confirm',
    description: 'Confirm sub referral button',
    id: 'components.ConfirmSplitButton.confirmSplitReferral',
  },
});

export const ConfirmSplitButton = () => {
  const { referral, setReferral } = useContext(ReferralContext);

  const confirmSplitReferralAction = async () => {
    const response = await fetch(
      `/api/referrals/${referral!.id}/confirm_split/`,
      {
        headers: {
          Authorization: `Token ${appData.token}`,
          'Content-Type': 'application/json',
        },
        method: 'POST',
      },
    );

    if (!response.ok) {
      throw new Error(
        `Failed to confirm split referral API for referral ${referral!.id}`,
      );
    }
    return await response.json();
  };

  const mutation = useMutation(() => confirmSplitReferralAction(), {
    onSuccess: (referral: Referral) => {
      setReferral(referral);
    },
    onError: (error) => {
      console.log(error);
    },
  });

  return (
    <button
      className="btn btn-primary"
      onClick={(e) => {
        e.stopPropagation();
        mutation.mutate();
      }}
    >
      <div className="flex relative w-full space-x-1 items-center">
        <CheckIcon className="fill-white" />
        <span
          className={`text-sm ${mutation.isLoading ? 'text-transparent' : ''}`}
        >
          <FormattedMessage {...messages.confirmSplitReferral} />
        </span>
      </div>
    </button>
  );
};
