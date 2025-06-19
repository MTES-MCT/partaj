import React from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { SplitIcon } from '../Icons';
import { appData } from '../../appData';
import { useMutation } from 'react-query';
import { Spinner } from '../Spinner';
import * as Sentry from '@sentry/react';

const messages = defineMessages({
  splitReferral: {
    defaultMessage: 'Split referral',
    description: 'Split referral text button',
    id: 'components.SplitReferralButton.splitReferral',
  },
});

export const SplitReferralButton = ({ referralId }: { referralId: string }) => {
  const splitReferralAction = async () => {
    const response = await fetch(`/api/referrals/${referralId}/split/`, {
      headers: {
        Authorization: `Token ${appData.token}`,
        'Content-Type': 'application/json',
      },
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error(
        `Failed to call split referral API for referral ${referralId} and user`,
      );
    }
    return await response.json();
  };

  const mutation = useMutation(() => splitReferralAction(), {
    onSuccess: (response: { secondary_referral: string }) => {
      window.location.assign(
        `/app/dashboard/referral-detail/${response.secondary_referral}/content/`,
      );
    },
    onError: (error) => {
      Sentry.captureException(error);
    },
  });

  return (
    <button
      className="btn btn-tertiary space-x-2"
      aria-disabled={mutation.isLoading}
      disabled={mutation.isLoading}
      onClick={(e) => {
        e.stopPropagation();
        mutation.mutate();
      }}
    >
      <div className="flex relative w-full space-x-2 items-center">
        <SplitIcon
          className={`w-5 h-5 rotate-90 ${
            mutation.isLoading ? 'fill-transparent' : ''
          }`}
        />
        <span
          className={`text-sm mb-0.5 ${
            mutation.isLoading ? 'text-transparent' : ''
          }`}
        >
          <FormattedMessage {...messages.splitReferral} />
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
