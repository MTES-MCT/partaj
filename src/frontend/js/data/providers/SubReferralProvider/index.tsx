import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from 'react';
import { Referral, ReferralSection, ReferralState } from '../../../types';
import { usePrevious } from '@radix-ui/react-use-previous';
import { canUpdateReferral, isMainReferral } from '../../../utils/referral';
import { useCurrentUser } from '../../useCurrentUser';
import { isUserReferralUnitsMember } from '../../../utils/unit';

export type Values = {
  currentValue: string;
  savedValue: string;
  showMetadata: boolean;
  state: SubFormStates;
};
type SubFormType = { [key: string]: Values };

type SubReferralContextType = {
  updateCurrentValue: (key: string, value: string) => void;
  updateState: (key: string, value: SubFormStates) => void;
  subFormState: SubFormType;
  getChangedFields: () => string[];
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
  group,
}: {
  children: ReactNode;
  referral: Referral;
  group: ReferralSection[];
}) => {
  const { currentUser } = useCurrentUser();

  const isEditingMode = (
    referral: Referral,
    key: keyof Referral,
    group: ReferralSection[],
  ) => {
    return (
      [ReferralState.SPLITTING, ReferralState.RECEIVED_SPLITTING].includes(
        referral.state,
      ) ||
      (referral[key] === null &&
        group.length > 0 &&
        isMainReferral(referral, group))
    );
  };

  const showMetadata = (key: string) => {
    return (
      isUserReferralUnitsMember(currentUser, referral) &&
      ((!isMainReferral(referral, group) &&
        [ReferralState.SPLITTING, ReferralState.RECEIVED_SPLITTING].includes(
          referral.state,
        )) ||
        (isMainReferral(referral, group) &&
          referral[key as keyof Referral] === null &&
          ![ReferralState.ANSWERED, ReferralState.CLOSED].includes(
            referral.state,
          )))
    );
  };

  const getState = (
    referral: Referral,
    group: ReferralSection[],
    key: keyof Referral,
    currentValue: string,
  ) => {
    if (!canUpdateReferral(referral, currentUser)) {
      return SubFormStates.READ_ONLY;
    }
    return isEditingMode(referral, key, group)
      ? currentValue === referral[key]
        ? SubFormStates.INPUT_TEXT_SAVED
        : SubFormStates.INPUT_TEXT_CHANGED
      : SubFormStates.CLICKABLE_TEXT;
  };

  const prevReferral = usePrevious(referral);

  useEffect(() => {
    if (prevReferral.id !== referral.id) {
      setSubFormState(getInitialState(null, referral));
    } else {
      setSubFormState((prevState) => getInitialState(prevState, referral));
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
        showMetadata: showMetadata(key as keyof Referral),
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
        showMetadata: showMetadata(key as keyof Referral),
      };

      return { ...previousState };
    });
  };

  const getInitialState = (prevState: any, referral: Referral) => {
    return {
      sub_title: {
        currentValue: prevState
          ? prevState['sub_title'].currentValue
          : referral.sub_title,
        savedValue: referral.sub_title,
        state: getState(
          referral,
          group,
          'sub_title',
          prevState ? prevState['sub_title'].currentValue : referral.sub_title,
        ),
        showMetadata: showMetadata('sub_title'),
      },
      sub_question: {
        currentValue: prevState
          ? prevState['sub_question'].currentValue
          : referral.sub_question,
        savedValue: referral.sub_question,
        state: getState(
          referral,
          group,
          'sub_question',
          prevState
            ? prevState['sub_question'].currentValue
            : referral.sub_question,
        ),
        showMetadata: showMetadata('sub_question'),
      },
    };
  };

  const [subFormState, setSubFormState] = useState<SubFormType>(
    getInitialState(null, referral),
  );

  return (
    <SubReferralContext.Provider
      value={{
        subFormState,
        updateCurrentValue,
        updateState,
        getChangedFields,
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
