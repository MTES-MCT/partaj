import React, { useState } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { Redirect, useParams } from 'react-router-dom';

import { GenericErrorMessage } from '../../GenericErrorMessage';
import { Spinner } from '../../Spinner';
import { useCurrentUser } from '../../../data/useCurrentUser';
import { getUserFullname, isFromCentralUnit } from '../../../utils/user';
import { Text, TextType } from '../../text/Text';

import { useReferral } from '../../../data';
import { ReferralUsersBlock } from '../../ReferralUsers/ReferralUsersBlock';
import { ReferralProvider } from '../../../data/providers/ReferralProvider';
import { ReferralUsersModalProvider } from '../../../data/providers/ReferralUsersModalProvider';
import { RoleModalProvider } from '../../../data/providers/RoleModalProvider';
import { Modals } from '../../modals/Modals';
import { TopicSection } from './TopicSection';
import { Title, TitleType } from '../../text/Title';
import { UnitType } from '../../../types';
import { PreliminaryWorkSection } from './PreliminaryWorkSection';
import { RequesterUnitSection } from './RequesterUnitSection';
import { ReferralFormProvider } from '../../../data/providers/ReferralFormProvider';
import { TitleSection } from './TitleSection';
import { ObjectSection } from './ObjectSection';
import { ContextSection } from './ContextSection';
import { UrgencyLevelSection } from './UrgencyLevelSection';

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

interface ReferralDetailRouteParams {
  referralId: string;
}

export const NewReferralForm: React.FC = ({}) => {
  const { referralId } = useParams<ReferralDetailRouteParams>();
  const { status, data: referral } = useReferral(referralId);
  const { currentUser } = useCurrentUser();
  const [requesterUnitType, setRequesterUnitType] = useState<string>(
    isFromCentralUnit(currentUser) ? UnitType.CENTRAL : UnitType.DECENTRALISED,
  );

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
              <>
                <ReferralFormProvider>
                  {referral.state === 'draft' ? (
                    <div className="flex flex-col w-full max-w-640">
                      <Title type={TitleType.H1}>
                        <FormattedMessage {...messages.title} />
                      </Title>

                      {currentUser ? (
                        <>
                          <Text type={TextType.PARAGRAPH_SMALL}>
                            <FormattedMessage
                              {...messages.byWhom}
                              values={{
                                name: getUserFullname(currentUser),
                                unit_name: currentUser.unit_name,
                              }}
                            />
                          </Text>
                          <Text type={TextType.PARAGRAPH_SMALL}>
                            {currentUser.email}
                          </Text>

                          {currentUser.phone_number && (
                            <Text>{currentUser.phone_number}</Text>
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
                            <TopicSection />
                            <RequesterUnitSection />
                            <PreliminaryWorkSection />
                            <TitleSection />
                            <ObjectSection />
                            <ContextSection />
                            <UrgencyLevelSection />
                          </div>
                        ) : (
                          <Spinner size="large">
                            <FormattedMessage
                              {...messages.loadingCurrentUser}
                            />
                          </Spinner>
                        )}

                        <div className="content-start grid grid-cols-3 gap-4">
                          <button
                            type="submit"
                            className={`btn btn-primary flex justify-center`}
                            style={{ minWidth: '12rem', minHeight: '2.5rem' }}
                          >
                            <FormattedMessage {...messages.sendForm} />
                          </button>
                        </div>
                      </form>
                    </div>
                  ) : (
                    <>
                      <Redirect
                        to={`/sent-referrals/referral-detail/${referralId}/content`}
                      />
                    </>
                  )}
                </ReferralFormProvider>
              </>
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
