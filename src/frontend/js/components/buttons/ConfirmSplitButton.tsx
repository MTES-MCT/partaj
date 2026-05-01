import React from 'react';
import { Referral } from '../../types';
import { defineMessages, FormattedMessage } from 'react-intl';
import { CheckIcon } from '../Icons';
import { appData } from '../../appData';
import { useMutation } from 'react-query';

const messages = defineMessages({
  confirmSplitReferral: {
    defaultMessage: 'Confirm',
    description: 'Confirm sub referral button',
    id: 'components.ConfirmSplitButton.confirmSplitReferral',
  },
});

export const ConfirmSplitButton = ({
  referralId,
  subTitle,
  subQuestion,
  onSuccess,
}: {
  subTitle: string;
  subQuestion: string;
  referralId: string;
  onSuccess: Function;
}) => {
  const confirmSplitReferralAction = async () => {
    const response = await fetch(
      `/api/referrals/${referralId}/confirm_split/`,
      {
        headers: {
          Authorization: `Token ${appData.token}`,
          'Content-Type': 'application/json',
        },
        method: 'POST',
        body: JSON.stringify({
          sub_title: subTitle,
          sub_question: subQuestion,
        }),
      },
    );

    if (!response.ok) {
      throw new Error(
        `Failed to confirm split referral API for referral ${referralId}`,
      );
    }
    return await response.json();
  };

  const mutation = useMutation(() => confirmSplitReferralAction(), {
    onSuccess: (referral: Referral) => {
      onSuccess(referral);
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
