import React, { ReactNode, useRef, useState } from 'react';

import {
  DOMElementPosition,
  ReferralLite,
  ReferralUserAction,
  UserLite,
} from 'types';
import { Nullable } from 'types/utils';

export const SubscribeModalContext = React.createContext<{
  index: number;
  showModal: boolean;
  action: ReferralUserAction;
  modalRef: any;
  user: Nullable<UserLite>;
  referral: Nullable<ReferralLite>;
  displayModal: Function;
  closeModal: Function;
  additionalPayload: any;
  position: DOMElementPosition;
}>({
  index: 0,
  showModal: false,
  user: null,
  referral: null,
  action: ReferralUserAction.UPSERT_USER,
  additionalPayload: {},
  modalRef: null,
  displayModal: () => {
    return;
  },
  closeModal: () => {
    return;
  },
  position: {
    top: 0,
    right: 0,
  },
});

export const SubscribeModalProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [showModal, setShowModal] = useState<boolean>(false);
  const [action, setAction] = useState<ReferralUserAction>(
    ReferralUserAction.UPSERT_USER,
  );
  const [additionalPayload, setAdditionalPayload] = useState<any>({});
  const [position, setPosition] = useState<DOMElementPosition>({
    right: 0,
  });
  const [user, setUser] = useState<Nullable<UserLite>>(null);
  const [index, setIndex] = useState<number>(0);
  const [referral, setReferral] = useState<Nullable<ReferralLite>>(null);
  const modalRef = useRef(null);

  const getPosition = (buttonRef: any) => {
    const remainingBottomSpace =
      window.innerHeight - buttonRef.current.getBoundingClientRect().top;
    if (remainingBottomSpace < 300) {
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
    index,
    user,
    buttonRef,
    action,
    currentReferral,
    payload,
  }: {
    user: any;
    index: number;
    buttonRef: any;
    action: ReferralUserAction;
    payload?: any;
    currentReferral: ReferralLite;
  }) => {
    setUser(user);
    setIndex(index);
    setReferral(currentReferral);
    setPosition(getPosition(buttonRef));
    setShowModal(true);
    setAction(action);
    setAdditionalPayload(payload);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  const { Provider } = SubscribeModalContext;

  return (
    <Provider
      value={{
        user,
        index,
        referral,
        action,
        additionalPayload,
        showModal,
        closeModal,
        displayModal,
        position,
        modalRef,
      }}
    >
      {children}
    </Provider>
  );
};
