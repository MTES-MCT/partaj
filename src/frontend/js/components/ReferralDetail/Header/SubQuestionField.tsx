import React, { useContext } from 'react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { Referral } from 'types';
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
import { ReferralHeaderField } from './ReferralHeaderField';
import { userIsUnitMember } from '../../../utils/referral';

const messages = defineMessages({
  subQuestionTitle: {
    defaultMessage: 'Rephrasing the question',
    description: 'Sub referral question text',
    id: 'components.SubQuestionField.subQuestionTitle',
  },
  rewrittenQuestion: {
    defaultMessage: 'Rewritten {br} question',
    description: 'rewritten question title',
    id: 'components.SubQuestionField.rewrittenQuestion',
  },
  emptySubQuestionPlaceHolder: {
    defaultMessage: 'Add subquestion',
    description: 'empty subquestion placeholder',
    id: 'components.SubQuestionField.emptySubQuestionPlaceHolder',
  },
  updateSubQuestionTooltip: {
    defaultMessage: 'Reformulate subquestion',
    description: 'subquestion tooltip text',
    id: 'components.SubQuestionField.updateSubQuestion',
  },
  subQuestionDescription: {
    defaultMessage:
      'Indicate in this field which part of the initial referral this sub-referral will address. Once the referral has been published, this field will be integrated into the referral and can be consulted by requesters.',
    description: 'Sub referral question description',
    id: 'components.SubQuestionField.subQuestionDescription',
  },
});

export const SubQuestionField: React.FC = () => {
  const { subFormState, updateCurrentValue, updateState } = useSubReferral();
  const { referral, setReferral } = useContext(ReferralContext);
  const { currentUser } = useCurrentUser();
  const intl = useIntl();

  return (
    <>
      {referral && currentUser && (
        <div>
          {subFormState['sub_question'].showMetadata ? (
            <div className="mt-4">
              <Title type={TitleType.H6} className={'text-black'}>
                <FormattedMessage {...messages.subQuestionTitle} />
              </Title>
              <Text htmlFor="sub_question" type={TextType.LABEL_DESCRIPTION}>
                <FormattedMessage {...messages.subQuestionDescription} />
              </Text>
              <ReferralHeaderFormField
                tooltip={intl.formatMessage(messages.updateSubQuestionTooltip)}
                setEditMode={(isEditingMode: boolean) => {
                  updateState(
                    'sub_question',
                    isEditingMode
                      ? SubFormStates.INPUT_TEXT_SAVED
                      : SubFormStates.CLICKABLE_TEXT,
                  );
                }}
                value={subFormState['sub_question'].currentValue}
                placeholder={intl.formatMessage(
                  messages.updateSubQuestionTooltip,
                )}
                state={subFormState['sub_question'].state}
                onChange={(value: string) =>
                  updateCurrentValue('sub_question', value)
                }
                onSuccess={(referral: Referral) => {
                  setReferral(referral);
                }}
                name="sub_question"
                areaProperties={{
                  size: TextAreaSize.S,
                }}
              />
            </div>
          ) : (
            <>
              {' '}
              {!subFormState['sub_question'].currentValue &&
              !userIsUnitMember(currentUser, referral) ? null : (
                <div className="flex mt-2">
                  <ReferralHeaderField
                    title={intl.formatMessage(messages.rewrittenQuestion, {
                      br: <br />,
                    })}
                    icon={<QuillPen className="w-5 h-5" />}
                    className="items-start"
                  >
                    <ReferralHeaderFormField
                      tooltip={intl.formatMessage(
                        messages.updateSubQuestionTooltip,
                      )}
                      setEditMode={(isEditingMode: boolean) => {
                        updateState(
                          'sub_question',
                          isEditingMode
                            ? SubFormStates.INPUT_TEXT_SAVED
                            : SubFormStates.CLICKABLE_TEXT,
                        );
                      }}
                      value={subFormState['sub_question'].currentValue}
                      placeholder={intl.formatMessage(
                        messages.emptySubQuestionPlaceHolder,
                      )}
                      state={subFormState['sub_question'].state}
                      onChange={(value: string) =>
                        updateCurrentValue('sub_question', value)
                      }
                      onSuccess={(referral: Referral) => {
                        setReferral(referral);
                      }}
                      name="sub_question"
                      areaProperties={{
                        size: TextAreaSize.S,
                      }}
                    />
                  </ReferralHeaderField>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </>
  );
};
