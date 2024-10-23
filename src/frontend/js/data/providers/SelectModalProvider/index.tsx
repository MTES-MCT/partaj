import React, { createContext, ReactNode } from 'react';
import { useClickOutside } from '../../../utils/useClickOutside';

export const SelectModalContext = createContext<{
  ref: any;
}>({
  ref: null,
});

export const SelectModalProvider = ({
  children,
  onClickOutside,
}: {
  children: ReactNode;
  onClickOutside: Function;
}) => {
  const { ref } = useClickOutside({
    onClick: () => {
      onClickOutside();
    },
  });

  const { Provider } = SelectModalContext;

  return (
    <Provider
      value={{
        ref,
      }}
    >
      {children}
    </Provider>
  );
};
