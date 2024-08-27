import React, { useContext, useState } from 'react';
import { Title, TitleType } from '../../../text/Title';
import { defineMessages, FormattedMessage } from 'react-intl';
import { Text, TextType } from '../../../text/Text';
import { Referral, RequesterUnitType, UnitType } from '../../../../types';
import { RequesterUnitRadioGroup } from './RequesterUnitRadioGroup';
import { useCurrentUser } from '../../../../data/useCurrentUser';
import { isFromCentralUnit } from '../../../../utils/user';
import { ReferralContext } from '../../../../data/providers/ReferralProvider';

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
  const { currentUser } = useCurrentUser();
  const { referral, setReferral } = useContext(ReferralContext);
  const [requesterUnitType, setRequesterUnitType] = useState<string>(
    isFromCentralUnit(currentUser) ? UnitType.CENTRAL : UnitType.DECENTRALISED,
  );

  return (
    <section className="space-y-2">
      <Title type={TitleType.H6}>
        <FormattedMessage {...messages.requesterUnitSectionTitle} />
      </Title>
      <Text type={TextType.PARAGRAPH_SMALL}>
        <FormattedMessage {...messages.requesterUnitSectionText} />
      </Text>
      <RequesterUnitRadioGroup
        defaultValue={requesterUnitType}
        onChange={(value: RequesterUnitType) => {
          referral &&
            setReferral((prevState: Referral) => {
              prevState['requester_unit_type'] = value;
              return { ...prevState };
            });
        }}
      />
    </section>
  );
};
