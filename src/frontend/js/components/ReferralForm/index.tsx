import * as Sentry from '@sentry/react';
import { useMachine } from '@xstate/react';
import React, { useState } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';

import { appData } from 'appData';
import { Spinner } from 'components/Spinner';
import { useCurrentUser } from 'data/useCurrentUser';
import { Referral } from 'types';
import { sendForm } from 'utils/sendForm';
import { getUserFullname } from 'utils/user';

import { AttachmentsField } from './AttachmentsField';
import { ContextField } from './ContextField';
import { ReferralFormMachine } from './machines';
import { ObjectField } from './ObjectField';
import { PriorWorkField } from './PriorWorkField';
import { QuestionField } from './QuestionField';
import { RequesterField } from './RequesterField';
import { TopicField } from './TopicField';
import { UrgencyField } from './UrgencyField';
import { UrgencyExplanationField } from './UrgencyExplanationField';

const messages = defineMessages({
  byWhom: {
    defaultMessage: 'By {name}, {unit_name}',
    description: 'Author of the referral',
    id: 'components.ReferralForm.byWhom',
  },
  completionWarning: {
    defaultMessage:
      'Once you submit the form, you will no longer be able to change your referral. ' +
      'Please ensure it is complete before you submit it.',
    description:
      'Warning at the bottom of the referral form before the user submits it',
    id: 'components.ReferralForm.completionWarning',
  },
  loadingCurrentUser: {
    defaultMessage: 'Loading current user...',
    description:
      'Accessible message for the spinner while loading the current user in referral creation form',
    id: 'components.ReferralForm.loadingCurrentUser',
  },
  sendingForm: {
    defaultMessage: 'Sending referral...',
    description:
      'Accessibility text for the spinner in submit button on the referral creation form',
    id: 'components.ReferralForm.sendingForm',
  },
  submit: {
    defaultMessage: 'Ask for a referral',
    description: 'Text for the submit button in the referral creation form',
    id: 'components.ReferralForm.submit',
  },
  title: {
    defaultMessage: 'Create a referral',
    description: 'Title for the referral creation form',
    id: 'components.ReferralForm.title',
  },
});

export interface CleanAllFieldsProps {
  cleanAllFields: boolean;
}

export const ReferralForm: React.FC = () => {
  const { currentUser } = useCurrentUser();
  const [cleanAllFields, setCleanAllFields] = useState(false);

  const [state, send] = useMachine(ReferralFormMachine, {
    actions: {
      cleanAllFields: () => {
        setCleanAllFields(true);
      },
      redirect: (ctx) => {
        window.location.assign(
          `/requester/referral-saved/${ctx.updatedReferral.id}/`,
        );
      },
      scrollToTop: () => {
        window.scroll({
          behavior: 'smooth',
          top: 0,
        });
      },
    },
    guards: {
      isValid: (_, __, { state }) =>
        // Check if all the underlying fields are in a valid state
        Object.entries(state.context.fields)
          .map(([_, fieldState]) => fieldState.valid)
          .every((value) => !!value) &&
        (!state.context.fields.urgency_level.data.requires_justification ||
          state.context.fields.urgency_explanation.data.length > 0),
    },
    services: {
      sendForm: ({ fields }) => async (callback) => {
        try {
          const updatedReferral = await sendForm<Referral>({
            headers: { Authorization: `Token ${appData.token}` },
            keyValuePairs: [
              // Add all textual fields to the form directly
              ...Object.entries(fields)
                .filter(([key]) => !['files', 'urgency_level'].includes(key))
                .map(
                  ([key, content]) => [key, content.data] as [string, string],
                ),
              ['urgency_level', String(fields.urgency_level.data.id)],
              // Create a key-value pair with the same name each time for every file
              ...fields.files.data.map(
                (file) => ['files', file] as [string, File],
              ),
            ],

            setProgress: (progress) =>
              callback({ type: 'UPDATE_PROGRESS', progress }),
            url: `/api/referrals/`,
          });
          callback({ type: 'FORM_SUCCESS', data: updatedReferral });
        } catch (error) {
          Sentry.captureException(error, { extra: fields });
          callback({ type: 'FORM_FAILURE', data: error });
        }
      },
    },
  });

  return (
    <section className="container max-w-3xl mx-auto">
      <h1 className="text-4xl my-4">
        <FormattedMessage {...messages.title} />
      </h1>

      {currentUser ? (
        <>
          <div className="font-semibold">
            <FormattedMessage
              {...messages.byWhom}
              values={{
                name: getUserFullname(currentUser),
                unit_name: currentUser.unit_name,
              }}
            />
          </div>
          <div className="text-gray-500">{currentUser.email}</div>
          {currentUser.phone_number ? (
            <div className="text-gray-500">{currentUser.phone_number}</div>
          ) : null}
        </>
      ) : (
        <Spinner size="large">
          <FormattedMessage {...messages.loadingCurrentUser} />
        </Spinner>
      )}

      <form
        encType="multipart/form-data"
        method="POST"
        className="my-8"
        onSubmit={(e) => {
          e.preventDefault();
          send('SUBMIT');
        }}
      >
        {currentUser ? (
          <RequesterField
            sendToParent={send}
            cleanAllFields={cleanAllFields}
            user={currentUser}
          />
        ) : (
          <Spinner size="large">
            <FormattedMessage {...messages.loadingCurrentUser} />
          </Spinner>
        )}

        <TopicField sendToParent={send} cleanAllFields={cleanAllFields} />

        <ObjectField sendToParent={send} cleanAllFields={cleanAllFields} />

        <QuestionField sendToParent={send} cleanAllFields={cleanAllFields} />

        <ContextField sendToParent={send} cleanAllFields={cleanAllFields} />

        <PriorWorkField sendToParent={send} cleanAllFields={cleanAllFields} />

        <AttachmentsField sendToParent={send} cleanAllFields={cleanAllFields} />

        <UrgencyField sendToParent={send} cleanAllFields={cleanAllFields} />

        <UrgencyExplanationField
          isRequired={
            !!state.context.fields.urgency_level?.data?.requires_justification
          }
          sendToParent={send}
          cleanAllFields={cleanAllFields}
        />

        <p className="text-gray-500 mb-4">
          <FormattedMessage {...messages.completionWarning} />
        </p>

        <button
          type="submit"
          className={`btn btn-primary flex justify-center ${
            state.matches('loading') ? 'cursor-wait' : ''
          }`}
          style={{ minWidth: '12rem', minHeight: '2.5rem' }}
          aria-busy={state.matches('loading')}
        >
          {state.matches('interactive') ? (
            <FormattedMessage {...messages.submit} />
          ) : state.matches('loading') ? (
            <>
              <Spinner
                size="small"
                color="white"
                className="order-2 flex-grow-0"
              >
                <FormattedMessage {...messages.sendingForm} />
              </Spinner>
            </>
          ) : null}
        </button>
      </form>
    </section>
  );
};
