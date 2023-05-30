import { useMachine } from '@xstate/react';
import React, { ReactNode, useCallback, useEffect } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { useUIDSeed } from 'react-uid';
import { assign, Sender } from 'xstate';

import { RequesterUnitTypeFieldMachine, UpdateEvent } from './machines';
import { CleanAllFieldsProps } from '.';
import { DescriptionText } from '../styled/text/DescriptionText';
import { RequesterUnitType } from 'types';

const messages = defineMessages({
  description: {
    defaultMessage:
      'Please inform if you work in a decentralised service or in central administration',
    description: 'Description for the service type field in the referral form',
    id: 'components.ReferralForm.RequesterUnitTypeField.description',
  },
  centralAdminToggle: {
    defaultMessage: "I'm from central administration",
    description:
      'Toggle button to select if the user is from central administration',
    id: 'components.ReferralForm.RequesterUnitTypeField.centralAdminToggle',
  },
  decentralisedToggle: {
    defaultMessage: "I'm from a decentralised service",
    description:
      'Toggle button to select if the user is from a decentralised service',
    id: 'components.ReferralForm.RequesterUnitTypeField.decentralisedToggle',
  },
  label: {
    defaultMessage: "Referral provider's service",
    description: 'Label for the service type field in the referral form',
    id: 'components.ReferralForm.RequesterUnitTypeField.label',
  },
});

interface ToggleButtonProps {
  selected?: boolean;
  onClick?: () => void;
  className?: string;
  children?: ReactNode;
}

const ToggleButton = ({
  selected,
  children,
  className,
  onClick,
}: ToggleButtonProps) => (
  <button
    className={`${className} w-64 base-btn border border-primary-500 ${
      selected ? 'text-white bg-primary-500' : 'text-primary-500 bg-white'
    } font-medium px-3 py-2 rounded-sm`}
    onClick={(e) => {
      e.preventDefault();
      onClick?.();
    }}
  >
    {children}
  </button>
);

interface RequesterUnitTypeFieldProps extends CleanAllFieldsProps {
  sendToParent: Sender<UpdateEvent<RequesterUnitType>>;
  requesterUnitType?: RequesterUnitType;
}

export const RequesterUnitTypeField: React.FC<RequesterUnitTypeFieldProps> = ({
  cleanAllFields,
  sendToParent,
  requesterUnitType,
  children,
}) => {
  const seed = useUIDSeed();

  const [state, send] = useMachine(RequesterUnitTypeFieldMachine, {
    context: {
      value: requesterUnitType,
    },
    actions: {
      setValue: assign({
        value: (_, event) => event.data,
      }),
    },
    guards: {
      isValid: (context) => context.value.length > 0,
    },
  });

  const handleToggleUnitType = useCallback(
    (unitType?: RequesterUnitType) => {
      send({
        type: 'CHANGE',
        data:
          unitType === RequesterUnitType.CENTRAL_UNIT
            ? RequesterUnitType.DECENTRALISED_UNIT
            : RequesterUnitType.CENTRAL_UNIT,
      });
    },
    [send],
  );

  useEffect(() => {
    if (cleanAllFields) {
      send('CLEAN');
    }
  }, [cleanAllFields]);

  // Send an update to the parent whenever the state or context changes
  useEffect(() => {
    sendToParent({
      payload: {
        clean: state.matches('cleaned.true'),
        data: state.context.value,
        valid: state.matches('validation.valid'),
      },
      fieldName: 'requester_unit_type',
      type: 'UPDATE',
    });
  }, [state.value, state.context]);

  return (
    <div className="mb-8">
      <label
        htmlFor={seed('referral-object-label')}
        className="mb-1 font-semibold"
      >
        <FormattedMessage {...messages.label} />
      </label>
      <DescriptionText>
        <FormattedMessage {...messages.description} />
      </DescriptionText>
      <div className="flex flex-row">
        <ToggleButton
          onClick={() => handleToggleUnitType(state.context.value)}
          selected={
            state.context.value === RequesterUnitType.DECENTRALISED_UNIT
          }
          className="mr-6"
        >
          <FormattedMessage {...messages.decentralisedToggle} />
        </ToggleButton>
        <ToggleButton
          onClick={() => handleToggleUnitType(state.context.value)}
          selected={state.context.value === RequesterUnitType.CENTRAL_UNIT}
        >
          <FormattedMessage {...messages.centralAdminToggle} />
        </ToggleButton>
      </div>
      {children}
    </div>
  );
};
