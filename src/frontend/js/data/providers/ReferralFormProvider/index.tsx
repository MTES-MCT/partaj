import React, { ReactNode, useContext, useEffect, useState } from 'react';
import { Referral, RequesterUnitType } from 'types';
import { Nullable } from 'types/utils';
import { ReferralContext } from '../ReferralProvider';
import { isEmpty } from '../../../utils/string';

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

  useEffect(() => {
    console.log(referral);
  }, [referral]);

  const setValue = (key: keyof FormObject, value: string) => {
    form[key] = value;
  };

  const getErrors = () => {
    const errors: { [key: string]: string } = {};

    if (referral && isEmpty(referral.object)) {
      errors['object'] = 'title is required';
    }

    if (referral && referral.has_prior_work === null) {
      errors['preliminary_work_empty'] = 'prior work is required';
    } else {
      if (referral && referral.has_prior_work === 'yes') {
        if (
          referral &&
          referral.requester_unit_type === RequesterUnitType.DECENTRALISED_UNIT
        ) {
          if (isEmpty(referral.requester_unit_contact)) {
            errors['preliminary_work_no_contact'] =
              'prior work contact is required';
          }

          if (
            isEmpty(referral.prior_work) &&
            referral.attachments.length === 0
          ) {
            errors['preliminary_work_decentralized_not_fill'] =
              'prior work is required';
          }
        }

        if (referral.requester_unit_type === RequesterUnitType.CENTRAL_UNIT) {
          if (
            isEmpty(referral.prior_work) &&
            referral.attachments.length === 0
          ) {
            errors['preliminary_work_central_not_fill'] =
              'prior work is required';
          }
        }
      }

      if (referral && referral.has_prior_work === 'no') {
        if (
          referral &&
          referral.requester_unit_type === RequesterUnitType.DECENTRALISED_UNIT
        ) {
          if (isEmpty(referral.no_prior_work_justification)) {
            errors['preliminary_work_no_prior_work_justification'] =
              'prior work  justification is empty';
          }
        }
      }
    }

    if (referral && isEmpty(referral.question)) {
      errors['question'] = 'question is required';
    }

    if (referral && isEmpty(referral.context)) {
      errors['context'] = 'context is required';
    }

    if (referral && !referral.topic) {
      errors['topic'] = 'topic is required';
    }

    if (referral && !referral.urgency_level) {
      errors['urgency_level'] = 'urgency_level is required';
    }

    if (referral?.urgency_level?.requires_justification) {
      if (isEmpty(referral.urgency_explanation)) {
        errors['urgency_explanation'] = 'urgency_explanation is required';
      }
    }

    return errors;
  };

  const validate = () => {
    setErrors(getErrors());
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
