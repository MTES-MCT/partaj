import React, { useContext } from 'react';
import { ReferralFormContext } from '../../../data/providers/ReferralFormProvider';

export const SubmitFormButton: React.FC<React.PropsWithChildren<{
  onClick: Function;
}>> = ({ children, onClick }) => {
  const { validate } = useContext(ReferralFormContext);
  return (
    <button
      type="submit"
      className={`btn btn-primary flex justify-center`}
      style={{ minWidth: '12rem', minHeight: '2.5rem' }}
      onClick={() => {
        Object.keys(validate()).length === 0 && onClick();
      }}
    >
      {children}
    </button>
  );
};
