import React, { useContext } from 'react';
import { RoleModal } from './RoleModal';
import { ReferralUsersModal } from '../ReferralUsers/ReferralUsersModal/ReferralUsersModal';
import { RoleModalContext } from '../../data/providers/RoleModalProvider';
import { FixedOverlay } from '../Overlay/FixedOverlay';

export const Modals: React.FC = () => {
  const { modalRef } = useContext(RoleModalContext);
  return (
    <>
      <FixedOverlay />
      <RoleModal />
      <ReferralUsersModal modalRef={modalRef} />
    </>
  );
};
