import React, { useContext } from 'react';
import { AddIcon, CrossIcon } from '../Icons';
import { appData } from '../../appData';
import { useMutation } from 'react-query';
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

  const mutation = useMutation(() => removeRelationshipAction(), {
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
      aria-disabled={mutation.isLoading}
      disabled={mutation.isLoading}
      onClick={(e) => {
        e.stopPropagation();
        mutation.mutate();
      }}
    >
      <div className="flex relative w-full space-x-2 items-center">
        <CrossIcon
          className={`w-5 h-5 ${
            mutation.isLoading ? 'fill-transparent' : 'fill-white'
          }`}
        />
        <span
          className={`text-sm mb-0.5 ${
            mutation.isLoading ? 'text-transparent' : ''
          }`}
        >
          Délier
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
