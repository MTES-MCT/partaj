import React, { ReactNode, useContext, useEffect, useState } from 'react';
import { Referral, RequesterUnitType } from 'types';
import { Nullable } from 'types/utils';
import { ReferralContext } from '../ReferralProvider';
import { isEmpty } from '../../../utils/string';
import { useIntl } from 'react-intl';
import { sectionTitles } from '../../../components/ReferralForm/NewForm';

interface FormObject {
  contact: string;
}

export const ReferralFormContext = React.createContext<{
  currentReferral: Nullable<Referral>;
  setCurrentReferral: Function;
  validate: Function;
  setValue: Function;
  errors: any;
}>({
  setCurrentReferral: () => {
    return;
  },
  setValue: () => {
    return;
  },
  validate: () => {
    return;
  },
  currentReferral: null,
  errors: {},
});

export const ReferralFormProvider = ({ children }: { children: ReactNode }) => {
  const { referral } = useContext(ReferralContext);
  const [errors, setErrors] = useState({});
  const form: FormObject = { contact: '' };
  const intl = useIntl();

  useEffect(() => {
    setErrors((prevErrors) => {
      const currentErrors = getErrors();
      const currentErrorKeys = Object.keys(currentErrors);
      const errorKeys = Object.keys(prevErrors);
      const errorToRemove = errorKeys.filter((key) => {
        return !currentErrorKeys.includes(key);
      });

      // @ts-ignore
      //TODO Type errors with all error keys
      errorToRemove.forEach((e) => delete errors[e]);

      return { ...prevErrors };
    });
  }, [referral]);

  const setValue = (key: keyof FormObject, value: string) => {
    form[key] = value;
  };

  const getErrors = () => {
    //TODO REFACTO
    const errors: { [key: string]: string } = {};

    if (referral && isEmpty(referral.object)) {
      errors['object'] = intl.formatMessage(sectionTitles.object);
    }

    if (referral && referral.has_prior_work === null) {
      errors['preliminary_work_empty'] = intl.formatMessage(
        sectionTitles.preliminaryWork,
      );
    } else {
      if (referral && referral.has_prior_work === 'yes') {
        if (
          referral &&
          referral.requester_unit_type === RequesterUnitType.DECENTRALISED_UNIT
        ) {
          if (isEmpty(referral.requester_unit_contact)) {
            errors['preliminary_work_no_contact'] = intl.formatMessage(
              sectionTitles.preliminaryWork,
            );
          }

          if (
            isEmpty(referral.prior_work) &&
            referral.attachments.length === 0
          ) {
            errors[
              'preliminary_work_decentralized_not_fill'
            ] = intl.formatMessage(sectionTitles.preliminaryWork);
          }
        }

        if (referral.requester_unit_type === RequesterUnitType.CENTRAL_UNIT) {
          if (
            isEmpty(referral.prior_work) &&
            referral.attachments.length === 0
          ) {
            errors['preliminary_work_central_not_fill'] = intl.formatMessage(
              sectionTitles.preliminaryWork,
            );
          }
        }
      }

      if (referral && referral.has_prior_work === 'no') {
        if (
          referral &&
          referral.requester_unit_type === RequesterUnitType.DECENTRALISED_UNIT
        ) {
          if (isEmpty(referral.no_prior_work_justification)) {
            errors[
              'preliminary_work_no_prior_work_justification'
            ] = intl.formatMessage(sectionTitles.preliminaryWork);
          }
        }
      }
    }

    if (referral && isEmpty(referral.question)) {
      errors['question'] = intl.formatMessage(sectionTitles.question);
    }

    if (referral && isEmpty(referral.context)) {
      errors['context'] = intl.formatMessage(sectionTitles.context);
    }

    if (referral && !referral.topic) {
      errors['topic'] = intl.formatMessage(sectionTitles.topic);
    }

    if (referral && !referral.urgency_level) {
      errors['urgency_level'] = intl.formatMessage(sectionTitles.urgencyLevel);
    }

    if (referral?.urgency_level?.requires_justification) {
      if (isEmpty(referral.urgency_explanation)) {
        errors['urgency_explanation'] = intl.formatMessage(
          sectionTitles.urgencyLevel,
        );
      }
    }

    return errors;
  };

  const validate = () => {
    const errors = getErrors();
    setErrors(getErrors());

    return errors;
  };

  const [currentReferral, setCurrentReferral] = useState<Nullable<Referral>>(
    referral,
  );

  const { Provider } = ReferralFormContext;

  return (
    <Provider
      value={{
        currentReferral,
        setCurrentReferral,
        setValue,
        validate,
        errors,
      }}
    >
      {children}
    </Provider>
  );
};
