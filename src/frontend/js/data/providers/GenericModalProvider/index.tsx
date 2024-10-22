import React, { createContext, ReactNode, useState } from 'react';
import { useIntl } from 'react-intl';
import { commonMessages } from '../../../const/translations';

export interface GenericModalProperties {
  css: string;
  content: React.ReactNode;
  title: string;
}

export interface GenericModalConfig {
  type: 'warning' | 'success' | 'error';
  content: React.ReactNode;
  title: string;
}

export const GenericModalContext = createContext<{
  isGenericModalOpen: boolean;
  openGenericModal: Function;
  closeGenericModal: Function;
  genericModalProperties: GenericModalProperties;
}>({
  isGenericModalOpen: false,
  closeGenericModal: () => {
    return;
  },
  openGenericModal: () => {
    return;
  },
  genericModalProperties: {
    content: <></>,
    title: '',
    css: '',
  },
});

export const GenericModalProvider = ({ children }: { children: ReactNode }) => {
  const intl = useIntl();

  const getDefaultTitle = () =>
    intl.formatMessage(commonMessages.defaultErrorMessage);
  const getDefaultContent = () => (
    <span>{intl.formatMessage(commonMessages.defaultErrorMessage)}</span>
  );

  const getCss = (type?: string) => {
    switch (type) {
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

  const [genericModalProperties, setGenericModalProperties] = useState<
    GenericModalProperties
  >({
    title: getDefaultTitle(),
    content: getDefaultContent(),
    css: getCss('warning'),
  });

  const [isGenericModalOpen, setGenericModalOpen] = useState<boolean>(false);

  const closeGenericModal = () => {
    setGenericModalOpen(false);
  };

  const openGenericModal = (properties?: GenericModalConfig) => {
    setGenericModalProperties({
      content: properties?.content ?? getDefaultContent(),
      title: properties?.title ?? getDefaultTitle(),
      css: getCss(properties?.type),
    });
    setGenericModalOpen(true);
  };

  const { Provider } = GenericModalContext;

  return (
    <Provider
      value={{
        openGenericModal,
        closeGenericModal,
        genericModalProperties,
        isGenericModalOpen,
      }}
    >
      {children}
    </Provider>
  );
};
