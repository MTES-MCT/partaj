import React, { ReactNode, useRef, useState } from 'react';

import { DOMElementPosition, ReferralUserAction } from 'types';

export const RoleModalContext = React.createContext<{
  showModal: boolean;
  action: ReferralUserAction;
  modalRef: any;
  currentValue: string;
  updateValue: Function;
  displayModal: Function;
  closeModal: Function;
  setShowModal: Function;
  additionalPayload: any;
  position: DOMElementPosition;
}>({
  showModal: false,
  currentValue: '',
  action: ReferralUserAction.UPSERT_USER,
  additionalPayload: {},
  modalRef: null,
  displayModal: () => {
    return;
  },
  updateValue: () => {
    return;
  },
  closeModal: () => {
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
  const [currentValue, setCurrentValue] = useState<string>('');
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
    value,
    buttonRef,
    action,
    payload,
  }: {
    value: string;
    buttonRef: any;
    action: ReferralUserAction;
    payload: any;
  }) => {
    setCurrentValue(value);
    setPosition(getPosition(buttonRef));
    setAction(action);
    setAdditionalPayload(payload);
    setShowModal(true);
  };

  const closeModal = () => {
    setCurrentValue('');
    setPosition({
      top: 0,
      right: 0,
    });
    setAction(ReferralUserAction.UPSERT_USER);
    setShowModal(false);
    setAdditionalPayload(null);
  };

  const updateValue = (value: string) => {
    setCurrentValue(value);
  };

  const { Provider } = RoleModalContext;

  return (
    <Provider
      value={{
        currentValue,
        updateValue,
        action,
        additionalPayload,
        showModal,
        setShowModal,
        displayModal,
        closeModal,
        position,
        modalRef,
      }}
    >
      {children}
    </Provider>
  );
};
