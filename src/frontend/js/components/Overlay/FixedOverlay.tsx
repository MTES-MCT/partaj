import React, { useContext } from 'react';
import { ReferralUsersModalContext } from '../../data/providers/ReferralUsersModalProvider';
import { RoleModalContext } from '../../data/providers/RoleModalProvider';

export const FixedOverlay: React.FC = () => {
  const { showRUModal } = useContext(ReferralUsersModalContext);
  const { showModal } = useContext(RoleModalContext);
  return (
    <div
      className={`${showRUModal || showModal ? 'fixed' : 'hidden'} ${
        showRUModal ? 'bg-gray-transparent-70p' : 'bg-transparent'
      } inset-0  z-19 flex justify-center items-center`}
      style={{ margin: 0 }}
    ></div>
  );
};
