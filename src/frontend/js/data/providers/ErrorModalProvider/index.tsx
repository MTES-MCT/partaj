import React, { createContext, ReactNode, useState } from 'react';
import { useIntl } from 'react-intl';
import { commonMessages } from '../../../const/translations';

export const ErrorModalContext = createContext<{
  isErrorModalOpen: boolean;
  errorMessage: React.ReactNode;
  errorTitle: string;
  setErrorMessage: Function;
  setErrorTitle: Function;
  closeErrorModal: Function;
  openErrorModal: Function;
}>({
  setErrorMessage: () => {
    return;
  },
  setErrorTitle: () => {
    return;
  },
  closeErrorModal: () => {
    return;
  },
  openErrorModal: () => {
    return;
  },
  errorMessage: <></>,
  errorTitle: '',
  isErrorModalOpen: false,
});

export const ErrorModalProvider = ({ children }: { children: ReactNode }) => {
  const intl = useIntl();

  const [errorMessage, setErrorMessage] = useState<React.ReactNode>(
    <span>intl.formatMessage(commonMessages.defaultErrorMessage)</span>,
  );

  const [errorTitle, setErrorTitle] = useState<string>(
    intl.formatMessage(commonMessages.defaultErrorMessage),
  );

  const [isErrorModalOpen, setErrorModalOpen] = useState<boolean>(false);

  const closeErrorModal = () => {
    setErrorModalOpen(false);
    setErrorMessage(
      <span>intl.formatMessage(commonMessages.defaultErrorMessage)</span>,
    );
    setErrorTitle(intl.formatMessage(commonMessages.errorModalTitle));
  };

  const openErrorModal = () => {
    setErrorModalOpen(true);
  };

  const { Provider } = ErrorModalContext;

  return (
    <Provider
      value={{
        openErrorModal,
        errorMessage,
        errorTitle,
        setErrorMessage,
        setErrorTitle,
        closeErrorModal,
        isErrorModalOpen,
      }}
    >
      {children}
    </Provider>
  );
};
