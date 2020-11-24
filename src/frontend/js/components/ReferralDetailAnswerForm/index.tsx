import * as Sentry from '@sentry/react';
import { useMachine } from '@xstate/react';
import React, { useContext, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  defineMessages,
  FormattedDate,
  FormattedMessage,
  FormattedTime,
} from 'react-intl';
import { QueryStatus, useQueryCache } from 'react-query';
import { useUIDSeed } from 'react-uid';
import { AnyEventObject, assign, AssignAction, Machine } from 'xstate';

import { appData } from 'appData';
import { AnswerAttachmentsListEditor } from 'components/AnswerAttachmentsListEditor';
import { GenericErrorMessage } from 'components/GenericErrorMessage';
import { ShowAnswerFormContext } from 'components/ReferralDetail';
import { RichTextField } from 'components/RichText/field';
import { SerializableState } from 'components/RichText/types';
import { Spinner } from 'components/Spinner';
import { useReferralAnswer } from 'data';
import { Referral, ReferralAnswer, ReferralAnswerAttachment } from 'types';
import { getUserFullname } from 'utils/user';
import { AttachmentUploader } from './AttachmentUploader';

const messages = defineMessages({
  answerLastUpdated: {
    defaultMessage: 'Answer updated on { date } at { time }',
    description:
      'Informational text alerting the user when we last updated the referral answer in the background',
    id: 'components.ReferralDetailAnswerForm.answerLastUpdated',
  },
  attachmentsTitle: {
    defaultMessage: 'Answer attachments',
    description:
      'Title for the list of attachments & attachments field in the answer form.',
    id: 'components.ReferralDetailAnswerForm.attachmentsTitle',
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
  dropzone: {
    defaultMessage: 'Drag and drop some files here, or click to select files',
    description:
      'Helper text in the file dropzone input in the attachments form field.',
    id: 'components.AttachmentsFormField.dropzone',
  },
  failedToUpdateAnswer: {
    defaultMessage: 'Failed to update answer content.',
    description:
      'Informational text alerting the user when we failed to update the referral answer in the background',
    id: 'components.ReferralDetailAnswerForm.failedToUpdateAnswer',
  },
  loadingAnswer: {
    defaultMessage: 'Loading answer...',
    description:
      'Accessibility message for the spinner while loading the referral answer in the answer form.',
    id: 'components.ReferralDetailAnswerForm.loadingAnswer',
  },
  startWriting: {
    defaultMessage: 'You need to start writing an answer to send it.',
    description:
      'Explanation next to the disabled submit button when writing a referral answer.',
    id: 'components.ReferralDetailAnswerForm.startWriting',
  },
  title: {
    defaultMessage: 'Referral answer draft',
    description:
      'Title for the draft answer creation form that appears in the referral detail view.',
    id: 'components.ReferralDetailAnswerForm.title',
  },
  updateAnswer: {
    defaultMessage: 'Update the answer',
    description: 'Button to update the answer content in referral answer form',
    id: 'components.ReferralDetailAnswerForm.updateAnswer',
  },
  updatingAnswer: {
    defaultMessage: 'Updating answer content...',
    description:
      'Informational text alerting the user while we are updating the referral answer in the background',
    id: 'components.ReferralDetailAnswerForm.updatingAnswer',
  },
});

interface UpdateAnswerMachineContext {
  shouldCloseForm: boolean;
  textContent: string;
  serializableState: SerializableState;
}

const forceUpdateAnswerTransition: {
  target: string;
  actions: AssignAction<UpdateAnswerMachineContext, AnyEventObject>[];
} = {
  target: 'loading',
  actions: [
    assign({
      shouldCloseForm: (_) => true,
    }),
  ],
};

const updateAnswerTransition: {
  target: string;
  actions: AssignAction<UpdateAnswerMachineContext, AnyEventObject>[];
} = {
  target: 'debouncing',
  actions: [
    assign({
      serializableState: (_, event) => event.data.serializableState,
      textContent: (_, event) => event.data.textContent,
    }),
  ],
};

const updateAnswerMachine = Machine<UpdateAnswerMachineContext>({
  context: {
    shouldCloseForm: false,
    serializableState: {
      doc: {
        type: 'doc',
        content: [{ type: 'paragraph' }],
      },
      selection: { type: 'text', anchor: 1, head: 1 },
    } as SerializableState,
    textContent: '',
  },
  id: 'updateAnswerMachine',
  initial: 'idle',
  states: {
    idle: {
      on: {
        FORCE_UPDATE_ANSWER: forceUpdateAnswerTransition,
        INIT: {
          target: 'idle',
          actions: [
            assign({
              serializableState: (_, event) => event.data.serializableState,
              textContent: (_, event) => event.data.textContent,
            }),
          ],
        },
        UPDATE_ANSWER: updateAnswerTransition,
      },
    },
    debouncing: {
      after: {
        '2000': 'loading',
      },
      on: {
        FORCE_UPDATE_ANSWER: forceUpdateAnswerTransition,
        UPDATE_ANSWER: updateAnswerTransition,
      },
    },
    loading: {
      invoke: {
        id: 'updateAnswer',
        onDone: [
          {
            target: 'idle',
            actions: ['invalidateRelatedQueries', 'closeForm'],
            cond: 'shouldCloseForm',
          },
          { target: 'idle', actions: 'invalidateRelatedQueries' },
        ],
        onError: { target: 'failure', actions: 'handleError' },
        src: 'updateAnswer',
      },
      on: {
        FORCE_UPDATE_ANSWER: forceUpdateAnswerTransition,
        UPDATE_ANSWER: updateAnswerTransition,
      },
    },
    failure: {
      on: {
        FORCE_UPDATE_ANSWER: forceUpdateAnswerTransition,
        UPDATE_ANSWER: updateAnswerTransition,
      },
    },
  },
});

interface ReferralDetailAnswerFormProps {
  answerId: ReferralAnswer['id'];
  referral: Referral;
}

export const ReferralDetailAnswerForm = ({
  answerId,
  referral,
}: ReferralDetailAnswerFormProps) => {
  const queryCache = useQueryCache();
  const seed = useUIDSeed();

  const { setShowAnswerForm } = useContext(ShowAnswerFormContext);
  const { status, data: answer } = useReferralAnswer(answerId);

  const [filesState, setFilesState] = useState<{
    attachments: ReferralAnswerAttachment[];
    files: File[];
  }>({ attachments: [], files: [] });

  const [state, send] = useMachine(updateAnswerMachine, {
    actions: {
      closeForm: () => {
        setShowAnswerForm(null);
      },
      handleError: (_, event) => {
        Sentry.captureException(event.data);
      },
      invalidateRelatedQueries: (_, event) => {
        queryCache.invalidateQueries(['referralactivities']);
        queryCache.invalidateQueries(['referralanswers', event.data.id]);
      },
    },
    guards: {
      shouldCloseForm: (ctx) => ctx.shouldCloseForm,
    },
    services: {
      updateAnswer: async (ctx) => {
        const response = await fetch(`/api/referralanswers/${answer!.id}/`, {
          body: JSON.stringify({
            ...answer!,
            content: JSON.stringify(ctx.serializableState),
          }),
          headers: {
            Authorization: `Token ${appData.token}`,
            'Content-Type': 'application/json',
          },
          method: 'PUT',
        });
        if (!response.ok) {
          throw new Error(
            'Failed to get update answer content in ReferralDetailAnswerForm.',
          );
        }
        return await response.json();
      },
    },
  });

  const onDrop = (acceptedFiles: File[]) => {
    setFilesState((previousState) => ({
      attachments: previousState.attachments,
      files: [...previousState.files, ...acceptedFiles],
    }));
  };
  const onDone = (file: File, attachment: ReferralAnswerAttachment) => {
    setFilesState((previousState) => ({
      attachments: [...previousState.attachments, attachment],
      files: previousState.files.filter(
        (existingFile) => file !== existingFile,
      ),
    }));
  };
  const { getRootProps, getInputProps } = useDropzone({ onDrop });

  switch (status) {
    case QueryStatus.Idle:
    case QueryStatus.Loading:
      return (
        <Spinner>
          <FormattedMessage {...messages.loadingAnswer} />
        </Spinner>
      );

    case QueryStatus.Error:
      return <GenericErrorMessage />;

    case QueryStatus.Success:
      return (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send('FORCE_UPDATE_ANSWER');
          }}
          aria-labelledby={seed('form-label')}
          id={`answer-${answerId}-form`}
          className="max-w-sm w-full lg:max-w-full border-gray-600 p-10 mt-8 mb-8 rounded-xl border border-dashed"
        >
          <h4 id={seed('form-label')} className="text-4xl mb-6">
            <FormattedMessage {...messages.title} />
          </h4>

          <section className="mb-6">
            <div className="font-semibold">
              <FormattedMessage
                {...messages.byWhom}
                values={{
                  name: getUserFullname(answer!.created_by),
                  unit_name: referral.topic.unit.name,
                }}
              />
            </div>
            <div className="text-gray-600">{answer!.created_by.email}</div>
            <div className="text-gray-600">
              {answer!.created_by.phone_number}
            </div>
          </section>

          <label className="block mb-2" id={seed('content-input-label')}>
            <FormattedMessage {...messages.contentInputLabel} />
          </label>
          <RichTextField
            aria-labelledby={seed('content-input-label')}
            enableHeadings={true}
            initialContent={answer!.content}
            onChange={(e) => {
              switch (e.cause) {
                case 'INIT':
                  send({ type: 'INIT', data: e.data });
                  break;

                case 'CHANGE':
                  send({ type: 'UPDATE_ANSWER', data: e.data });
                  break;
              }
            }}
          />

          <label id={seed('attachments-list')} className="block mt-6 mb-2">
            <FormattedMessage {...messages.attachmentsTitle} />
          </label>
          {!!answer!.attachments.length ? (
            <AnswerAttachmentsListEditor
              answerId={answer!.id}
              attachments={[
                ...answer!.attachments,
                // Show the attachments we created, filtering our the ones already present in the list
                // of attachments on the answer.
                // This is useful to avoid race conditions where files blink out before attachments blink in
                ...filesState.attachments.filter(
                  (attachment) =>
                    answer!.attachments.findIndex(
                      (attchmnt) => attchmnt.id === attachment.id,
                    ) === -1,
                ),
              ]}
              labelId={seed('attachments-list')}
            />
          ) : null}
          <>
            <ul className="list-group mt-2">
              {filesState.files.map((file) => (
                <AttachmentUploader
                  answerId={answerId}
                  file={file}
                  key={seed(file)}
                  onDone={onDone}
                />
              ))}
            </ul>
            <div
              role="button"
              className="bg-gray-200 mt-2 py-3 px-5 border rounded text-center"
              {...getRootProps()}
            >
              <input
                {...getInputProps()}
                aria-labelled-by={seed('attachments-list')}
              />
              <p>
                <FormattedMessage {...messages.dropzone} />
              </p>
            </div>
          </>

          <div className="flex mt-6 items-center justify-between">
            {state.matches('loading') ? (
              <div className="flex ml-4 text-gray-600 mr-2">
                <FormattedMessage {...messages.updatingAnswer} />
              </div>
            ) : null}
            {state.matches('idle') || state.matches('debouncing') ? (
              <div className="flex ml-4 text-gray-600 mr-2">
                <FormattedMessage
                  {...messages.answerLastUpdated}
                  values={{
                    date: (
                      <FormattedDate
                        year="numeric"
                        month="long"
                        day="numeric"
                        value={answer!.updated_at}
                      />
                    ),
                    time: <FormattedTime value={answer!.updated_at} />,
                  }}
                />
              </div>
            ) : null}
            {state.matches('failure') ? (
              <div className="flex ml-4 text-red-600 mr-2">
                <FormattedMessage {...messages.failedToUpdateAnswer} />
              </div>
            ) : null}

            <button
              type="submit"
              className={`btn btn-blue flex justify-center  ${
                state.matches('loading') ? 'cursor-wait' : ''
              }`}
              style={{ minWidth: '12rem', minHeight: '2.5rem' }}
              aria-busy={state.matches('loading')}
            >
              {state.matches('loading') ? (
                <>
                  <Spinner
                    size="small"
                    color="white"
                    className="order-2 flex-grow-0"
                  >
                    {/* Alternate text specified by the adjoining message for the loading case */}
                  </Spinner>
                </>
              ) : (
                <FormattedMessage {...messages.updateAnswer} />
              )}
            </button>
          </div>
        </form>
      );
  }
};
