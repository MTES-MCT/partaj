import React, { MutableRefObject, ReactNode, useRef, useState } from 'react';

import { DOMElementPosition, ReferralLite, ReferralUserAction } from 'types';
import { Nullable } from '../../../types/utils';

export const SubscribeModalContext = React.createContext<{
  index: number;
  showModal: boolean;
  referral: Nullable<ReferralLite>;
  action: ReferralUserAction;
  modalRef: any;
  currentValue: string;
  updateValue: Function;
  displayModal: Function;
  closeModal: Function;
  additionalPayload: any;
  position: DOMElementPosition;
}>({
  index: 0,
  showModal: false,
  referral: null,
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
  const [index, setIndex] = useState<number>(0);
  const modalRef = useRef(null);
  const [currentValue, setCurrentValue] = useState<string>('');
  const [referral, setReferral] = useState<Nullable<ReferralLite>>(null);
  const [buttonRef, setButtonRef] = useState<
    MutableRefObject<Nullable<HTMLButtonElement>>
  >();

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
    value,
    buttonRef,
    action,
    payload,
    referral,
  }: {
    index: number;
    value: string;
    buttonRef: any;
    action: ReferralUserAction;
    payload?: any;
    referral: ReferralLite;
  }) => {
    setIndex(index);
    setCurrentValue(value);
    setPosition(getPosition(buttonRef));
    setShowModal(true);
    setAction(action);
    setAdditionalPayload(payload);
    setReferral(referral);
    setButtonRef(buttonRef);
  };

  const updateValue = (value: string) => {
    setCurrentValue(value);
  };

  const closeModal = () => {
    buttonRef && buttonRef.current!.focus();
    setShowModal(false);
  };

  const { Provider } = SubscribeModalContext;

  return (
    <Provider
      value={{
        referral,
        currentValue,
        updateValue,
        index,
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
