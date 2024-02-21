import React, { MutableRefObject, ReactNode, useRef, useState } from 'react';

import { DOMElementPosition, ReferralUserAction } from 'types';
import { Nullable } from '../../../types/utils';
import { getModalPosition } from '../../../utils/position';

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
  const [position, setPosition] = useState<any>({
    marginTop: '0px',
    marginRight: '0px',
  });
  const [currentValue, setCurrentValue] = useState<string>('');
  const modalRef = useRef(null);
  const [buttonRef, setButtonRef] = useState<
    MutableRefObject<Nullable<HTMLButtonElement>>
  >();

  const displayModal = ({
    value,
    buttonRef,
    action,
    payload,
    modalType,
  }: {
    value: string;
    buttonRef: any;
    action: ReferralUserAction;
    payload: any;
    modalType: 'role' | 'subscription' | 'priority';
  }) => {
    setCurrentValue(value);
    setPosition(getModalPosition(buttonRef, modalType));
    setAction(action);
    setAdditionalPayload(payload);
    setButtonRef(buttonRef);
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
    buttonRef && buttonRef.current!.focus();
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
