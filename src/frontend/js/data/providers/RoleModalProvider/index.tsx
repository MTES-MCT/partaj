import React, { ReactNode, useRef, useState } from 'react';

import {
  DOMElementPosition,
  ReferralLite,
  ReferralUserAction,
  UserLite,
} from 'types';
import { Nullable } from 'types/utils';

export const RoleModalContext = React.createContext<{
  showModal: boolean;
  action: ReferralUserAction;
  modalRef: any;
  user: Nullable<UserLite>;
  displayModal: Function;
  setShowModal: Function;
  additionalPayload: any;
  position: DOMElementPosition;
}>({
  showModal: false,
  user: null,
  action: ReferralUserAction.UPSERT_USER,
  additionalPayload: {},
  modalRef: null,
  displayModal: () => {
    return;
  },
  setShowModal: () => {
    return;
  },
  position: {
    top: 0,
    right: 0,
  },
});

export const RoleModalProvider = ({ children }: { children: ReactNode }) => {
  const [showModal, setShowModal] = useState<boolean>(false);
  const [action, setAction] = useState<ReferralUserAction>(
    ReferralUserAction.UPSERT_USER,
  );
  const [additionalPayload, setAdditionalPayload] = useState<any>({});
  const [position, setPosition] = useState<DOMElementPosition>({
    top: 0,
    right: 0,
  });
  const [user, setUser] = useState<Nullable<UserLite>>(null);
  const [referral, setReferral] = useState<Nullable<ReferralLite>>(null);
  const modalRef = useRef(null);

  const getPosition = (buttonRef: any) => {
    const remainingBottomSpace =
      window.innerHeight - buttonRef.current.getBoundingClientRect().top;
    if (remainingBottomSpace < 250) {
      return {
        bottom:
          window.innerHeight - buttonRef.current.getBoundingClientRect().top,
        right:
          window.innerWidth - buttonRef.current.getBoundingClientRect().right,
      };
    }
    return {
      top: buttonRef.current.getBoundingClientRect().top,
      right:
        window.innerWidth - buttonRef.current.getBoundingClientRect().right,
      marginTop: '36px',
    };
  };

  const displayModal = ({
    user,
    buttonRef,
    action,
    payload,
  }: {
    user: any;
    buttonRef: any;
    action: ReferralUserAction;
    payload: any;
  }) => {
    setUser(user);
    setPosition(getPosition(buttonRef));
    setShowModal(true);
    setAction(action);
    setAdditionalPayload(payload);
  };

  const { Provider } = RoleModalContext;

  return (
    <Provider
      value={{
        user,
        action,
        additionalPayload,
        showModal,
        setShowModal,
        displayModal,
        position,
        modalRef,
      }}
    >
      {children}
    </Provider>
  );
};
