import React, { useContext } from 'react';
import { Title, TitleType } from '../../../text/Title';
import { defineMessages, FormattedMessage } from 'react-intl';
import { Text, TextType } from '../../../text/Text';
import { RequesterUnitType } from '../../../../types';
import { RequesterUnitRadioGroup } from './RequesterUnitRadioGroup';
import { ReferralContext } from '../../../../data/providers/ReferralProvider';
import { usePatchReferralAction } from '../../../../data/referral';

const messages = defineMessages({
  requesterUnitSectionText: {
    defaultMessage:
      'Please let us know if you are from a decentralized or central administration department',
    description: 'Requester unit type section text',
    id: 'components.RequesterUnitSection.requesterUnitSectionText',
  },
});

export const RequesterUnitSection: React.FC<{ title: string }> = ({
  title,
}) => {
  const { referral, setReferral } = useContext(ReferralContext);

  const requesterUnitMutation = usePatchReferralAction();

  const updateRequesterUnitSection = (value: any) => {
    referral &&
      requesterUnitMutation.mutate(
        {
          id: referral.id,
          requester_unit_type: value,
        },
        {
          onSuccess: (referral) => {
            setReferral(referral);
          },
        },
      );
  };

  return (
    <section className="space-y-2">
      <Title type={TitleType.H6}>{title}</Title>
      <Text type={TextType.PARAGRAPH_SMALL}>
        <FormattedMessage {...messages.requesterUnitSectionText} />
      </Text>
      {referral?.requester_unit_type && (
        <RequesterUnitRadioGroup
          defaultValue={referral?.requester_unit_type}
          onChange={(value: RequesterUnitType) => {
            updateRequesterUnitSection(value);
          }}
        />
      )}
    </section>
  );
};
