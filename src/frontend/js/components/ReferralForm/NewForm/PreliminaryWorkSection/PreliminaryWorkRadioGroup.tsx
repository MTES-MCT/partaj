import React from 'react';
import { RadioGroup, RadioGroupOption } from '../../../inputs/RadioGroup';
import { defineMessages, useIntl } from 'react-intl';

const messages = defineMessages({
  positiveAnswer: {
    defaultMessage: 'Yes',
    description: 'Radio button value for the positive answer',
    id: 'components.PreliminaryWorkRadioGroup.positiveAnswer',
  },
  negativeAnswer: {
    defaultMessage: 'No',
    description: 'Radio button value for the negative answer',
    id: 'components.PreliminaryWorkRadioGroup.negativeAnswer',
  },
});

export const PreliminaryWorkRadioGroup: React.FC<{
  onChange: (value: string) => void;
  defaultValue?: string;
}> = ({ onChange, defaultValue }) => {
  const intl = useIntl();
  const groupId = 'form-preliminary-work';
  const options: Array<RadioGroupOption> = [
    {
      name: intl.formatMessage(messages.positiveAnswer),
      value: 'yes',
      isFocusable: true,
    },
    {
      name: intl.formatMessage(messages.negativeAnswer),
      value: 'no',
    },
  ];

  return (
    <RadioGroup
      defaultValue={defaultValue}
      groupId={groupId}
      onChange={(value: string) => onChange(value)}
      options={options}
    />
  );
};
