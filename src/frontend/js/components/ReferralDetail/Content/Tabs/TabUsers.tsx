import React from 'react';
import { ReferralUsersBlock } from '../../../ReferralUsers/ReferralUsersBlock';
import { ReferralUsersModalProvider } from '../../../../data/providers/ReferralUsersModalProvider';
import { RoleModalProvider } from '../../../../data/providers/RoleModalProvider';
import { Modals } from '../../../modals/Modals';

export const TabUsers: React.FC = () => {
  return (
    <>
      <ReferralUsersModalProvider>
        <RoleModalProvider>
          <ReferralUsersBlock />
          <Modals />
        </RoleModalProvider>
      </ReferralUsersModalProvider>
    </>
  );
};
