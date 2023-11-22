import * as Sentry from '@sentry/react';
import { useMachine } from '@xstate/react';
import React, { useEffect, useState } from 'react';
import {
  defineMessages,
  FormattedDate,
  FormattedMessage,
  FormattedTime,
} from 'react-intl';
import { Redirect, useParams } from 'react-router-dom';
import { useQueryClient } from 'react-query';

import { appData } from 'appData';
import { GenericErrorMessage } from 'components/GenericErrorMessage';
import { Spinner } from 'components/Spinner';
import { useCurrentUser } from 'data/useCurrentUser';
import { Referral, RequesterUnitType } from 'types';
import { sendForm } from 'utils/sendForm';
import { getUserFullname } from 'utils/user';

import { useReferral } from 'data';
import { AttachmentsField } from './AttachmentsField';
import { ContextField } from './ContextField';
import { ReferralFormMachine } from './machines';
import { ObjectField } from './ObjectField';
import { PriorWorkField } from './PriorWorkField';
import { QuestionField } from './QuestionField';
import { TopicField } from './TopicField';
import { UrgencyField } from './UrgencyField';
import { UrgencyExplanationField } from './UrgencyExplanationField';
import { ReferralUsersBlock } from '../ReferralUsers/ReferralUsersBlock';
import { ReferralProvider } from '../../data/providers/ReferralProvider';
import { ReferralUsersModalProvider } from '../../data/providers/ReferralUsersModalProvider';
import { RoleModalProvider } from '../../data/providers/RoleModalProvider';
import { Modals } from '../modals/Modals';

import { ErrorModal } from './ErrorModal';
import { RequesterUnitTypeField } from './RequesterUnitTypeField';
import { RequesterUnitContactField } from './RequesterUnitContactField';

const messages = defineMessages({
  referralLastUpdated: {
    defaultMessage: 'Referral updated on { date } at { time }',
    description:
      'Informational text alerting the user when we last updated the referral in the background',
    id: 'components.ReferralForm.referralLastUpdated',
  },
  failedToUpdateReferral: {
    defaultMessage: 'Failed to update referral content.',
    description:
      'Informational text alerting the user when we failed to update the referral in the background',
    id: 'components.ReferralForm.failedToUpdateReferral',
  },
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
  sendForm: {
    defaultMessage: 'Send the referral',
    description:
      'Accessibility text for the spinner in submit button on the referral creation form',
    id: 'components.ReferralForm.sendForm',
  },
  update: {
    defaultMessage: 'Update the referral',
    description: 'Text for the submit button in the referral creation form',
    id: 'components.ReferralForm.update',
  },
  title: {
    defaultMessage: 'Create a referral',
    description: 'Title for the referral creation form',
    id: 'components.ReferralForm.title',
  },
  requesterListTitle: {
    defaultMessage: 'Requesters linked to this referral',
    description:
      'Title for the list of users linked to a referral as requesters.',
    id: 'components.ReferralForm.requesterListTitle',
  },
  requesterListExplanation: {
    defaultMessage:
      'Add the members of your department who initiated the referral. Please add at least one representative of your hierarchy',
    description:
      'Explanation text for the suggest box to add users to the referral.',
    id: 'components.ReferralForm.requesterListExplanation',
  },
  observerListTitle: {
    defaultMessage: 'Observers linked to this referral',
    description:
      'Title for the list of users linked to a referral as observers.',
    id: 'components.ReferralForm.observerListTitle',
  },
  observerListExplanation: {
    defaultMessage:
      'Add one or more persons from one or more departments interested in the outcome of the referral',
    description:
      'Explanation text for the suggest box to add users to the referral.',
    id: 'components.ReferralForm.observerListExplanation',
  },
});

export interface CleanAllFieldsProps {
  cleanAllFields: boolean;
}

interface ReferralDetailRouteParams {
  referralId: string;
}
export const ReferralForm: React.FC = ({}) => {
  const queryClient = useQueryClient();
  const { referralId } = useParams<ReferralDetailRouteParams>();

  const { currentUser } = useCurrentUser();
  const [cleanAllFields, setCleanAllFields] = useState(false);

  const { status, data: referral } = useReferral(referralId);
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string[]>([]);
  const [
    showRequesterUnitContactField,
    setShowRequesterUnitContactField,
  ] = useState<boolean>(false);

  const [state, send, service] = useMachine(ReferralFormMachine, {
    actions: {
      cleanAllFields: () => {
        setCleanAllFields(true);
      },
      invalidateRelatedQueries: () => {
        queryClient.invalidateQueries(['referrals']);
      },
      redirect: (ctx) => {
        window.location.assign(`/app/sent-referral/${ctx.updatedReferral.id}/`);
      },
      scrollToTop: () => {
        window.scroll({
          behavior: 'smooth',
          top: 0,
        });
      },
    },
    guards: {
      isValid: (_, __, { state }) => {
        // Check if all the underlying fields are in a valid state
        setErrorMessage([]);
        const isFormValid =
          Object.entries(state.context.fields)
            .map(([key, fieldState]) => {
              if (
                key === 'requester_unit_contact' &&
                state.context.fields.requester_unit_type.data ===
                  RequesterUnitType.CENTRAL_UNIT
              ) {
                return true;
              }
              !fieldState.valid &&
                setErrorMessage((prevState) => [...prevState, key + 'Error']);
              return fieldState.valid;
            })
            .every((value) => !!value) &&
          (!state.context.fields.urgency_level.data.requires_justification ||
            state.context.fields.urgency_explanation.data.length > 0);

        state.context.fields.urgency_level.data.requires_justification &&
          state.context.fields.urgency_explanation.data.length === 0 &&
          setErrorMessage((prevState) => [
            ...prevState,
            'urgency_explanationError',
          ]);

        isFormValid ? setIsErrorModalOpen(false) : setIsErrorModalOpen(true);

        return isFormValid;
      },
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
            ],
            url: `/api/referrals/${referral!.id}/send/`,
          });
          callback({ type: 'FORM_SUCCESS', data: updatedReferral });
        } catch (error) {
          Sentry.captureException(error, { extra: fields });
          callback({ type: 'FORM_FAILURE', data: error });
        }
      },
      updateReferral: ({ fields }) => async (callback) => {
        const response = await fetch(`/api/referrals/${referral!.id}/`, {
          body: JSON.stringify({
            context: fields['context'].data,
            prior_work: fields['prior_work'].data,
            object: fields['object'].data,
            topic: fields['topic'].data,
            question: fields['question'].data,
            urgency_explanation: fields['urgency_explanation'].data,
            urgency_level: fields['urgency_level'].data.id,
            requester_unit_contact:
              fields['requester_unit_contact']?.data ?? '',
            requester_unit_type: fields['requester_unit_type'].data,
          }),
          headers: {
            Authorization: `Token ${appData.token}`,
            'Content-Type': 'application/json',
          },
          method: 'PUT',
        });
        if (!response.ok) {
          throw new Error(
            'Failed to get update referral content in ReferralForm.',
          );
        }
        return await response.json();
      },
    },
  });

  useEffect(() => {
    const subscription = service.subscribe((state) => {
      setShowRequesterUnitContactField(
        state.context.fields.requester_unit_type?.data !==
          RequesterUnitType.CENTRAL_UNIT,
      );
    });

    return subscription.unsubscribe;
  }, [service]);

  switch (status) {
    case 'error':
      return <GenericErrorMessage />;

    case 'idle':
    case 'loading':
      return (
        <Spinner>
          <FormattedMessage {...messages.loadingCurrentUser} />
        </Spinner>
      );

    case 'success':
      return (
        <div className="px-8">
          {referral!.state === 'draft' ? (
            <ReferralProvider referralId={referralId}>
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
                      <div className="text-gray-500">
                        {currentUser.phone_number}
                      </div>
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
                  }}
                >
                  {referral && currentUser ? (
                    <div className="space-y-6 mb-6">
                      <ReferralUsersModalProvider>
                        <RoleModalProvider>
                          <ReferralUsersBlock />
                          <Modals />
                        </RoleModalProvider>
                      </ReferralUsersModalProvider>
                    </div>
                  ) : (
                    <Spinner size="large">
                      <FormattedMessage {...messages.loadingCurrentUser} />
                    </Spinner>
                  )}

                  <RequesterUnitTypeField
                    requesterUnitType={referral?.requester_unit_type}
                    sendToParent={send}
                    cleanAllFields={cleanAllFields}
                  >
                    {showRequesterUnitContactField && (
                      <RequesterUnitContactField
                        requesterUnitContact={referral?.requester_unit_contact}
                        sendToParent={send}
                        cleanAllFields={cleanAllFields}
                      />
                    )}
                  </RequesterUnitTypeField>

                  <TopicField
                    topicValue={referral?.topic}
                    sendToParent={send}
                    cleanAllFields={cleanAllFields}
                  />

                  <ObjectField
                    objectValue={referral?.object}
                    sendToParent={send}
                    cleanAllFields={cleanAllFields}
                  />

                  <QuestionField
                    questionValue={referral?.question}
                    sendToParent={send}
                    cleanAllFields={cleanAllFields}
                  />

                  <ContextField
                    contextValue={referral?.context}
                    sendToParent={send}
                    cleanAllFields={cleanAllFields}
                  />

                  <PriorWorkField
                    priorWorkValue={referral?.prior_work}
                    sendToParent={send}
                    cleanAllFields={cleanAllFields}
                  />

                  <AttachmentsField
                    attachments={referral!.attachments}
                    referralId={referral!.id}
                    sendToParent={send}
                    cleanAllFields={cleanAllFields}
                  />

                  <UrgencyField
                    urgencyLevel={referral?.urgency_level}
                    sendToParent={send}
                    cleanAllFields={cleanAllFields}
                  />

                  <UrgencyExplanationField
                    urgencyExplanationValue={referral?.urgency_explanation}
                    isRequired={
                      !!state.context.fields.urgency_level?.data
                        ?.requires_justification
                    }
                    sendToParent={send}
                    cleanAllFields={cleanAllFields}
                  />

                  <p className="text-gray-500 mb-4">
                    <FormattedMessage {...messages.completionWarning} />
                  </p>

                  <div className="content-start grid grid-cols-3 gap-4">
                    <button
                      type="submit"
                      className={`btn btn-primary flex justify-center ${
                        state.matches('loading') ? 'cursor-wait' : ''
                      }`}
                      style={{ minWidth: '12rem', minHeight: '2.5rem' }}
                      aria-busy={state.matches('loading')}
                      onClick={() => send('SAVE_PROGRESS')}
                    >
                      {state.matches('interactive') ? (
                        <FormattedMessage {...messages.update} />
                      ) : state.matches('saving_progress') ? (
                        <>
                          <Spinner
                            size="small"
                            color="white"
                            className="order-2 flex-grow-0"
                          />
                        </>
                      ) : (
                        <FormattedMessage {...messages.update} />
                      )}
                    </button>

                    <button
                      type="submit"
                      className={`btn btn-primary flex justify-center ${
                        state.matches('loading') ? 'cursor-wait' : ''
                      }`}
                      style={{ minWidth: '12rem', minHeight: '2.5rem' }}
                      aria-busy={state.matches('loading')}
                      onClick={() => send('SEND')}
                    >
                      {state.matches('interactive') ? (
                        <FormattedMessage {...messages.sendForm} />
                      ) : state.matches('sending') ? (
                        <>
                          <Spinner
                            size="small"
                            color="white"
                            className="order-2 flex-grow-0"
                          />
                        </>
                      ) : (
                        <FormattedMessage {...messages.sendForm} />
                      )}
                    </button>
                  </div>

                  <div className="flex mt-6 items-center justify-between">
                    {state.matches('loading') ? (
                      <div className="flex ml-4 text-gray-500 mr-2"></div>
                    ) : null}

                    {state.matches('interactive') ||
                    state.matches('debouncing') ? (
                      <div className="flex ml-4 text-gray-500 mr-2">
                        <FormattedMessage
                          {...messages.referralLastUpdated}
                          values={{
                            date: (
                              <FormattedDate
                                year="numeric"
                                month="long"
                                day="numeric"
                                value={referral!.updated_at}
                              />
                            ),
                            time: (
                              <FormattedTime value={referral!.updated_at} />
                            ),
                          }}
                        />
                      </div>
                    ) : null}

                    {state.matches('failure') ? (
                      <div className="flex ml-4 text-danger-600 mr-2">
                        <FormattedMessage
                          {...messages.failedToUpdateReferral}
                        />
                      </div>
                    ) : null}
                  </div>
                </form>
              </section>
              <ErrorModal
                errorField={errorMessage}
                setIsErrorModalOpen={setIsErrorModalOpen}
                isErrorModalOpen={isErrorModalOpen}
              />
            </ReferralProvider>
          ) : (
            <>
              <Redirect
                to={`/sent-referrals/referral-detail/${referralId}/content`}
              />
            </>
          )}
        </div>
      );
  }
};
