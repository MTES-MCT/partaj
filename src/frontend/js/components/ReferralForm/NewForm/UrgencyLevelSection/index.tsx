import React, { useContext, useEffect, useState } from 'react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
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
import { TextArea } from '../../../text/TextArea';
import { FormSection } from '../FormSection';
import { ReferralFormContext } from '../../../../data/providers/ReferralFormProvider';

const messages = defineMessages({
  selectDefaultText: {
    defaultMessage: 'Select expected response time',
    description: 'Select button text',
    id: 'components.UrgencyLevelSection.selectDefaultText',
  },
  description: {
    defaultMessage: 'Average response time is 3 weeks',
    description: 'Description for the urgency field in the referral form',
    id: 'components.UrgencyLevelSection.description',
  },
  loadingUrgencies: {
    defaultMessage: 'Loading urgency options...',
    description:
      'Accessible text for the spinner while loading urgency options in the referral form',
    id: 'components.UrgencyLevelSection.loadingUrgencies',
  },
  urgencyJustification: {
    defaultMessage: 'Please justify the urgency of this referral',
    description: 'Urgency justification text',
    id: 'components.UrgencyLevelSection.urgencyJustification',
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
  const [isOptionOpen, setIsOptionOpen] = useState<boolean>(false);
  const [selectedOption, setSelectedOption] = useState<number>(0);
  const { referral, setReferral } = useContext(ReferralContext);

  const patchReferralMutation = usePatchReferralAction(
    {
      onSuccess: (referral: Referral) => setReferral(referral),
      onError: () => {},
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
        <FormattedMessage {...messages.description} />
      </Text>
      <div className="relative space-y-2">
        <SelectButton
          onClick={() => setIsOptionOpen(true)}
          isOptionsOpen={isOptionOpen}
          hasError={hasUrgencyLevelError}
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
          <SelectModal
            onClickOutside={() => setIsOptionOpen(false)}
            isOptionsOpen={isOptionOpen}
            onKeyDown={{
              Enter: () => {
                setIsOptionOpen(false);
              },
              ArrowUp: () => {
                urgencyLevels.length > 0 &&
                  setSelectedOption((prevState) => {
                    return prevState - 1 >= 0
                      ? prevState - 1
                      : urgencyLevels.length - 1;
                  });
              },
              ArrowDown: () => {
                urgencyLevels.length > 0 &&
                  setSelectedOption((prevState) => {
                    return prevState == urgencyLevels.length - 1
                      ? 0
                      : prevState + 1;
                  });
              },
              Close: () => {
                setIsOptionOpen(false);
              },
            }}
          >
            <SelectableList
              label={title}
              options={urgencyLevels}
              onOptionClick={(option: ReferralUrgency) => {
                patchReferralMutation.mutate(
                  {
                    id: referral.id,
                    urgency_level: option,
                  },
                  {
                    onSuccess: (referral: Referral) => {
                      setIsOptionOpen(false);
                    },
                  },
                );
              }}
              selectedOption={selectedOption}
              itemContent={(option: ReferralUrgency) => <p> {option.name}</p>}
            />
          </SelectModal>
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
              <FormattedMessage {...messages.urgencyJustification} />
            </Text>
            <TextArea
              id="urgency_explanation"
              maxLength={120}
              rows={4}
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
