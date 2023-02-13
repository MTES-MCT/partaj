import React from 'react';
import { RoleModal } from './RoleModal';
import { ReferralUsersModal } from '../ReferralUsers/ReferralUsersModal/ReferralUsersModal';
import { FixedOverlay } from '../Overlay/FixedOverlay';

export const Modals: React.FC = () => {
  return (
    <>
      <FixedOverlay />
      <RoleModal />
      <ReferralUsersModal />
    </>
  );
};
