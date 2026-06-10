import React, { useContext } from 'react';
import { AddIcon, CheckIcon } from '../Icons';
import { appData } from '../../appData';
import { useMutation } from '@tanstack/react-query';
import { Spinner } from '../Spinner';
import * as Sentry from '@sentry/react';
import { ReferralRelationship } from '../../types';

export const AddRelationShipButton = ({
  mainReferralId,
  relatedReferralId,
  setRelationships,
  isAlreadyAdded,
}: {
  mainReferralId: string;
  relatedReferralId: string;
  isAlreadyAdded: boolean;
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

  const mutation = useMutation({
    mutationFn: () => addRelationshipAction(),
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
      className={`btn ${
        isAlreadyAdded ? 'btn-success' : 'btn-primary'
      } btn-primary space-x-2`}
      aria-disabled={mutation.isPending || isAlreadyAdded}
      disabled={mutation.isPending || isAlreadyAdded}
      onClick={(e) => {
        e.stopPropagation();
        !isAlreadyAdded && mutation.mutate();
      }}
    >
      <div className="flex relative w-full space-x-2 items-center">
        {isAlreadyAdded ? (
          <CheckIcon className={'w-5 h-5'} />
        ) : (
          <AddIcon
            className={`w-5 h-5 rotate-90 ${
              mutation.isPending ? 'fill-transparent' : 'fill-white'
            }`}
          />
        )}
        <span
          className={`text-sm mb-0.5 ${
            mutation.isPending ? 'text-transparent' : ''
          }`}
        >
          {isAlreadyAdded ? <>Liée</> : <>Lier</>}
        </span>
        {mutation.isPending && (
          <div className="absolute inset-0 flex items-center">
            <Spinner size="small" color="#FFFFFF" className="inset-0" />
          </div>
        )}
      </div>
    </button>
  );
};
