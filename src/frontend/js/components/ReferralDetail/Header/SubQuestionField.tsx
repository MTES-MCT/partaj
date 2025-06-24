import React, { useContext } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { Referral, ReferralState, ReferralType, User } from 'types';
import { Title, TitleType } from '../../text/Title';
import { Text, TextType } from '../../text/Text';
import { TextAreaSize } from '../../text/TextArea';
import { ReferralHeaderFormField } from './ReferralHeaderFormField';
import { useSubReferral } from '../../../data/providers/SubReferralProvider';
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
            isReadOnly={isReadOnly(referral, currentUser)}
            value={subFormState['sub_question'].currentValue}
            onChange={(value: string) =>
              updateSubForm('sub_question', {
                currentValue: value,
                savedValue: subFormState['sub_question'].savedValue,
                state:
                  value === subFormState['sub_question'].savedValue
                    ? 'saved'
                    : 'changed',
              })
            }
            state={subFormState['sub_question'].state}
            onSuccess={(referral: Referral) => {
              setReferral(referral);
              updateSubForm('sub_question', {
                currentValue: referral.sub_question,
                savedValue: referral.sub_question,
                state: 'saved',
              });
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
