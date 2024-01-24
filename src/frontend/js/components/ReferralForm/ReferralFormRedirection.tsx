import React, { useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { useMutation } from 'react-query';

import { appData } from 'appData';
import { Spinner } from 'components/Spinner';

export const ReferralFormRedirection: React.FC = () => {
  const history = useHistory();

  const createReferralAction = async () => {
    const response = await fetch('/api/referrals/', {
      headers: {
        Authorization: `Token ${appData.token}`,
        'Content-Type': 'application/json',
      },
      method: 'POST',
    });
    if (!response.ok) {
      throw new Error(
        'Failed to create a new Referral during the referral form redirection.',
      );
    }
    return await response.json();
  };

  const mutation = useMutation(createReferralAction, {
    onSuccess: (data) => {
      history.push(`/new-referral/${data['id']}`);
    },
  });

  useEffect(() => {
    mutation.mutate();
  }, []);

  return <Spinner />;
};
