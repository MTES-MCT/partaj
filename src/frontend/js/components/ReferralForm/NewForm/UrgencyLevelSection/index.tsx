import React, { useState } from 'react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { Text, TextType } from '../../../text/Text';

import { GenericErrorMessage } from 'components/GenericErrorMessage';
import { Spinner } from 'components/Spinner';
import { useReferralUrgencies } from 'data';
import { ReferralUrgency } from 'types';
import { Title, TitleType } from '../../../text/Title';
import { SelectableList, SelectOption } from '../../../select/SelectableList';
import { SelectButton } from '../../../select/SelectButton';
import { SelectModal } from '../../../select/SelectModal';

const messages = defineMessages({
  description: {
    defaultMessage: 'Average response time is 3 weeks',
    description: 'Description for the urgency field in the referral form',
    id: 'components.ReferralForm.UrgencyField.description',
  },
  label: {
    defaultMessage: 'Expected response time',
    description: 'Label for the urgency field in the referral form',
    id: 'components.ReferralForm.UrgencyField.label',
  },
  loadingUrgencies: {
    defaultMessage: 'Loading urgency options...',
    description:
      'Accessible text for the spinner while loading urgency options in the referral form',
    id: 'components.ReferralForm.UrgencyField.loadingUrgencies',
  },
  threeWeeks: {
    defaultMessage: '3 weeks',
    description: 'Default value for the urgency field in the referral form',
    id: 'components.ReferralForm.UrgencyField.threeWeeks',
  },
});

interface UrgencyFieldProps {
  urgencyLevel?: ReferralUrgency;
}

export const UrgencyLevelSection = ({ urgencyLevel }: UrgencyFieldProps) => {
  const { status, data } = useReferralUrgencies();

  const onOptionClick = (topicId: string) => {
    referralMutation.mutate({
      action: 'update_topic',
      payload: {
        topic: topicId,
      },
      referral,
    });
  }}

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
            urgencyLevel,
            urgencyLevels: data!.results,
          }}
        />
      );
  }
};

export const UrgencyFieldInner = ({
  urgencyLevel,
  urgencyLevels,
    onOptionClick
}: UrgencyFieldProps & { urgencyLevels: ReferralUrgency[] }) => {
  const intl = useIntl();
  const [isOptionOpen, setIsOptionOpen] = useState<boolean>(false);
  const [selectedOption, setSelectedOption] = useState<number>(0);

  return (
    <div className="mb-8">
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
          Selectionner l'urgence
        </SelectButton>
        <SelectModal
          onClickOutside={() => setIsOptionOpen(false)}
          isOptionsOpen={isOptionOpen}
          onKeyDown={{
            Enter: () => {
              onOptionClick(urgencyLevels[selectedOption].id);
              setIsOptionOpen(false)
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
                return prevState == urgencyLevels.length - 1 ? 0 : prevState + 1;
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
            onOptionClick={(option: SelectOption) => {
              console.log('optionClick');
              console.log(option.id);
            }}
            selectedOption={selectedOption}
            closeModal={() => console.log('TIEPS')}
          />
        </SelectModal>
      </div>
    </div>
  );
};
