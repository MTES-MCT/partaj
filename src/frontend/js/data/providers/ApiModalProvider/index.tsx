import React, { createContext, ReactNode, useState } from 'react';
import { useIntl } from 'react-intl';
import { commonMessages } from '../../../const/translations';

export interface ApiModalProperties {
  css: string;
  content: React.ReactNode;
  button: React.ReactNode;
  title: string;
}

export interface ApiModalConfig {
  type: 'warning' | 'success' | 'error';
  content: () => React.ReactNode;
  title: string;
  button: React.ReactNode;
}

export const ApiModalContext = createContext<{
  isApiModalOpen: boolean;
  openApiModal: Function;
  closeApiModal: Function;
  apiModalProperties: ApiModalProperties;
}>({
  isApiModalOpen: false,
  closeApiModal: () => {
    return;
  },
  openApiModal: () => {
    return;
  },
  apiModalProperties: {
    content: <></>,
    title: '',
    css: '',
    button: <></>,
  },
});

export const ApiModalProvider = ({ children }: { children: ReactNode }) => {
  const intl = useIntl();

  const getDefaultTitle = () =>
    intl.formatMessage(commonMessages.defaultErrorMessage);
  const getDefaultContent = () => (
    <span>{intl.formatMessage(commonMessages.defaultErrorMessage)}</span>
  );

  const getCss = (type?: string) => {
    switch (type) {
      case 'confirm':
        return 'border-dsfr-primary-500';
      case 'warning':
        return 'border-dsfr-warning-500';
      case 'error':
        return 'border-dsfr-danger-500';
      case 'success':
        return 'border-dsfr-success-500';
      default:
        return 'border-dsfr-danger-500';
    }
  };

  const [apiModalProperties, setApiModalProperties] = useState<
    ApiModalProperties
  >({
    title: getDefaultTitle(),
    content: getDefaultContent(),
    css: getCss('warning'),
    button: <></>,
  });

  const [isApiModalOpen, setApiModalOpen] = useState<boolean>(false);
  const closeApiModal = () => {
    setApiModalOpen(false);
  };

  const openApiModal = (properties?: ApiModalConfig) => {
    setApiModalProperties({
      content: properties?.content ? properties?.content : getDefaultContent(),
      title: properties?.title ?? getDefaultTitle(),
      button: properties?.button,
      css: getCss(properties?.type),
    });
    setApiModalOpen(true);
  };

  const { Provider } = ApiModalContext;

  return (
    <Provider
      value={{
        openApiModal,
        closeApiModal,
        apiModalProperties,
        isApiModalOpen,
      }}
    >
      {children}
    </Provider>
  );
};
