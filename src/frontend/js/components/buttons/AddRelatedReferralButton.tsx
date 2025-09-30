import React, { useContext } from 'react';
import { AddIcon } from '../Icons';
import { appData } from '../../appData';
import { useMutation } from 'react-query';
import { Spinner } from '../Spinner';
import * as Sentry from '@sentry/react';
import { ReferralRelationship } from '../../types';

export const AddRelationShipButton = ({
  mainReferralId,
  relatedReferralId,
  setRelationships,
}: {
  mainReferralId: string;
  relatedReferralId: string;
  setRelationships: Function;
}) => {
  const addRelationshipAction = async () => {
    const response = await fetch(`/api/referralrelationships/`, {
      headers: {
        Authorization: `Token ${appData.token}`,
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify({
        main_referral: mainReferralId,
        related_referral: relatedReferralId,
      }),
    });

    if (!response.ok) {
      throw new Error(
        `Failed to call add relationship for referral ${mainReferralId}`,
      );
    }
    return await response.json();
  };

  const mutation = useMutation(() => addRelationshipAction(), {
    onSuccess: (response: ReferralRelationship) => {
      setRelationships((currentRelationships: ReferralRelationship[]) => {
        return [...currentRelationships, response];
      });
    },
    onError: (error) => {
      Sentry.captureException(error);
    },
  });

  return (
    <button
      className="btn btn-primary space-x-2"
      aria-disabled={mutation.isLoading}
      disabled={mutation.isLoading}
      onClick={(e) => {
        e.stopPropagation();
        mutation.mutate();
      }}
    >
      <div className="flex relative w-full space-x-2 items-center">
        <AddIcon
          className={`w-5 h-5 rotate-90 ${
            mutation.isLoading ? 'fill-transparent' : 'fill-white'
          }`}
        />
        <span
          className={`text-sm mb-0.5 ${
            mutation.isLoading ? 'text-transparent' : ''
          }`}
        >
          Lier
        </span>
        {mutation.isLoading && (
          <div className="absolute inset-0 flex items-center">
            <Spinner size="small" color="#FFFFFF" className="inset-0" />
          </div>
        )}
      </div>
    </button>
  );
};
