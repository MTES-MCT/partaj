import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from 'react';
import { Referral } from '../../../types';
import { usePrevious } from '@radix-ui/react-use-previous';

export type Values = {
  currentValue: string;
  savedValue: string;
  state: 'saved' | 'changed';
};
type SubFormType = { [key: string]: Values };

type SubReferralContextType = {
  updateSubForm: (key: string, value: Values) => void;
  subFormState: SubFormType;
  resetFields: () => void;
  getChangedFields: () => string[];
};

const SubReferralContext = createContext<SubReferralContextType | undefined>(
  undefined,
);

export const SubReferralProvider = ({
  children,
  referral,
}: {
  children: ReactNode;
  referral: Referral;
}) => {
  const [subFormState, setSubFormState] = useState<SubFormType>({
    sub_title: {
      currentValue: referral.sub_title || '',
      savedValue: referral.sub_title || '',
      state: 'saved',
    },
    sub_question: {
      currentValue: referral.sub_question || '',
      savedValue: referral.sub_question || '',
      state: 'saved',
    },
  });

  const prevReferral = usePrevious(referral);

  useEffect(() => {
    if (referral.id !== prevReferral.id) {
      setSubFormState({
        sub_title: {
          currentValue: referral.sub_title || '',
          savedValue: referral.sub_title || '',
          state: 'saved',
        },
        sub_question: {
          currentValue: referral.sub_question || '',
          savedValue: referral.sub_question || '',
          state: 'saved',
        },
      });
    }
  }, [referral]);

  const getChangedFields: () => string[] = () => {
    return Object.entries(subFormState)
      .filter(([_, value]) => value.currentValue !== value.savedValue)
      .map(([key]) => key);
  };

  const updateSubForm = (key: keyof SubFormType, values: Values) => {
    setSubFormState((previousState) => {
      previousState[key] = values;

      return { ...previousState };
    });
  };

  const resetFields = () => {
    setSubFormState({
      sub_title: {
        currentValue: referral.sub_title || '',
        savedValue: referral.sub_title || '',
        state: 'saved',
      },
      sub_question: {
        currentValue: referral.sub_question || '',
        savedValue: referral.sub_question || '',
        state: 'saved',
      },
    });
  };

  return (
    <SubReferralContext.Provider
      value={{
        subFormState,
        updateSubForm,
        getChangedFields,
        resetFields,
      }}
    >
      {children}
    </SubReferralContext.Provider>
  );
};

export const useSubReferral = () => {
  const context = useContext(SubReferralContext);
  if (!context) {
    throw new Error('useSubReferral must be used within a SubReferralProvider');
  }
  return context;
};
