import React, { createContext, ReactNode } from 'react';
import { useClickOutside } from '../../../utils/useClickOutside';

export const SelectModalContext = createContext<{
  ref: any;
  onSelectedItemChange: Function;
}>({
  ref: null,
  onSelectedItemChange: () => {},
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

  const onSelectedItemChange = (selectedItemRef: any) => {
    console.log('selectedItemRef');
    console.log(selectedItemRef);
    console.log('modalRef');
    console.log(ref);
  };

  const { Provider } = SelectModalContext;

  return (
    <Provider
      value={{
        ref,
        onSelectedItemChange,
      }}
    >
      {children}
    </Provider>
  );
};
