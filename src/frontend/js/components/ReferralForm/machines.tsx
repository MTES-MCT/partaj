import * as Sentry from '@sentry/react';
import { assign, EventObject, Machine, StateSchema } from 'xstate';

import { SerializableState } from 'components/RichText/types';
import { Referral, ReferralUrgency } from 'types';
import { Nullable } from 'types/utils';

export type fieldName =
  | 'context'
  | 'files'
  | 'prior_work'
  | 'question'
  | 'requester'
  | 'topic'
  | 'urgency_level'
  | 'urgency_explanation';

export interface FieldState<T = string> {
  clean: boolean;
  data: T;
  valid: boolean;
}

export interface UpdateEvent<T = string> extends EventObject {
  fieldName: fieldName;
  payload: FieldState<T>;
}

export interface FieldMachineContext<T = string> {
  value: T;
}

export type FieldMachineEvent<T = string> = EventObject & { data: T };

/**
 * Get generically typed machines for various kinds of data
 */
const getFieldMachine = <T,>(initialValue: T) =>
  Machine<FieldMachineContext<T>, StateSchema<any>, FieldMachineEvent<T>>({
    context: {
      value: initialValue,
    },
    id: 'FieldMachine',
    type: 'parallel',
    states: {
      cleaned: {
        initial: 'false',
        states: {
          true: {
            type: 'final',
          },
          false: {
            on: {
              SUBMIT: { target: 'true' },
            },
          },
        },
      },
      validation: {
        initial: 'processing',
        states: {
          invalid: {
            on: {
              CHANGE: { target: 'processing', actions: ['setValue'] },
            },
          },
          valid: {
            on: {
              CHANGE: { target: 'processing', actions: ['setValue'] },
            },
          },
          processing: {
            on: {
              '': [{ target: 'valid', cond: 'isValid' }, { target: 'invalid' }],
            },
          },
        },
      },
    },
  });

/**
 * Machine to manage a form field whose type is a generic string.
 */
export const TextFieldMachine = getFieldMachine('');

/**
 * Machine to manage a form field for a Rich text field.
 */
export const RichTextFieldMachine = getFieldMachine({
  textContent: '',
  serializableState: {
    doc: {
      type: 'doc',
      content: [{ type: 'paragraph' }],
    },
  } as SerializableState,
});

/**
 * Machine to manage a form field for a list of file objects.
 */
export const FilesFieldMachine = getFieldMachine([] as File[]);

/**
 * Machine to manage a form field for an urgency level object.
 */
export const UrgencyLevelFieldMachine = getFieldMachine(
  null as Nullable<ReferralUrgency>,
);

/**
 * Machine to manage the complete referral form, delegating to FieldMachines for each field.
 */
export const ReferralFormMachine = Machine<{
  fields: Record<Exclude<fieldName, 'files' | 'urgency_level'>, FieldState> & {
    files: FieldState<File[]>;
    urgency_level: FieldState<ReferralUrgency>;
  };
  updatedReferral: Referral;
  uploadProgress: number;
}>({
  context: {
    fields: {
      context: null!,
      files: null!,
      prior_work: null!,
      question: null!,
      requester: null!,
      topic: null!,
      urgency_level: null!,
      urgency_explanation: null!,
    },
    updatedReferral: null!,
    uploadProgress: 0,
  },
  id: 'referralFormMachine',
  initial: 'interactive',
  states: {
    interactive: {
      on: {
        SUBMIT: { target: 'loading', cond: 'isValid' },
        UPDATE: {
          actions: assign({
            fields: (context, event: UpdateEvent) => ({
              ...context.fields,
              [event.fieldName]: event.payload,
            }),
          }),
        },
      },
    },
    loading: {
      invoke: {
        id: 'sendForm',
        src: 'sendForm',
      },
      on: {
        FORM_FAILURE: {
          actions: (_, event) => {
            Sentry.captureException(new Error(event.data));
          },
          target: 'failure',
        },
        FORM_SUCCESS: {
          actions: assign({ updatedReferral: (_, event) => event.data }),
          target: 'success',
        },
        UPDATE_PROGRESS: {
          actions: assign({ uploadProgress: (_, event) => event.progress }),
        },
      },
    },
    success: {
      entry: ['redirect'],
    },
    failure: {},
  },
});
