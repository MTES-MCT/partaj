import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from 'react';
import { Referral, ReferralState } from '../../../types';
import { usePrevious } from '@radix-ui/react-use-previous';
import { canUpdateReferral, isMainReferral } from '../../../utils/referral';
import { useCurrentUser } from '../../useCurrentUser';

export type Values = {
  currentValue: string;
  savedValue: string;
  state: SubFormStates;
};
type SubFormType = { [key: string]: Values };

type SubReferralContextType = {
  updateCurrentValue: (key: string, value: string) => void;
  updateSavedValue: (key: string, value: string) => void;
  updateState: (key: string, value: SubFormStates) => void;
  subFormState: SubFormType;
  resetFields: () => void;
  getChangedFields: () => string[];
  isMain: boolean;
};

const SubReferralContext = createContext<SubReferralContextType | undefined>(
  undefined,
);

export enum SubFormStates {
  INPUT_TEXT_SAVED = 'input_text_saved',
  INPUT_TEXT_CHANGED = 'input_text_changed',
  CLICKABLE_TEXT = 'clickable_text',
  READ_ONLY = 'read_only',
}

export const SubReferralProvider = ({
  children,
  referral,
}: {
  children: ReactNode;
  referral: Referral;
}) => {
  const [isMain, setMain] = useState<boolean>(isMainReferral(referral));
  const { currentUser } = useCurrentUser();
  const isEditingMode = (referral: Referral, key: keyof Referral) => {
    return (
      [ReferralState.SPLITTING, ReferralState.RECEIVED_SPLITTING].includes(
        referral.state,
      ) || !referral[key] === null
    );
  };

  const getState = (referral: Referral, key: keyof Referral) => {
    if (!canUpdateReferral(referral, currentUser)) {
      return SubFormStates.READ_ONLY;
    }

    return isEditingMode(referral, key)
      ? SubFormStates.INPUT_TEXT_SAVED
      : SubFormStates.CLICKABLE_TEXT;
  };

  const [subFormState, setSubFormState] = useState<SubFormType>({
    sub_title: {
      currentValue: referral.sub_title || '',
      savedValue: referral.sub_title || '',
      state: getState(referral, 'sub_title'),
    },
    sub_question: {
      currentValue: referral.sub_question || '',
      savedValue: referral.sub_question || '',
      state: getState(referral, 'sub_question'),
    },
  });

  const prevReferral = usePrevious(referral);

  useEffect(() => {
    // The user is clicking between referral
    // in the associated referral section
    if (referral.id !== prevReferral.id) {
      setSubFormState({
        sub_title: {
          currentValue: referral.sub_title || '',
          savedValue: referral.sub_title || '',
          state: getState(referral, 'sub_title'),
        },
        sub_question: {
          currentValue: referral.sub_question || '',
          savedValue: referral.sub_question || '',
          state: getState(referral, 'sub_question'),
        },
      });
    }

    if (referral.state !== prevReferral.state) {
      setSubFormState({
        sub_title: {
          currentValue: referral.sub_title,
          savedValue: referral.sub_title,
          state: getState(referral, 'sub_title'),
        },
        sub_question: {
          currentValue: referral.sub_question,
          savedValue: referral.sub_question,
          state: getState(referral, 'sub_question'),
        },
      });
    }
  }, [referral]);

  const getChangedFields: () => string[] = () => {
    return Object.entries(subFormState)
      .filter(([_, value]) => value.currentValue !== value.savedValue)
      .map(([key]) => key);
  };

  const updateCurrentValue = (key: keyof SubFormType, value: string) => {
    setSubFormState((previousState) => {
      previousState[key] = {
        currentValue: value,
        savedValue: previousState[key].savedValue,
        state:
          value === previousState[key].savedValue
            ? SubFormStates.INPUT_TEXT_SAVED
            : SubFormStates.INPUT_TEXT_CHANGED,
      };

      return { ...previousState };
    });
  };

  const updateSavedValue = (key: keyof SubFormType, value: string) => {
    setSubFormState((previousState) => {
      previousState[key] = {
        currentValue: previousState[key].currentValue,
        savedValue: value,
        state:
          value === previousState[key].currentValue
            ? SubFormStates.INPUT_TEXT_SAVED
            : SubFormStates.INPUT_TEXT_CHANGED,
      };

      return { ...previousState };
    });
  };

  const updateState = (key: keyof SubFormType, value: SubFormStates) => {
    setSubFormState((previousState) => {
      previousState[key] = {
        currentValue: subFormState[key].currentValue,
        savedValue: subFormState[key].savedValue,
        state: value,
      };

      return { ...previousState };
    });
  };

  const resetFields = () => {
    setSubFormState({
      sub_title: {
        currentValue: referral.sub_title,
        savedValue: referral.sub_title,
        state: SubFormStates.CLICKABLE_TEXT,
      },
      sub_question: {
        currentValue: referral.sub_question,
        savedValue: referral.sub_question,
        state: SubFormStates.CLICKABLE_TEXT,
      },
    });
  };

  return (
    <SubReferralContext.Provider
      value={{
        subFormState,
        updateSavedValue,
        updateCurrentValue,
        updateState,
        getChangedFields,
        resetFields,
        isMain,
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
