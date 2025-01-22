import React, { useContext, useEffect, useState } from 'react';
import { ReferralUsersModalContext } from '../../../data/providers/ReferralUsersModalProvider';
import { useClickOutside } from '../../../utils/useClickOutside';
import { UserSearch } from './UserSearch';
import { UserInvitation } from './UserInvitation';
import { defineMessages, FormattedMessage } from 'react-intl';
import { RoleModalContext } from '../../../data/providers/RoleModalProvider';
import { EscKeyCodes } from '../../../const';
import { Tabs, TabsList, TabsTrigger } from '../../dsfr/Tabs';

const messages = defineMessages({
  addByName: {
    defaultMessage: 'Add by name',
    description: 'Title for user search tab',
    id: 'components.ReferralUsersModal.addByName',
  },
  addByMail: {
    defaultMessage: 'Add by mail',
    description: 'Title for user invitation tab',
    id: 'components.ReferralUsersModal.addByMail',
  },
});

enum UserModalTabs {
  NAME = 'name',
  EMAIL = 'email',
}

export const ReferralUsersModal: React.FC = () => {
  const { showRUModal, tabActive, setTabActive, closeRUModal } = useContext(
    ReferralUsersModalContext,
  );

  const { modalRef, closeModal, showModal } = useContext(RoleModalContext);

  const handleKeyDown = (event: KeyboardEvent) => {
    const key = event.key || event.keyCode;

    if (EscKeyCodes.includes(key)) {
      event.preventDefault();
      closeModal();
      closeRUModal();
    }
  };

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown, false);

    return () => {
      document.removeEventListener('keydown', handleKeyDown, false);
    };
  }, [handleKeyDown]);

  const { ref } = useClickOutside({
    onClick: () => {
      showModal && closeModal();
      showRUModal && closeRUModal();
    },
    insideRef: modalRef,
  });

  return (
    <div
      ref={ref}
      className={`${
        showRUModal ? 'fixed' : 'hidden'
      } z-20 flex flex-col w-full min-w-304 max-w-480 overflow-hidden rounded-sm bg-white h-560 font-marianne`}
      style={{
        margin: 0,
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      }}
    >
      <Tabs
        defaultValue={UserModalTabs.NAME}
        value={tabActive}
        onValueChange={(value) => setTabActive(value as UserModalTabs)}
        className="flex w-full sticky top-0 z-20 bg-white"
      >
        <TabsList className="flex w-full justify-start bg-white">
          <TabsTrigger
            key={UserModalTabs.NAME}
            value={UserModalTabs.NAME}
            className="w-1/2"
          >
            <FormattedMessage {...messages.addByName} />
          </TabsTrigger>
          <TabsTrigger
            key={UserModalTabs.EMAIL}
            value={UserModalTabs.EMAIL}
            className="w-1/2"
          >
            <FormattedMessage {...messages.addByMail} />
          </TabsTrigger>
        </TabsList>
      </Tabs>
      {tabActive === 'name' && <UserSearch />}
      {tabActive === 'email' && <UserInvitation />}
    </div>
  );
};
