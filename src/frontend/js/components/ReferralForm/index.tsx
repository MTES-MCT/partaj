import React, { useState } from 'react';
import { useFeatureFlag } from '../../data';
import { NewReferralForm } from './NewForm';
import { OldReferralForm } from './OldReferralForm';

export const ReferralForm: React.FC = () => {
  const [newFormActive, setNewFormActive] = useState<boolean>(false);

  const { status: newFormStatus } = useFeatureFlag('new_form', {
    onSuccess: (data) => {
      setNewFormActive(data.is_active);
    },
  });

  return (
    <>
      {newFormStatus === 'success' && (
        <>{newFormActive ? <NewReferralForm /> : <OldReferralForm />}</>
      )}
    </>
  );
};
