import React, { createContext, ReactNode, useState } from 'react';

export interface BaseSideModalProperties {
  css?: 'primary' | 'success' | 'warning' | 'danger';
  title?: string;
  width?: string;
  height?: string;
  content?: React.ReactNode;
}

export const BaseSideModalContext = createContext<{
  isBaseSideModalOpen: boolean;
  openBaseSideModal: (properties?: BaseSideModalProperties) => void;
  closeBaseSideModal: () => void;
  baseSideModalProperties: BaseSideModalProperties;
}>({
  isBaseSideModalOpen: false,
  closeBaseSideModal: () => {
    return;
  },
  openBaseSideModal: () => {
    return;
  },
  baseSideModalProperties: {
    css: 'primary',
    title: '',
    width: 'max-w-md',
    height: 'h-full',
    content: null,
  },
});

export const BaseSideModalProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [baseSideModalProperties, setBaseSideModalProperties] = useState<
    BaseSideModalProperties
  >({
    css: 'primary',
    title: '',
    width: 'max-w-md',
    height: 'h-full',
    content: null,
  });

  const [isBaseSideModalOpen, setIsBaseSideModalOpen] = useState<boolean>(
    false,
  );

  const closeBaseSideModal = () => {
    setIsBaseSideModalOpen(false);
  };

  const openBaseSideModal = (properties?: BaseSideModalProperties) => {
    setBaseSideModalProperties({
      css: properties?.css || 'primary',
      title: properties?.title || '',
      width: properties?.width || 'max-w-md',
      height: properties?.height || 'h-full',
      content: properties?.content || null,
    });
    setIsBaseSideModalOpen(true);
  };

  const { Provider } = BaseSideModalContext;

  return (
    <Provider
      value={{
        openBaseSideModal,
        closeBaseSideModal,
        baseSideModalProperties,
        isBaseSideModalOpen,
      }}
    >
      {children}
    </Provider>
  );
};
