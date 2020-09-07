import * as Sentry from '@sentry/react';
import { useMachine } from '@xstate/react';
import React, { useState, useContext } from 'react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { useUIDSeed } from 'react-uid';
import { assign, Machine } from 'xstate';

import { AttachmentsFormField } from 'components/AttachmentsFormField';
import { ReferralActivityIndicatorLook } from 'components/ReferralActivityDisplay/ReferralActivityIndicatorLook';
import { ShowAnswerFormContext } from 'components/ReferralDetail';
import { RichTextField } from 'components/RichText/field';
import { SerializableState } from 'components/RichText/types';
import { Spinner } from 'components/Spinner';
import { useCurrentUser } from 'data/useCurrentUser';
import { Referral } from 'types';
import { ContextProps } from 'types/context';
import { sendForm } from 'utils/sendForm';
import { getUserFullname } from 'utils/user';

const messages = defineMessages({
  answer: {
    defaultMessage: 'Referral answer',
    description: 'Title for the answer part of the referral detail view',
    id: 'components.ReferralDetailAnswerForm.answer',
  },
  byWhom: {
    defaultMessage: 'By {name}, {unit_name}',
    description: 'Author of the referral answer',
    id: 'components.ReferralDetailAnswerForm.byWhom',
  },
  contentInputLabel: {
    defaultMessage: 'Add an answer for this referral',
    description: 'Label for the content input field for a referral answer',
    id: 'components.ReferralDetailAnswerForm.contentInputLabel',
  },
  filesInputLabel: {
    defaultMessage: 'Add attachments to your answer',
    description: 'Label for the filres input field for a referral answer',
    id: 'components.ReferralDetailAnswerForm.filesInputLabel',
  },
  indicatorIsWritingAnAnswer: {
    defaultMessage: '{ authorName } is writing an answer',
    description:
      'Timeline indicator text for the user currently writing a referral answer',
    id: 'components.ReferralDetailAnswerForm.indicatorIsWritingAnAnswer',
  },
  indicatorRightNow: {
    defaultMessage: 'Right now...',
    description:
      'Timeline indicator timing information for the user currently writing a referral answer',
    id: 'components.ReferralDetailAnswerForm.indicatorRightNow',
  },
  indicatorSomeone: {
    defaultMessage: 'Someone',
    description:
      "Replace the current user's name if it is missing in the timeline element",
    id: 'components.ReferralDetailAnswerForm.indicatorSomeone',
  },
  sendingForm: {
    defaultMessage: 'Sending answer...',
    description:
      'Accessibility text for the spinner in submit button on the referral answer form',
    id: 'components.ReferralDetailAnswerForm.sendingForm',
  },
  startWriting: {
    defaultMessage: 'You need to start writing an answer to send it.',
    description:
      'Explanation next to the disabled submit button when writing a referral answer.',
    id: 'components.ReferralDetailAnswerForm.startWriting',
  },
  submitAnswer: {
    defaultMessage: 'Answer the referral',
    description: 'Button to submit the answer to a referral',
    id: 'components.ReferralDetailAnswerForm.submitAnswer',
  },
});

interface sendFormMachineContext {
  progress: number;
}

const sendFormMachine = Machine<sendFormMachineContext>({
  context: {
    progress: 0,
  },
  id: 'sendFormMachine',
  initial: 'ready',
  states: {
    ready: {
      on: {
        SUBMIT: 'loading',
      },
    },
    loading: {
      invoke: {
        id: 'setAssignment',
        onDone: {
          target: 'success',
          actions: ['setReferral', 'setShowAnswerForm'],
        },
        onError: { target: 'failure', actions: 'handleError' },
        src: 'sendForm',
      },
      on: {
        FORM_FAILURE: {
          actions: 'handleError',
          target: 'failure',
        },
        FORM_SUCCESS: {
          actions: ['setReferral', 'setShowAnswerForm'],
          target: 'success',
        },
        UPDATE_PROGRESS: {
          actions: assign({ progress: (_, event) => event.progress }),
        },
      },
    },
    success: {
      type: 'final',
    },
    failure: {},
  },
});

interface ReferralDetailAnswerFormProps {
  referral: Referral;
  setReferral: (referral: Referral) => void;
}

export const ReferralDetailAnswerForm = ({
  context,
  referral,
  setReferral,
}: ReferralDetailAnswerFormProps & ContextProps) => {
  const intl = useIntl();
  const seed = useUIDSeed();

  const { currentUser } = useCurrentUser();
  const { setShowAnswerForm } = useContext(ShowAnswerFormContext);

  const [files, setFiles] = useState<File[]>([]);

  const [answer, setAnswer] = useState<{
    textContent: string;
    serializableState: SerializableState;
  }>({
    textContent: '',
    serializableState: {
      doc: {
        type: 'doc',
        content: [{ type: 'paragraph' }],
      },
    } as SerializableState,
  });
  const isAnswerContentValid = answer.textContent.length > 5;

  const [state, send] = useMachine(sendFormMachine, {
    actions: {
      handleError: (_, event) => {
        Sentry.captureException(event.data);
      },
      setShowAnswerForm: () => {
        setShowAnswerForm(false);
      },
      setReferral: (_, event) => {
        setReferral(event.data);
      },
    },
    services: {
      sendForm: () => async (callback) => {
        try {
          const updatedReferral = await sendForm<Referral>({
            headers: { Authorization: `Token ${context.token}` },
            keyValuePairs: [
              ['content', JSON.stringify(answer.serializableState)],
              ...files.map((file) => ['files', file] as [string, File]),
            ],
            setProgress: (progress) =>
              callback({ type: 'UPDATE_PROGRESS', progress }),
            url: `/api/referrals/${referral!.id}/answer/`,
          });
          callback({ type: 'FORM_SUCCESS', data: updatedReferral });
        } catch (error) {
          callback({ type: 'FORM_FAILURE', data: error });
        }
      },
    },
  });

  return (
    <>
      <ReferralActivityIndicatorLook
        context={context}
        topLine={
          <FormattedMessage
            {...messages.indicatorIsWritingAnAnswer}
            values={{
              authorName: currentUser
                ? getUserFullname(currentUser)
                : intl.formatMessage(messages.indicatorSomeone),
            }}
          />
        }
        bottomLine={<FormattedMessage {...messages.indicatorRightNow} />}
      />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (isAnswerContentValid) {
            send('SUBMIT');
          }
        }}
        aria-labelledby={seed('form-label')}
        className="max-w-sm w-full lg:max-w-full border-gray-600 p-10 mt-8 mb-8 rounded-xl border"
      >
        <h4 id={seed('form-label')} className="text-4xl mb-6">
          <FormattedMessage {...messages.answer} />
        </h4>

        <section className="mb-6">
          <div className="font-semibold">
            <FormattedMessage
              {...messages.byWhom}
              values={{
                name: getUserFullname(currentUser!),
                unit_name: referral.topic.unit.name,
              }}
            />
          </div>
          <div className="text-gray-600">{currentUser?.email}</div>
          <div className="text-gray-600">{currentUser?.phone_number}</div>
        </section>

        <label className="block mb-2" htmlFor={seed('content-input-label')}>
          <FormattedMessage {...messages.contentInputLabel} />
        </label>
        <RichTextField
          enableHeadings={true}
          onChange={(e) => setAnswer(e.data)}
        />

        <label className="block mt-6 mb-2" id={seed('files-input-label')}>
          <FormattedMessage {...messages.filesInputLabel} />
        </label>
        <AttachmentsFormField
          context={context}
          files={files}
          aria-labelledby={seed('files-input-label')}
          setFiles={setFiles}
        />

        <div className="flex mt-6 items-center justify-end">
          {isAnswerContentValid ? null : (
            <div className="flex ml-4 text-gray-600 mr-2">
              <FormattedMessage {...messages.startWriting} />
            </div>
          )}
          <button
            type="submit"
            className={`btn btn-blue flex justify-center ${
              isAnswerContentValid ? '' : 'opacity-50 cursor-not-allowed'
            } ${state.matches('loading') ? 'cursor-wait' : ''}`}
            style={{ minWidth: '12rem', minHeight: '2.5rem' }}
            aria-disabled={!isAnswerContentValid}
            aria-busy={state.matches('loading')}
          >
            {state.matches('ready') ? (
              <FormattedMessage {...messages.submitAnswer} />
            ) : state.matches('loading') ? (
              <>
                <Spinner
                  size="small"
                  color="white"
                  className="order-2 flex-grow-0"
                >
                  <FormattedMessage {...messages.sendingForm} />
                </Spinner>
                {state.context.progress < 100 ? (
                  <span className="order-1 mr-4">
                    {state.context.progress}%
                  </span>
                ) : null}
              </>
            ) : null}
          </button>
        </div>
      </form>
    </>
  );
};
