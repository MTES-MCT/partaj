import React from 'react';
import { useReferralAction } from 'data';
import { Referral } from 'types';

export const AnswerPropertiesField = ({ referral }: { referral: Referral }) => {
  const mutation = useReferralAction({
    onSuccess: (data) => {},
  });

  return (
    <div>
      <select
        className="form-control pb-1  pt-1"
        id="answer-options"
        name="answer-options"
        value={referral.answer_properties ?? ''}
        onChange={(e) => {
          mutation.mutate({
            action: 'update_answer_properties',
            payload: {
              value: e.target.value,
            },
            referral,
          });
        }}
      >
        <option key={'value-none'} value={''}>
          {'N/A'}
        </option>
        {referral.answer_options &&
          referral.answer_options.map((answerOption) => (
            <option key={answerOption.value} value={answerOption.value}>
              {answerOption.name}
            </option>
          ))}
      </select>
    </div>
  );
};
