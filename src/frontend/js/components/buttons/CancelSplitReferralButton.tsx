import React from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { CrossIcon } from '../Icons';
import { appData } from '../../appData';
import { useMutation } from 'react-query';
import { Spinner } from '../Spinner';

const messages = defineMessages({
  cancelSplitReferral: {
    defaultMessage: 'Cancel split',
    description: 'Cancel split referral text button',
    id: 'components.CancelSplitReferralButton.cancelSplitReferral',
  },
});

export const CancelSplitReferralButton = ({
  referralId,
}: {
  referralId: string;
}) => {
  const cancelSplitReferralAction = async () => {
    const response = await fetch(`/api/referrals/${referralId}/cancel_split/`, {
      headers: {
        Authorization: `Token ${appData.token}`,
        'Content-Type': 'application/json',
      },
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error(
        `Failed to cancel split referral API for referral ${referralId} and user`,
      );
    }
    return await response.json();
  };

  const mutation = useMutation(() => cancelSplitReferralAction(), {
    onSuccess: (response) => {
      console.log('HELLO');
      window.location.assign(`/app/dashboard`);
    },
    onError: (error) => {
      console.log(error);
    },
  });

  return (
    <button
      className="btn btn-danger-secondary"
      aria-disabled={mutation.isLoading}
      disabled={mutation.isLoading}
      onClick={(e) => {
        e.stopPropagation();
        mutation.mutate();
      }}
    >
      <div className="flex relative w-full space-x-1 items-center">
        <CrossIcon
          className={`${mutation.isLoading ? 'fill-transparent' : ''}`}
        />
        <span
          className={`text-sm ${mutation.isLoading ? 'text-transparent' : ''}`}
        >
          <FormattedMessage {...messages.cancelSplitReferral} />
        </span>
        {mutation.isLoading && (
          <div className="absolute inset-0 flex items-center">
            <Spinner size="small" color="#8080D1" className="inset-0" />
          </div>
        )}
      </div>
    </button>
  );
};
