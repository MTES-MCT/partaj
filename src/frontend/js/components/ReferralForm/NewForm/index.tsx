import React, { useContext } from 'react';
import {
  defineMessages,
  FormattedDate,
  FormattedMessage,
  FormattedTime,
  useIntl,
} from 'react-intl';
import { Redirect, useParams } from 'react-router-dom';

import { GenericErrorMessage } from '../../GenericErrorMessage';
import { Spinner } from '../../Spinner';
import { useCurrentUser } from '../../../data/useCurrentUser';
import { getUserFullname } from '../../../utils/user';
import { Text, TextType } from '../../text/Text';

import { useReferral } from '../../../data';
import { ReferralUsersBlock } from '../../ReferralUsers/ReferralUsersBlock';
import { ReferralProvider } from '../../../data/providers/ReferralProvider';
import { ReferralUsersModalProvider } from '../../../data/providers/ReferralUsersModalProvider';
import { RoleModalProvider } from '../../../data/providers/RoleModalProvider';
import { Modals } from '../../modals/Modals';
import { TopicSection } from './TopicSection';
import { Title, TitleType } from '../../text/Title';
import { Referral } from '../../../types';
import { PreliminaryWorkSection } from './PreliminaryWorkSection';
import { RequesterUnitSection } from './RequesterUnitSection';
import { ReferralFormProvider } from '../../../data/providers/ReferralFormProvider';
import { ObjectSection } from './ObjectSection';
import { ContextSection } from './ContextSection';
import { UrgencyLevelSection } from './UrgencyLevelSection';
import { useSendReferralAction } from '../../../data/referral';
import { SubmitFormButton } from './SubmitFormButton';
import { QuestionSection } from './QuestionSection';
import { ReferralSavedAt } from './ReferralSavedAt';
import { SaveIcon, SendIcon } from '../../Icons';
import { GenericModalContext } from '../../../data/providers/GenericModalProvider';
import { formatMessage } from '@formatjs/intl';

export const sectionTitles = defineMessages({
  topic: {
    defaultMessage: 'Referral topic',
    description: 'Label for the topic field in the referral form',
    id: 'components.NewForm.topic',
  },
  requesterUnit: {
    defaultMessage: "Applicant's department",
    description: 'Requester unit type section title',
    id: 'components.NewForm.requesterUnit',
  },
  preliminaryWork: {
    defaultMessage: 'preliminary work',
    description: 'Label for the topic field in the referral form',
    id: 'components.NewForm.preliminaryWork',
  },
  object: {
    defaultMessage: "Referral's title",
    description: 'Title section title',
    id: 'components.NewForm.object',
  },
  question: {
    defaultMessage: 'Purpose of request',
    description: 'Object section title',
    id: 'components.NewForm.question',
  },
  context: {
    defaultMessage: 'Referral context',
    description: 'Context section title',
    id: 'components.NewForm.context',
  },
  urgencyLevel: {
    defaultMessage: 'Expected response time',
    description: 'Label for the urgency field in the referral form',
    id: 'components.NewForm.urgencyLevel',
  },
});

const messages = defineMessages({
  referralLastUpdated: {
    defaultMessage: 'Referral updated on { date } at { time }',
    description:
      'Informational text alerting the user when we last updated the referral in the background',
    id: 'components.ReferralForm.referralLastUpdated',
  },
  modalReferralSavedDescription: {
    defaultMessage:
      'Referral is saved. You can find it in draft referrals subsection',
    description:
      'Modal text content when referral is saved manually by the user',
    id: 'components.ReferralForm.modalReferralSavedDescription',
  },
  modalReferralSavedTitle: {
    defaultMessage: 'Referral saved !',
    description: 'Modal text title when referral is saved manually by the user',
    id: 'components.ReferralForm.modalReferralSavedTitle',
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
  saveForm: {
    defaultMessage: 'Save',
    description:
      'Accessibility text for the spinner in submit button on the referral creation form',
    id: 'components.ReferralForm.saveForm',
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

interface ReferralDetailRouteParams {
  referralId: string;
}

export const NewReferralForm: React.FC = () => {
  const { referralId } = useParams<ReferralDetailRouteParams>();
  const { status, data: referral } = useReferral(referralId);
  const { currentUser } = useCurrentUser();
  const { openGenericModal } = useContext(GenericModalContext);
  const sendReferralMutation = useSendReferralAction({
    onSuccess: (referral: Referral) => {
      window.location.assign(`/app/sent-referral/${referral.id}/`);
    },
  });

  const intl = useIntl();

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
        <div className="font-marianne flex flex-col items-center">
          <ReferralProvider referralId={referralId}>
            {referral ? (
              <ReferralFormProvider>
                {referral.state === 'draft' ? (
                  <div className="flex flex-col w-full max-w-720">
                    <div className="flex justify-between">
                      <Title type={TitleType.H1}>
                        <FormattedMessage {...messages.title} /> #{referral.id}
                      </Title>
                      <ReferralSavedAt />
                    </div>

                    {currentUser ? (
                      <>
                        <Text
                          type={TextType.PARAGRAPH_SMALL}
                          font="font-normal"
                        >
                          <FormattedMessage
                            {...messages.byWhom}
                            values={{
                              name: getUserFullname(currentUser),
                              unit_name: currentUser.unit_name,
                            }}
                          />
                        </Text>
                        <Text
                          type={TextType.PARAGRAPH_SMALL}
                          font="font-normal"
                        >
                          {currentUser.email}
                        </Text>

                        {currentUser.phone_number && (
                          <Text
                            type={TextType.PARAGRAPH_SMALL}
                            font="font-normal"
                          >
                            {currentUser.phone_number}
                          </Text>
                        )}
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
                          <ObjectSection
                            title={intl.formatMessage(sectionTitles.object)}
                          />
                          <TopicSection
                            title={intl.formatMessage(sectionTitles.topic)}
                          />
                          <QuestionSection
                            title={intl.formatMessage(sectionTitles.question)}
                          />
                          <ContextSection
                            title={intl.formatMessage(sectionTitles.context)}
                          />
                          <RequesterUnitSection
                            title={intl.formatMessage(
                              sectionTitles.requesterUnit,
                            )}
                          />
                          <PreliminaryWorkSection
                            title={intl.formatMessage(
                              sectionTitles.preliminaryWork,
                            )}
                          />
                          <UrgencyLevelSection
                            title={intl.formatMessage(
                              sectionTitles.urgencyLevel,
                            )}
                          />
                        </div>
                      ) : (
                        <Spinner size="large">
                          <FormattedMessage {...messages.loadingCurrentUser} />
                        </Spinner>
                      )}
                      <div className="flex justify-between">
                        <button
                          type="button"
                          className={`btn btn-secondary flex items-center space-x-2`}
                          onClick={() => {
                            openGenericModal({
                              type: 'success',
                              title: intl.formatMessage(
                                messages.modalReferralSavedTitle,
                              ),
                              content: (
                                <span>
                                  {' '}
                                  {intl.formatMessage(
                                    messages.modalReferralSavedDescription,
                                  )}
                                </span>
                              ),
                            });
                          }}
                        >
                          <SaveIcon />
                          <span className="mb-0.5">
                            <FormattedMessage {...messages.saveForm} />
                          </span>
                        </button>

                        <SubmitFormButton
                          onClick={() => {
                            sendReferralMutation.mutate(referral);
                          }}
                        >
                          <SendIcon />
                          <span className="mb-0.5">
                            <FormattedMessage {...messages.sendForm} />
                          </span>
                        </SubmitFormButton>
                      </div>
                    </form>
                  </div>
                ) : (
                  <Redirect
                    to={`/sent-referrals/referral-detail/${referralId}/content`}
                  />
                )}
              </ReferralFormProvider>
            ) : (
              <Spinner>
                <FormattedMessage {...messages.loadingCurrentUser} />
              </Spinner>
            )}
          </ReferralProvider>
        </div>
      );
  }
};
