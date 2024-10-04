import React, { useContext, useEffect, useState } from 'react';
import { Title, TitleType } from '../../../text/Title';
import { defineMessages, FormattedMessage } from 'react-intl';
import { Text, TextType } from '../../../text/Text';
import { TextArea } from '../../../text/TextArea';
import { ReferralContext } from '../../../../data/providers/ReferralProvider';
import { Referral } from '../../../../types';
import { usePatchReferralAction } from '../../../../data/referral';
import { FormSection } from '../FormSection';
import { ReferralFormContext } from '../../../../data/providers/ReferralFormProvider';
import { ErrorIcon } from '../../../Icons';

const messages = defineMessages({
  objectSectionTitle: {
    defaultMessage: "Referral's title",
    description: 'Title section title',
    id: 'components.ObjectSection.title',
  },
  objectSectionText: {
    defaultMessage: 'Brief description of the title of this referral\n' + '\n',
    description: 'Requester unit type section text',
    id: 'components.ObjectSection.text',
  },
});

export const ObjectSection: React.FC = () => {
  const { referral, setReferral } = useContext(ReferralContext);
  const patchReferralMutation = usePatchReferralAction();

  const { errors } = useContext(ReferralFormContext);
  const [hasError, setHasError] = useState<boolean>(false);

  useEffect(() => {
    setHasError(errors.hasOwnProperty('object'));
  }, [errors]);

  const updateObject = (value: string) => {
    referral &&
      patchReferralMutation.mutate(
        {
          id: referral.id,
          object: value,
        },
        {
          onSuccess: (referral: Referral) => {
            setReferral(referral);
          },
        },
      );
  };

  return (
    <FormSection hasError={hasError}>
      <Title
        type={TitleType.H6}
        className={hasError ? 'text-dsfr-danger-500' : 'text-black'}
      >
        <FormattedMessage {...messages.objectSectionTitle} />
      </Title>
      <Text
        type={TextType.PARAGRAPH_SMALL}
        className={hasError ? 'text-dsfr-danger-500' : 'text-black'}
      >
        <FormattedMessage {...messages.objectSectionText} />
      </Text>
      {referral && (
        <TextArea
          maxLength={120}
          rows={2}
          defaultValue={referral.object}
          onDebounce={(value: string) => {
            updateObject(value);
          }}
          hasError={hasError}
        />
      )}
      {hasError && (
        <div className="flex items-center space-x-1">
          <ErrorIcon className="fill-dsfr-danger-500" />
          <Text
            type={TextType.SPAN_SUPER_SMALL}
            className="text-dsfr-danger-500 font-normal"
          >
            Veuillez renseigner un titre
          </Text>
        </div>
      )}
    </FormSection>
  );
};
