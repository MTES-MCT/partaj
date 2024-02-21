import React, {
  LegacyRef,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { ReferralUsersModalContext } from '../../../data/providers/ReferralUsersModalProvider';
import { useClickOutside } from '../../../utils/useClickOutside';
import { UserSearch } from './UserSearch';
import { UserInvitation } from './UserInvitation';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { RoleModalContext } from '../../../data/providers/RoleModalProvider';
import { EscKeyCodes } from '../../../const';

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
  modalTitle: {
    defaultMessage: 'Add user to the referral',
    description: 'Title for user invitation modal',
    id: 'components.ReferralUsersModal.modalTitle',
  },
});

export const ReferralUsersModal: React.FC = () => {
  const intl = useIntl();
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

  const dialogRef = useRef<any>(null);

  const { ref } = useClickOutside({
    onClick: () => {
      dialogRef.current && dialogRef.current.close();
      showModal && closeModal();
      showRUModal && closeRUModal();
    },
    insideRef: modalRef,
  });

  useEffect(() => {
    const modalElement = dialogRef.current;

    if (modalElement) {
      if (showRUModal) {
        modalElement.showModal();
        (ref.current! as HTMLElement).focus();
      } else {
        modalElement.close();
      }
    }
  }, [showRUModal]);

  return (
    <dialog
      id="referral-user-modal"
      aria-modal="true"
      aria-label={intl.formatMessage(messages.modalTitle)}
      ref={dialogRef}
      className={`${
        showRUModal ? 'fixed' : 'hidden'
      } z-20 flex w-full max-w-480 overflow-hidden rounded-sm bg-white h-560`}
      style={{
        margin: 0,
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      }}
    >
      <div className="flex flex-col flex-grow" ref={ref}>
        <div className="flex w-full sticky top-0 z-20 bg-white">
          <button
            type="button"
            onClick={() => setTabActive('name')}
            className={`w-1/2 dashboard-tab ${
              tabActive === 'name' && 'active'
            }`}
            aria-current={tabActive === 'name'}
          >
            <span>
              <FormattedMessage {...messages.addByName} />
            </span>
          </button>
          <button
            type="button"
            onClick={() => setTabActive('email')}
            className={`w-1/2 dashboard-tab ${
              tabActive === 'email' && 'active'
            }`}
            aria-current={tabActive === 'email'}
          >
            <span>
              <FormattedMessage {...messages.addByMail} />
            </span>
          </button>
        </div>
        {tabActive === 'name' && <UserSearch />}
        {tabActive === 'email' && <UserInvitation />}
      </div>
    </dialog>
  );
};
