import React, { useContext } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { Referral, ReferralState, User } from 'types';
import { Title, TitleType } from '../../text/Title';
import { Text, TextType } from '../../text/Text';
import { TextAreaSize } from '../../text/TextArea';
import { ReferralHeaderFormField } from './ReferralHeaderFormField';
import {
  SubFormStates,
  useSubReferral,
} from '../../../data/providers/SubReferralProvider';
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
  const {
    subFormState,
    updateCurrentValue,
    updateSavedValue,
    updateState,
    isMain,
  } = useSubReferral();
  const { referral } = useContext(ReferralContext);
  const { currentUser } = useCurrentUser();

  const showTitle = (referral: Referral, currentUser: User) => {
    return (
      isUserReferralUnitsMember(currentUser, referral) &&
      ((!isMain &&
        [ReferralState.SPLITTING, ReferralState.RECEIVED_SPLITTING].includes(
          referral.state,
        )) ||
        (isMain && referral.sub_title === null))
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
            setEditMode={(isEditingMode: boolean) => {
              updateState(
                'sub_title',
                isEditingMode
                  ? SubFormStates.INPUT_TEXT_SAVED
                  : SubFormStates.CLICKABLE_TEXT,
              );
            }}
            value={subFormState['sub_title'].currentValue}
            state={subFormState['sub_title'].state}
            onChange={(value: string) => updateCurrentValue('sub_title', value)}
            onSuccess={(referral: Referral) => {
              updateSavedValue('sub_title', referral['sub_title']);
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
