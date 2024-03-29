import * as Sentry from '@sentry/react';
import { assign, EventObject, Machine, StateSchema } from 'xstate';

import { SerializableState } from 'components/RichText/types';
import { Referral, ReferralUrgency, RequesterUnitType } from 'types';
import { Maybe } from 'types/utils';

export type fieldName =
  | 'context'
  | 'files'
  | 'object'
  | 'prior_work'
  | 'question'
  | 'topic'
  | 'urgency_level'
  | 'urgency_explanation'
  | 'requester_unit_contact'
  | 'requester_unit_type';

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
              CHANGE: { target: 'true' },
              CLEAN: { target: 'true' },
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
              INIT: { target: 'processing', actions: ['setValue'] },
            },
          },
          valid: {
            on: {
              CHANGE: { target: 'processing', actions: ['setValue'] },
              INIT: { target: 'processing', actions: ['setValue'] },
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
 * Machine to manage a form field for the type of service the requester is from.
 */
export const RequesterUnitTypeFieldMachine = getFieldMachine(
  RequesterUnitType.CENTRAL_UNIT,
);

/**
 * Machine to manage a form field for an urgency level object.
 */
export const UrgencyLevelFieldMachine = getFieldMachine(
  undefined as Maybe<ReferralUrgency>,
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
}>({
  context: {
    fields: {
      context: null!,
      files: null!,
      object: null!,
      prior_work: null!,
      question: null!,
      topic: null!,
      urgency_level: null!,
      urgency_explanation: null!,
      requester_unit_contact: null!,
      requester_unit_type: null!,
    },
    updatedReferral: null!,
  },
  id: 'referralFormMachine',
  initial: 'interactive',
  states: {
    interactive: {
      on: {
        SAVE_PROGRESS: { target: 'saving_progress' },
        SEND: { target: 'processing' },
        UPDATE: {
          target: 'debouncing',
          actions: assign({
            fields: (context, event) => ({
              ...context.fields,
              [event.fieldName]: event.payload,
            }),
          }),
        },
      },
    },
    debouncing: {
      after: {
        '2000': 'saving_progress',
      },
      on: {
        SAVE_PROGRESS: { target: 'saving_progress' },
        SEND: { target: 'processing' },
        UPDATE: {
          target: 'debouncing',
          actions: assign({
            fields: (context, event) => ({
              ...context.fields,
              [event.fieldName]: event.payload,
            }),
          }),
        },
      },
    },
    saving_progress: {
      invoke: {
        id: 'updateReferral',
        onDone: [
          { target: 'interactive', actions: 'invalidateRelatedQueries' },
        ],
        onError: { target: 'failure', actions: 'handleError' },
        src: 'updateReferral',
      },
      on: {
        SEND: { target: 'processing' },
        UPDATE: {
          target: 'debouncing',
          actions: assign({
            fields: (context, event) => ({
              ...context.fields,
              [event.fieldName]: event.payload,
            }),
          }),
        },
      },
    },
    processing: {
      always: [
        { target: 'sending', cond: 'isValid' },
        { target: 'interactive', actions: ['scrollToTop'] },
      ],
      entry: ['cleanAllFields'],
    },
    sending: {
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
      },
    },
    success: {
      entry: ['redirect'],
    },
    failure: {},
  },
});
