import React, { useContext, useEffect, useState } from 'react';
import { Title, TitleType } from '../../../text/Title';
import { defineMessages, FormattedMessage } from 'react-intl';
import { Text, TextType } from '../../../text/Text';
import { Referral, RequesterUnitType, UnitType } from '../../../../types';
import { RequesterUnitRadioGroup } from './RequesterUnitRadioGroup';
import { useCurrentUser } from '../../../../data/useCurrentUser';
import { isFromCentralUnit } from '../../../../utils/user';
import { ReferralContext } from '../../../../data/providers/ReferralProvider';
import { usePatchReferralAction } from '../../../../data/referral';

const messages = defineMessages({
  requesterUnitSectionTitle: {
    defaultMessage: "Applicant's department",
    description: 'Requester unit type section title',
    id: 'components.RequesterUnitSection.requesterUnitSectionTitle',
  },
  requesterUnitSectionText: {
    defaultMessage:
      'Please let us know if you are from a decentralized or central administration department',
    description: 'Requester unit type section text',
    id: 'components.RequesterUnitSection.requesterUnitSectionText',
  },
});

export const RequesterUnitSection: React.FC = () => {
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
      <Title type={TitleType.H6}>
        <FormattedMessage {...messages.requesterUnitSectionTitle} />
      </Title>
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
