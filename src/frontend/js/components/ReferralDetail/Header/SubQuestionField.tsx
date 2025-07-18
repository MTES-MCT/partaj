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
import { useCurrentUser } from '../../../data/useCurrentUser';
import { QuillPen } from '../../Icons';
import { isUserReferralUnitsMember } from '../../../utils/unit';

const messages = defineMessages({
  subQuestionTitle: {
    defaultMessage: 'Rephrasing the question',
    description: 'Sub referral question text',
    id: 'components.SubQuestionField.subQuestionTitle',
  },
  subQuestionDescription: {
    defaultMessage:
      'Indicate in this field which part of the initial referral this sub-referral will address. Once the referral has been published, this field will be integrated into the referral and can be consulted by requesters.',
    description: 'Sub referral question description',
    id: 'components.SubQuestionField.subQuestionDescription',
  },
});

export const SubQuestionField: React.FC = () => {
  const {
    subFormState,
    updateCurrentValue,
    updateSavedValue,
    updateState,
    isMain,
  } = useSubReferral();
  const { referral, setReferral } = useContext(ReferralContext);
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
          {showTitle(referral, currentUser) ? (
            <>
              <Title type={TitleType.H6} className={'text-black'}>
                <FormattedMessage {...messages.subQuestionTitle} />
              </Title>
              <Text htmlFor="sub_question" type={TextType.LABEL_DESCRIPTION}>
                <FormattedMessage {...messages.subQuestionDescription} />
              </Text>
            </>
          ) : (
            <>
              {referral.sub_question && (
                <div className="flex space-x-1 items-center">
                  <QuillPen className="fill-dsfr-orange-500" />
                  <Title
                    type={TitleType.H6}
                    className={'text-black font-normal'}
                  >
                    Question reformulée
                  </Title>
                </div>
              )}
            </>
          )}
          <ReferralHeaderFormField
            tooltip={'Modifier la reformulation de la question'}
            setEditMode={(isEditingMode: boolean) => {
              updateState(
                'sub_question',
                isEditingMode
                  ? SubFormStates.INPUT_TEXT_SAVED
                  : SubFormStates.CLICKABLE_TEXT,
              );
            }}
            value={subFormState['sub_question'].currentValue}
            state={subFormState['sub_question'].state}
            onChange={(value: string) =>
              updateCurrentValue('sub_question', value)
            }
            onSuccess={(referral: Referral) => {
              updateSavedValue('sub_question', referral['sub_question']);
              ![
                ReferralState.SPLITTING,
                ReferralState.RECEIVED_SPLITTING,
              ].includes(referral.state) &&
                updateState('sub_question', SubFormStates.INPUT_TEXT_SAVED);
            }}
            name="sub_question"
            areaProperties={{
              size: TextAreaSize.S,
            }}
          />
        </div>
      )}
    </>
  );
};
