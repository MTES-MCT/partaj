import React from 'react';
import { CrossIcon } from '../Icons';
import { appData } from '../../appData';
import { useMutation } from '@tanstack/react-query';
import { Spinner } from '../Spinner';
import * as Sentry from '@sentry/react';
import { ReferralRelationship } from '../../types';

export const RemoveRelationShipButton = ({
  relationship,
  setRelationships,
}: {
  relationship: ReferralRelationship;
  setRelationships: Function;
}) => {
  const removeRelationshipAction = async () => {
    const response = await fetch(
      `/api/referralrelationships/${relationship.id}`,
      {
        headers: {
          Authorization: `Token ${appData.token}`,
          'Content-Type': 'application/json',
        },
        method: 'DELETE',
      },
    );

    if (!response.ok) {
      throw new Error(
        `Failed to call remove relationship for relationship ${relationship.id}`,
      );
    }
  };

  const mutation = useMutation({
    mutationFn: () => removeRelationshipAction(),
    onSuccess: () => {
      setRelationships((currentRelationships: ReferralRelationship[]) => {
        const newRelationships = currentRelationships.filter(
          (currentRelationship) => relationship.id !== currentRelationship.id,
        );

        return [...newRelationships];
      });
    },
    onError: (error) => {
      Sentry.captureException(error);
    },
  });

  return (
    <button
      className="btn space-x-2 btn-danger-primary"
      aria-disabled={mutation.isPending}
      disabled={mutation.isPending}
      onClick={(e) => {
        e.stopPropagation();
        mutation.mutate();
      }}
    >
      <div className="flex relative w-full space-x-2 items-center">
        <CrossIcon
          className={`w-5 h-5 ${
            mutation.isPending ? 'fill-transparent' : 'fill-white'
          }`}
        />
        <span
          className={`text-sm mb-0.5 ${
            mutation.isPending ? 'text-transparent' : ''
          }`}
        >
          Délier
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
