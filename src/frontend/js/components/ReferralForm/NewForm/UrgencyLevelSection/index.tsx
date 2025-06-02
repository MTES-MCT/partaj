import React, { useContext, useEffect, useState } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { Text, TextType } from '../../../text/Text';

import { GenericErrorMessage } from 'components/GenericErrorMessage';
import { Spinner } from 'components/Spinner';
import { useReferralUrgencies } from 'data';
import { Referral, ReferralUrgency } from 'types';
import { Title, TitleType } from '../../../text/Title';
import { SelectableList } from '../../../select/SelectableList';
import { SelectButton } from '../../../select/SelectButton';
import { SelectModal } from '../../../select/SelectModal';
import { usePatchReferralAction } from '../../../../data/referral';
import { ReferralContext } from '../../../../data/providers/ReferralProvider';
import { ChevronBottomIcon, ErrorIcon } from '../../../Icons';
import { AutoSaveTextArea } from '../../../text/AutoSaveTextArea';
import { FormSection } from '../FormSection';
import { ReferralFormContext } from '../../../../data/providers/ReferralFormProvider';
import { SelectModalProvider } from '../../../../data/providers/SelectModalProvider';
import * as Sentry from '@sentry/react';
import { EnvFormattedMessage } from '../../../translations/EnvFormattedMessage';

const messages = defineMessages({
  selectDefaultText: {
    defaultMessage: 'Select expected response time',
    description: 'Select button text',
    id: 'components.UrgencyLevelSection.selectDefaultText',
  },
  loadingUrgencies: {
    defaultMessage: 'Loading urgency options...',
    description:
      'Accessible text for the spinner while loading urgency options in the referral form',
    id: 'components.UrgencyLevelSection.loadingUrgencies',
  },
  emptyErrorMessage: {
    defaultMessage: 'Please select a processing time for the referral.',
    description:
      'Error message showed when urgency field has an invalid value in the referral form',
    id: 'components.UrgencyLevelSection.emptyErrorMessage',
  },
  noJustificationErrorMessage: {
    defaultMessage: 'Please justify the urgency of the referral',
    description:
      'Error message showed when urgency justification field has an invalid value in the referral form',
    id: 'components.UrgencyLevelSection.noJustificationErrorMessage',
  },
});

const descriptionEnvMessages = defineMessages({
  descriptionMTES: {
    defaultMessage: 'Average response time is 3 weeks',
    description: 'Description for the urgency field in the referral form',
    id: 'components.UrgencyLevelSection.description.MTES',
  },
  descriptionMASA: {
    defaultMessage: 'Average response time is 2 months',
    description: 'Description for the urgency field in the referral form',
    id: 'components.UrgencyLevelSection.description.MASA',
  },
});

const urgencyEnvMessages = defineMessages({
  urgencyMTES: {
    defaultMessage:
      'Please justify the urgency of this referral after getting hierachical approval',
    description: 'Urgency justification text',
    id: 'components.UrgencyLevelSection.urgencyJustification.MTES',
  },
  urgencyMASA: {
    defaultMessage: 'Please justify the urgency of this referral',
    description: 'Urgency justification text',
    id: 'components.UrgencyLevelSection.urgencyJustification.MASA',
  },
});

export const UrgencyLevelSection: React.FC<{ title: string }> = ({ title }) => {
  const { status, data } = useReferralUrgencies();

  switch (status) {
    case 'error':
      return <GenericErrorMessage />;

    case 'idle':
    case 'loading':
      return (
        <Spinner size="large">
          <FormattedMessage {...messages.loadingUrgencies} />
        </Spinner>
      );

    case 'success':
      return (
        <UrgencyFieldInner
          {...{
            urgencyLevels: data!.results,
            title,
          }}
        />
      );
  }
};

export const UrgencyFieldInner = ({
  urgencyLevels,
  title,
}: {
  urgencyLevels: ReferralUrgency[];
  title: string;
}) => {
  const [isOptionsOpen, setIsOptionsOpen] = useState<boolean>(false);
  const { referral, setReferral } = useContext(ReferralContext);

  const patchReferralMutation = usePatchReferralAction(
    {
      onSuccess: (referral: Referral) => setReferral(referral),
      onError: (error) => {
        Sentry.captureException(error);
      },
    },
    'patch_urgency_level',
  );

  const patchUrgencyExplanation = usePatchReferralAction({
    onSuccess: (referral: Referral) => setReferral(referral),
    onError: () => {},
  });

  const updateUrgencyExplanation = (value: string) => {
    referral &&
      patchUrgencyExplanation.mutate(
        {
          id: referral.id,
          urgency_explanation: value,
        },
        {
          onSuccess: (referral: Referral) => {
            setReferral(referral);
          },
          onError: (error) => {
            Sentry.captureException(error);
          },
        },
      );
  };

  const { errors } = useContext(ReferralFormContext);
  const [hasUrgencyLevelError, setHasUrgencyLevelError] = useState<boolean>(
    false,
  );
  const [
    hasUrgencyJustificationError,
    setHasUrgencyJustificationError,
  ] = useState<boolean>(false);

  const closeModal = () => {
    setIsOptionsOpen(false);
  };

  useEffect(() => {
    setHasUrgencyLevelError(errors.hasOwnProperty('urgency_level'));
    setHasUrgencyJustificationError(
      errors.hasOwnProperty('urgency_explanation'),
    );
  }, [errors]);

  return (
    <FormSection
      hasError={hasUrgencyLevelError || hasUrgencyJustificationError}
    >
      <Title
        className={
          hasUrgencyLevelError || hasUrgencyJustificationError
            ? 'text-dsfr-danger-500'
            : 'text-black'
        }
        type={TitleType.H6}
      >
        {title}
      </Title>
      <Text
        className={hasUrgencyLevelError ? 'text-dsfr-danger-500' : 'text-black'}
        type={TextType.PARAGRAPH_SMALL}
      >
        <EnvFormattedMessage messages={descriptionEnvMessages} />
      </Text>
      <div className="relative space-y-2">
        <SelectButton
          onClick={() => setIsOptionsOpen(true)}
          isOptionsOpen={isOptionsOpen}
          hasError={hasUrgencyLevelError}
          isDisabled={urgencyLevels.length === 0}
        >
          <span>
            {referral?.urgency_level ? (
              referral.urgency_level.name
            ) : (
              <FormattedMessage {...messages.selectDefaultText} />
            )}
          </span>
          <ChevronBottomIcon className="fill-black shrink-0" />
        </SelectButton>
        {hasUrgencyLevelError && (
          <div className="flex items-center space-x-1">
            <ErrorIcon className="fill-dsfr-danger-500" />
            <Text
              type={TextType.SPAN_SUPER_SMALL}
              className="text-dsfr-danger-500 font-normal"
            >
              <FormattedMessage {...messages.emptyErrorMessage} />
            </Text>
          </div>
        )}
        {referral && (
          <SelectModalProvider
            closeModal={() => closeModal()}
            currentOptions={urgencyLevels}
            onSelect={(option: ReferralUrgency) => {
              patchReferralMutation.mutate(
                {
                  id: referral.id,
                  urgency_level: option,
                },
                {
                  onSuccess: (referral: Referral) => {
                    setIsOptionsOpen(false);
                  },
                },
              );
            }}
          >
            <SelectModal position={'top'} isOptionsOpen={isOptionsOpen}>
              <SelectableList
                label={title}
                itemContent={(option: ReferralUrgency) => <p> {option.name}</p>}
              />
            </SelectModal>
          </SelectModalProvider>
        )}
      </div>
      <>
        {referral?.urgency_level?.requires_justification && (
          <div className="mt-6 space-y-2">
            <Text
              className={
                hasUrgencyJustificationError
                  ? 'text-dsfr-danger-500'
                  : 'text-black'
              }
              type={TextType.LABEL_SMALL}
              htmlFor="urgency_explanation"
            >
              <EnvFormattedMessage messages={urgencyEnvMessages} />
            </Text>
            <AutoSaveTextArea
              id="urgency_explanation"
              defaultValue={referral.urgency_explanation}
              onDebounce={(value: string) => updateUrgencyExplanation(value)}
              hasError={hasUrgencyJustificationError}
            />
            {hasUrgencyJustificationError && (
              <div className="flex items-center space-x-1">
                <ErrorIcon className="fill-dsfr-danger-500" />
                <Text
                  type={TextType.SPAN_SUPER_SMALL}
                  className="text-dsfr-danger-500 font-normal"
                >
                  <FormattedMessage {...messages.noJustificationErrorMessage} />
                </Text>
              </div>
            )}
          </div>
        )}
      </>
    </FormSection>
  );
};
