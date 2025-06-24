import React, { useContext, useEffect } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { Referral, ReferralState, ReferralType, User } from 'types';
import { Title, TitleType } from '../../text/Title';
import { Text, TextType } from '../../text/Text';
import { TextAreaSize } from '../../text/TextArea';
import { ReferralHeaderFormField } from './ReferralHeaderFormField';
import { useSubReferral } from '../../../data/providers/SubReferralProvider';
import { ReferralContext } from '../../../data/providers/ReferralProvider';
import { ArrowCornerDownRight } from '../../Icons';
import { useCurrentUser } from '../../../data/useCurrentUser';
import { isUserReferralUnitsMember } from '../../../utils/unit';

const messages = defineMessages({
  subTitleTitle: {
    defaultMessage: 'Sub referral title',
    description: 'Sub referral title text',
    id: 'components.SubTitleField.subTitleTitle',
  },
  subTitleDescription: {
    defaultMessage:
      'Reformulate the title to distinguish the sub-sections of the referral. This title will appear on the dashboard and on the referral once it has been published.',
    description: 'Sub referral title description',
    id: 'components.SubTitleField.subTitleDescription',
  },
});

export const SubTitleField: React.FC = () => {
  const { subFormState, updateSubForm } = useSubReferral();
  const { referral, setReferral } = useContext(ReferralContext);
  const { currentUser } = useCurrentUser();
  const isReadOnly = (referral: Referral, user: User) => {
    return (
      !isUserReferralUnitsMember(user, referral) ||
      referral.state === ReferralState.ANSWERED ||
      referral.state === ReferralState.CLOSED
    );
  };

  useEffect(() => {}, [referral]);

  const isMain = (referral: Referral) => {
    return referral.group?.sections.some(
      (section) =>
        section.type === ReferralType.MAIN &&
        section.referral.id === referral.id,
    );
  };

  const showTitle = (referral: Referral, currentUser: User) => {
    return (
      isUserReferralUnitsMember(currentUser, referral) &&
      ((!isMain(referral) &&
        [ReferralState.SPLITTING, ReferralState.RECEIVED_SPLITTING].includes(
          referral.state,
        )) ||
        (isMain(referral) && referral.sub_title === null))
    );
  };

  return (
    <>
      {referral && currentUser && (
        <div>
          {showTitle(referral, currentUser) && (
            <div className="pt-4">
              <Title type={TitleType.H6} className={'text-black'}>
                <FormattedMessage {...messages.subTitleTitle} />
              </Title>
              <Text htmlFor="sub_title" type={TextType.LABEL_DESCRIPTION}>
                <FormattedMessage {...messages.subTitleDescription} />
              </Text>
            </div>
          )}
          <ReferralHeaderFormField
            tooltip={'Modifier le titre de la sous-saisine'}
            icon={<ArrowCornerDownRight className="fill-dsfr-orange-500" />}
            isReadOnly={isReadOnly(referral, currentUser)}
            value={subFormState['sub_title'].currentValue}
            onChange={(value: string) => {
              updateSubForm('sub_title', {
                currentValue: value,
                savedValue: subFormState['sub_title'].savedValue,
                state:
                  value === subFormState['sub_title'].savedValue
                    ? 'saved'
                    : 'changed',
              });
            }}
            state={subFormState['sub_title'].state}
            onSuccess={(referral: Referral) => {
              setReferral(referral);
              updateSubForm('sub_title', {
                currentValue: referral.sub_title,
                savedValue: referral.sub_title,
                state: 'saved',
              });
            }}
            name="sub_title"
            areaProperties={{
              maxLength: 120,
              size: TextAreaSize.ONE_LINE,
            }}
          />
        </div>
      )}
    </>
  );
};
