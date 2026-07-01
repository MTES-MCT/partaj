import React from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { appData } from '../../appData';
import { useMutation } from '@tanstack/react-query';
import { Spinner } from '../Spinner';
import * as Sentry from '@sentry/react';

const messages = defineMessages({
  cancelSplitReferral: {
    defaultMessage: 'Confirm cancel',
    description: 'Cancel split referral text button',
    id: 'components.ConfirmCancelSplitButton.cancelSplitReferral',
  },
});

export const ConfirmCancelSplitButton = ({
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

  const mutation = useMutation({
    mutationFn: () => cancelSplitReferralAction(),
    onSuccess: (response) => {
      window.location.assign(`/app/dashboard`);
    },
    onError: (error) => {
      Sentry.captureException(error);
    },
  });

  return (
    <button
      className="btn btn-danger-primary"
      aria-disabled={mutation.isPending}
      disabled={mutation.isPending}
      onClick={(e) => {
        e.stopPropagation();
        mutation.mutate();
      }}
    >
      <div className="flex relative w-full items-center">
        <span
          className={`text-sm ${mutation.isPending ? 'text-transparent' : ''}`}
        >
          <FormattedMessage {...messages.cancelSplitReferral} />
        </span>
        {mutation.isPending && (
          <div className="absolute inset-0 flex items-center">
            <Spinner size="small" color="#8080D1" className="inset-0" />
          </div>
        )}
      </div>
    </button>
  );
};
