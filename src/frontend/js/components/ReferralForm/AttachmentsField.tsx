import { useMachine } from '@xstate/react';
import React, { useEffect } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { useUIDSeed } from 'react-uid';
import { assign, Sender } from 'xstate';

import { AttachmentsFormField } from 'components/AttachmentsFormField';
import { FilesFieldMachine, UpdateEvent } from './machines';
import { CleanAllFieldsProps } from '.';

const messages = defineMessages({
  description: {
    defaultMessage:
      'Formal letter of referral, any documents necessary to understand and analyze the question, any prior work',
    description:
      'Description for the file attachments field in the referral form',
    id: 'components.ReferralForm.AttachmentsField.description',
  },
  label: {
    defaultMessage: 'File attachments',
    description: 'Label for the file attachments field in the referral form',
    id: 'components.ReferralForm.AttachmentsField.label',
  },
});

interface AttachmentsFieldProps extends CleanAllFieldsProps {
  sendToParent: Sender<UpdateEvent<File[]>>;
}

export const AttachmentsField: React.FC<AttachmentsFieldProps> = ({
  cleanAllFields,
  sendToParent,
}) => {
  const seed = useUIDSeed();

  const [state, send] = useMachine(FilesFieldMachine, {
    actions: {
      setValue: assign({
        value: (_, event) => event.data,
      }),
    },
    guards: {
      isValid: () => true,
    },
  });

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
      fieldName: 'files',
      type: 'UPDATE',
    });
  }, [state.value, state.context]);

  return (
    <div className="mb-8">
      <label
        id={seed('referral-attachments-label')}
        className="mb-1 font-semibold"
      >
        <FormattedMessage {...messages.label} />
      </label>
      <p
        id={seed('referral-attachments-description')}
        className="text-gray-600 mt-0 mb-1"
      >
        <FormattedMessage {...messages.description} />
      </p>
      <AttachmentsFormField
        aria-describedby={seed('referral-attachments-description')}
        aria-labelledby={seed('referral-attachments-label')}
        files={state.context.value}
        setFiles={(files: File[]) => send({ type: 'CHANGE', data: files })}
      />
    </div>
  );
};
