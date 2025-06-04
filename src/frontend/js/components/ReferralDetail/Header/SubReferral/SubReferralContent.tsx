import React from 'react';
import { SubTitleField } from '../SubTitleField';
import { SubQuestionField } from '../SubQuestionField';
import { Referral } from '../../../../types';

export const SubReferralContent: ({
  referral,
}: {
  referral: Referral;
}) => JSX.Element = ({ referral }: { referral: Referral }) => {
  return (
    <>
      <SubTitleField referral={referral} />
      <SubQuestionField referral={referral} />
    </>
  );
};
