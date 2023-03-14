import React, { ReactNode, useState } from 'react';
import { ReferralLite, UserLite } from '../../../types';
import { Nullable } from '../../../types/utils';

export const ReferralUsersModalContext = React.createContext<{
  showRUModal: boolean;
  tabActive: string;
  inputValue: string;
  emailInputValue: string;
  emailErrorMessage: Nullable<string>;
  results: Array<UserLite>;
  setShowRUModal: Function;
  setResults: Function;
  setTabActive: Function;
  setInputValue: Function;
  setEmailInputValue: Function;
  setEmailErrorMessage: Function;
  closeRUModal: Function;
  openRUModal: Function;
}>({
  showRUModal: false,
  tabActive: 'name',
  inputValue: '',
  emailInputValue: '',
  emailErrorMessage: null,
  results: [],
  setResults: () => {
    return;
  },
  setShowRUModal: () => {
    return;
  },
  closeRUModal: () => {
    return;
  },
  openRUModal: () => {
    return;
  },
  setTabActive: () => {
    return;
  },
  setInputValue: () => {
    return;
  },
  setEmailInputValue: () => {
    return;
  },
  setEmailErrorMessage: () => {
    return;
  },
});

export const ReferralUsersModalProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [showRUModal, setShowRUModal] = useState<boolean>(false);
  const [tabActive, setTabActive] = useState<string>('');
  const [referral, setReferral] = useState<Nullable<ReferralLite>>(null);
  const [results, setResults] = useState<Array<UserLite>>([]);
  const [inputValue, setInputValue] = useState<string>('');
  const [emailInputValue, setEmailInputValue] = useState<string>('');
  const [emailErrorMessage, setEmailErrorMessage] = useState<Nullable<string>>(
    null,
  );

  const { Provider } = ReferralUsersModalContext;

  const openRUModal = () => {
    setTabActive('name');
    setInputValue('');
    setEmailInputValue('');
    setResults([]);
    setShowRUModal(true);
  };

  const closeRUModal = () => {
    setShowRUModal(false);
    setTabActive('');
    setInputValue('');
    setEmailInputValue('');
    setResults([]);
    setReferral(null);
  };

  return (
    <Provider
      value={{
        showRUModal,
        closeRUModal,
        openRUModal,
        setShowRUModal,
        tabActive,
        inputValue,
        emailInputValue,
        emailErrorMessage,
        results,
        setTabActive,
        setInputValue,
        setEmailInputValue,
        setEmailErrorMessage,
        setResults,
      }}
    >
      {children}
    </Provider>
  );
};