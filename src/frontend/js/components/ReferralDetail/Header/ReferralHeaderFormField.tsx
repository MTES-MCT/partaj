import React, { useContext, useEffect } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { Referral } from 'types';
import * as Sentry from '@sentry/react';
import { usePatchReferralAction } from '../../../data/referral';
import { TextArea, TextAreaSize } from '../../text/TextArea';
import { Spinner } from '../../Spinner';
import { ReferralContext } from '../../../data/providers/ReferralProvider';

const messages = defineMessages({
  subTitleTitle: {
    defaultMessage: 'Sub referral title',
    description: 'Sub referral title text',
    id: 'components.SubTitleField.subTitleTitle',
  },
  subTitleDescription: {
    defaultMessage:
      'Reformulate the title to distinguish the sub-sections of the referral. This title will appear on the dashboard and on the referral once it has been published.',
    description: 'Sub referral title description',
    id: 'components.SubTitleField.subTitleDescription',
  },
  register: {
    defaultMessage: 'Register',
    description: 'Text for form save button',
    id: 'components.ReferralHeaderFormField.register',
  },
});

interface ReferralHeaderFormFieldProps {
  name: string;
  value: string;
  state: 'changed' | 'saved';
  onChange: Function;
  onSuccess: Function;
  areaProperties?: {
    maxLength?: number;
    size?: TextAreaSize;
  };
}

export const ReferralHeaderFormField: React.FC<ReferralHeaderFormFieldProps> = ({
  value,
  name,
  onChange,
  state,
  onSuccess,
  areaProperties = {},
}) => {
  const patchReferralMutation = usePatchReferralAction();
  const { referral, setReferral } = useContext(ReferralContext);
  const canSave = () => {
    return (
      referral &&
      (patchReferralMutation.isIdle || patchReferralMutation.isSuccess) &&
      state === 'changed'
    );
  };

  const update = (value: string) => {
    referral &&
      patchReferralMutation.mutate(
        {
          id: referral.id,
          [name]: value,
        },
        {
          onSuccess: (referral: Referral) => {
            setReferral(referral);
            onSuccess(referral);
          },
          onError: (error) => {
            Sentry.captureException(error);
          },
        },
      );
  };

  return (
    <form
      className="flex space-x-5 justify-between w-full items-start"
      onSubmit={(e) => {
        e.preventDefault();
        if (!canSave()) return;
        update(value);
      }}
    >
      <TextArea
        id={name}
        maxLength={areaProperties?.maxLength}
        size={areaProperties?.size}
        value={value}
        className={canSave() ? 'border-b-dsfr-orange-500' : ''}
        onChange={(value: string) => onChange(value)}
        hasError={false}
      />
      <button
        type="submit"
        className={`btn-small btn btn-secondary-orange text-sm relative ${
          !canSave() ? 'tooltip tooltip-info' : ''
        } ${
          patchReferralMutation.isLoading ? 'cursor-wait text-transparent' : ''
        }`}
        data-tooltip={'Les modifications sont enregistrées'}
        aria-busy={patchReferralMutation.isLoading}
        aria-disabled={!canSave() || patchReferralMutation.isLoading}
      >
        <span
          className={`${
            patchReferralMutation.isLoading ? 'text-transparent' : ''
          }`}
        >
          <FormattedMessage {...messages.register} />
        </span>
        {patchReferralMutation.isLoading && (
          <div className="absolute inset-0 flex items-center">
            <Spinner size="small" color="#8080D1" className="inset-0" />
          </div>
        )}
      </button>
    </form>
  );
};
