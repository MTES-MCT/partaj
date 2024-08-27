import React, { ReactNode, useContext, useEffect, useState } from 'react';
import { Referral } from 'types';
import { Nullable } from 'types/utils';
import { ReferralContext } from '../ReferralProvider';

interface FormObject {
  contact: string;
}

export const ReferralFormContext = React.createContext<{
  currentReferral: Nullable<Referral>;
  setCurrentReferral: Function;
  setValue: Function;
}>({
  setCurrentReferral: () => {
    return;
  },
  setValue: () => {
    return;
  },
  currentReferral: null,
});

export const ReferralFormProvider = ({ children }: { children: ReactNode }) => {
  const { referral } = useContext(ReferralContext);

  const form: FormObject = { contact: '' };

  useEffect(() => {
    console.log(referral);
  }, [referral]);

  const setValue = (key: keyof FormObject, value: string) => {
    form[key] = value;
  };

  const [currentReferral, setCurrentReferral] = useState<Nullable<Referral>>(
    referral,
  );

  const { Provider } = ReferralFormContext;

  return (
    <Provider value={{ currentReferral, setCurrentReferral, setValue }}>
      {children}
    </Provider>
  );
};
