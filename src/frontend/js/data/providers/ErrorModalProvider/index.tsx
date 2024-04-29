import React, { createContext, ReactNode, useState } from 'react';
import { useIntl } from 'react-intl';
import { commonMessages } from '../../../const/translations';

export const ErrorModalContext = createContext<{
  isErrorModalOpen: boolean;
  errorMessage: string;
  setErrorMessage: Function;
  closeErrorModal: Function;
  openErrorModal: Function;
}>({
  setErrorMessage: () => {
    return;
  },
  closeErrorModal: () => {
    return;
  },
  openErrorModal: () => {
    return;
  },
  errorMessage: '',
  isErrorModalOpen: false,
});

export const ErrorModalProvider = ({ children }: { children: ReactNode }) => {
  const intl = useIntl();

  const [errorMessage, setErrorMessage] = useState<string>(
    intl.formatMessage(commonMessages.defaultErrorMessage),
  );

  const [isErrorModalOpen, setErrorModalOpen] = useState<boolean>(false);

  const closeErrorModal = () => {
    setErrorModalOpen(false);
    setErrorMessage(intl.formatMessage(commonMessages.defaultErrorMessage));
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
        setErrorMessage,
        closeErrorModal,
        isErrorModalOpen,
      }}
    >
      {children}
    </Provider>
  );
};
