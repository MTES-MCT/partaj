import React, {useEffect, useState} from 'react';
import { useMutation } from 'react-query';
import { appData } from 'appData';
import { Spinner } from 'components/Spinner';
import { useCurrentUser } from '../../data/useCurrentUser';

export const ToggleAPIButton = ({
  referralId,
  defaultActiveState,
}: {
  referralId: number;
  defaultActiveState: boolean;
}) => {
  const { currentUser } = useCurrentUser();
  const [isActive, setActive] = useState(defaultActiveState);
  const toggleAction = async () => {
    const action = isActive ? 'remove_observer' : 'add_observer';
    const response = await fetch(`/api/referrals/${referralId}/${action}/`, {
      headers: {
        Authorization: `Token ${appData.token}`,
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify({ observer: currentUser!.id }),
    });
    if (!response.ok) {
      throw new Error(
        `Failed to ${action} the referral ${referralId} for user ${
          currentUser!.id
        }`,
      );
    }
    return await response.json();
  };

  const mutation = useMutation(toggleAction, {
    onSuccess: (data, variables, context) => {
      setActive((prevState) => !prevState);
    },
  });

  return (
    <button
      className={`btn btn-primary-outline flex items-center space-x-2 mx-6 relative z-10`}
      onClick={(e) => {
        /* stopPropagation is used to avoid redirection if the button is nested inside a link */
        e.stopPropagation();
        mutation.mutate();
      }}
      aria-busy={mutation.isLoading}
      aria-disabled={mutation.isLoading}
    >
      <svg role="img" className="navbar-icon" aria-hidden="true">
        <use xlinkHref={`${appData.assets.icons}#icon-plus`} />
      </svg>
      {mutation.isLoading ? (
        <Spinner size="small" color="black" className="absolute inset-0">
          {/* No children with loading text as the spinner is aria-hidden (handled by aria-busy) */}
        </Spinner>
      ) : (
        <>{isActive ? <span>Suivi</span> : <span> Suivre </span>}</>
      )}
    </button>
  );
};
