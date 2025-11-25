import React, { useContext, useEffect, useState } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { Referral, ReferralState } from 'types';
import * as Sentry from '@sentry/react';
import { usePatchReferralAction } from '../../../data/referral';
import { TextArea, TextAreaSize } from '../../text/TextArea';
import { Spinner } from '../../Spinner';
import { ReferralContext } from '../../../data/providers/ReferralProvider';
import { EditIcon } from '../../Icons';
import { SubFormStates } from '../../../data/providers/SubReferralProvider';

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

interface AutoSaveReferralHeaderFormFieldProps {
  name: string;
  value: string;
  tooltip: string;
  placeholder: string;
  icon?: React.ReactNode;
  state: SubFormStates;
  onChange: Function;
  setEditMode: Function;
  onSuccess: Function;
  areaProperties?: {
    maxLength?: number;
    size?: TextAreaSize;
  };
}

export const AutoSaveReferralHeaderFormField: React.FC<AutoSaveReferralHeaderFormFieldProps> = ({
  value,
  name,
  icon,
  onChange,
  setEditMode,
  state,
  tooltip = '',
  placeholder = '',
  onSuccess,
  areaProperties = {},
}) => {
  const [bufferedValue, setBufferedValue] = useState<string>(value);

  useEffect(() => {
    const pollForChange = setInterval(() => {
      if (value !== bufferedValue) {
        setBufferedValue(value);
        update(value);
      }
    }, 500);

    return () => {
      clearInterval(pollForChange);
    };
  }, [value, bufferedValue]);

  const patchReferralMutation = usePatchReferralAction();
  const { referral } = useContext(ReferralContext);

  const canSave = () => {
    return (
      referral &&
      (patchReferralMutation.isIdle ||
        patchReferralMutation.isSuccess ||
        patchReferralMutation.isError) &&
      state === SubFormStates.INPUT_TEXT_CHANGED
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
            onSuccess(referral);
          },
          onError: (error) => {
            Sentry.captureException(error);
          },
        },
      );
  };

  return (
    <>
      {referral && (
        <>
          {SubFormStates.READ_ONLY === state ? (
            <>
              {value && (
                <div className={`flex space-x-1 items-start text-sm`}>
                  {icon}
                  <span>{value}</span>
                </div>
              )}
            </>
          ) : (
            <>
              {[
                SubFormStates.INPUT_TEXT_SAVED,
                SubFormStates.INPUT_TEXT_CHANGED,
              ].includes(state) ? (
                <div className="flex space-x-5 justify-between w-full items-start">
                  <TextArea
                    id={name}
                    maxLength={areaProperties?.maxLength}
                    size={areaProperties?.size}
                    value={value}
                    className={canSave() ? 'border-b-dsfr-orange-500' : ''}
                    onChange={(value: string) => onChange(value)}
                    hasError={false}
                  />
                </div>
              ) : (
                <button
                  className={`h-fit w-fit cursor-pointer button-white-grey text-black flex space-x-1 items-center text-left text-sm tooltip tooltip-action px-1`}
                  data-tooltip={tooltip}
                  onClick={(e) => setEditMode(true)}
                >
                  {icon}
                  {value ? (
                    <span
                      className="whitespace-pre-line"
                      style={{ lineHeight: '24px' }}
                    >
                      {' '}
                      {value}{' '}
                    </span>
                  ) : (
                    <span
                      style={{ lineHeight: '24px' }}
                      className="text-grey-500"
                    >
                      {placeholder}{' '}
                    </span>
                  )}
                  <div className="h-7 w-7 flex items-center">
                    <EditIcon className="fill-grey400" />
                  </div>
                </button>
              )}
            </>
          )}
        </>
      )}
    </>
  );
};
