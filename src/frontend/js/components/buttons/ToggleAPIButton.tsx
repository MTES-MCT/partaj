import React, { ReactNode } from 'react';
import { useMutation } from 'react-query';
import { appData } from 'appData';
import { Spinner } from 'components/Spinner';
import { useCurrentUser } from '../../data/useCurrentUser';

export const ToggleAPIButton = ({
  referralId,
  isActive,
  activeUrl,
  inactiveUrl,
  iconActive,
  iconInactive,
  body,
  onSuccess,
}: {
  referralId: number;
  isActive: boolean | null;
  activeUrl: string;
  inactiveUrl: string;
  iconActive: ReactNode;
  iconInactive: ReactNode;
  body: any;
  onSuccess: Function;
}) => {
  const { currentUser } = useCurrentUser();
  const toggleAction = async () => {
    const action = isActive ? activeUrl : inactiveUrl;
    const response = await fetch(
      `/api/referrals/${referralId}/${isActive ? inactiveUrl : activeUrl}/`,
      {
        headers: {
          Authorization: `Token ${appData.token}`,
          'Content-Type': 'application/json',
        },
        method: 'POST',
        body: JSON.stringify(body),
      },
    );
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
      onSuccess(data);
    },
  });

  return (
    <button
      className={`table-row-button`}
      onClick={(e) => {
        /* stopPropagation is used to avoid redirection if the button is nested inside a link */
        e.stopPropagation();
        mutation.mutate();
      }}
      aria-busy={mutation.isLoading}
      aria-disabled={mutation.isLoading}
    >
      {mutation.isLoading ? (
        <div className="flex justify-center w-8 h-8">
          <Spinner size="small" color="#8080D1" className="inset-0">
            {/* No children with loading text as the spinner is aria-hidden (handled by aria-busy) */}
          </Spinner>
        </div>
      ) : (
        <>{isActive ? iconActive : iconInactive}</>
      )}
    </button>
  );
};
