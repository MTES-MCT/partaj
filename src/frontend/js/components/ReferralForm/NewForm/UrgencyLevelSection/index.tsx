import React, { useContext, useState } from 'react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { Text, TextType } from '../../../text/Text';

import { GenericErrorMessage } from 'components/GenericErrorMessage';
import { Spinner } from 'components/Spinner';
import { useReferralUrgencies } from 'data';
import { Referral, ReferralUrgency, Topic } from 'types';
import { Title, TitleType } from '../../../text/Title';
import { SelectableList } from '../../../select/SelectableList';
import { SelectButton } from '../../../select/SelectButton';
import { SelectModal } from '../../../select/SelectModal';
import { usePatchReferralAction } from '../../../../data/referral';
import { ReferralContext } from '../../../../data/providers/ReferralProvider';
import { ChevronBottomIcon } from '../../../Icons';
import { TextArea } from '../../../text/TextArea';

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
  label: {
    defaultMessage: 'Expected response time',
    description: 'Label for the urgency field in the referral form',
    id: 'components.UrgencyLevelSection.label',
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
});

export const UrgencyLevelSection = () => {
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
          }}
        />
      );
  }
};

export const UrgencyFieldInner = ({
  urgencyLevels,
}: {
  urgencyLevels: ReferralUrgency[];
}) => {
  const intl = useIntl();
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

  return (
    <section className="space-y-2">
      <Title type={TitleType.H6}>
        <FormattedMessage {...messages.label} />
      </Title>
      <Text type={TextType.PARAGRAPH_SMALL}>
        <FormattedMessage {...messages.description} />
      </Text>
      <div className="relative">
        <SelectButton
          onClick={() => setIsOptionOpen(true)}
          isOptionsOpen={isOptionOpen}
        >
          <span>
            {referral && referral.urgency_level ? (
              referral.urgency_level.name
            ) : (
              <FormattedMessage {...messages.selectDefaultText} />
            )}
          </span>
          <ChevronBottomIcon className="fill-black shrink-0" />
        </SelectButton>
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
              label={intl.formatMessage(messages.label)}
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
              itemContent={(option: ReferralUrgency) => {
                return <p> {option.name}</p>;
              }}
            />
          </SelectModal>
        )}
      </div>
      <>
        {referral?.urgency_level?.requires_justification && (
          <div>
            <div className="mt-6 space-y-2">
              <Text type={TextType.PARAGRAPH_SMALL}>
                <FormattedMessage {...messages.urgencyJustification} />
              </Text>
              <TextArea
                maxLength={120}
                rows={4}
                defaultValue={referral.urgency_explanation}
                onDebounce={(value: string) => updateUrgencyExplanation(value)}
              />
            </div>
          </div>
        )}
      </>
    </section>
  );
};
