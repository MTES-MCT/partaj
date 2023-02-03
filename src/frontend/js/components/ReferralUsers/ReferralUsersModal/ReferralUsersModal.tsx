import React, { useContext, useEffect, useState } from 'react';
import { ReferralUsersModalContext } from '../../../data/providers/ReferralUsersModalProvider';
import { useClickOutside } from '../../../utils/useClickOutside';
import { UserSearch } from './UserSearch';
import { UserInvitation } from './UserInvitation';
import { defineMessages, FormattedMessage } from 'react-intl';

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

interface AddUserModalProps {
  modalRef: any;
}

const EscKeyCodes = ['Escape', 'Esc', 27];

export const ReferralUsersModal: React.FC<AddUserModalProps> = ({
  modalRef,
}) => {
  const { showRUModal, tabActive, setTabActive, closeRUModal } = useContext(
    ReferralUsersModalContext,
  );

  const handleKeyDown = (event: KeyboardEvent) => {
    const key = event.key || event.keyCode;

    if (EscKeyCodes.includes(key)) {
      closeRUModal();
      event.preventDefault();
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
      closeRUModal();
    },
    insideRef: modalRef,
  });

  return (
    <div
      ref={ref}
      className={`${
        showRUModal ? 'fixed' : 'hidden'
      } z-20 flex flex-col w-full max-w-480 overflow-hidden rounded-sm bg-white h-560`}
      style={{
        margin: 0,
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      }}
    >
      <div className="flex w-full sticky top-0 z-20 bg-white">
        <div
          role="button"
          onClick={() => setTabActive('name')}
          className={`w-1/2 dashboard-tab ${tabActive === 'name' && 'active'}`}
        >
          <span>
            <FormattedMessage {...messages.addByName} />
          </span>
        </div>
        <div
          role="button"
          onClick={() => setTabActive('email')}
          className={`w-1/2 dashboard-tab ${tabActive === 'email' && 'active'}`}
        >
          <span>
            <FormattedMessage {...messages.addByMail} />
          </span>
        </div>
      </div>
      {tabActive === 'name' && <UserSearch />}
      {tabActive === 'email' && <UserInvitation />}
    </div>
  );
};
