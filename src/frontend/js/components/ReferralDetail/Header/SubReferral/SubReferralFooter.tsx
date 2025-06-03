import React, { useContext, useState } from 'react';
import { SubTitleField } from '../SubTitleField';
import { SubQuestionField } from '../SubQuestionField';
import { Referral } from '../../../../types';
import { useSubReferral } from '../../../../data/providers/SubReferralProvider';
import { CancelSplitButton } from '../../../buttons/CancelSplitButton';
import { ConfirmSplitButton } from '../../../buttons/ConfirmSplitButton';
import { ApiModalContext } from '../../../../data/providers/ApiModalProvider';
import { ReferralContext } from '../../../../data/providers/ReferralProvider';

export const SubReferralFooter: ({
  referral,
}: {
  referral: Referral;
}) => JSX.Element = ({ referral }: { referral: Referral }) => {
  const { getChangedFields, resetFields } = useSubReferral();

  const { setReferral } = useContext(ReferralContext);
  const { openApiModal, closeApiModal } = useContext(ApiModalContext);

  return (
    <div className="w-full flex items-center justify-between pt-8">
      <CancelSplitButton referral={referral} />
      <ConfirmSplitButton
        referralId={referral.id}
        beforeSplit={() => {
          const changedFields = getChangedFields();
          if (changedFields.length === 0) {
            return true;
          }

          openApiModal({
            title: "Confirmation de l'envoi",
            content: `Le champ ${changedFields.map(
              (field) => field,
            )} n'ont pas été enregstré. Souhaitez-vous vraiment envoyer cette sous-saisine ?`,
            button: (
              <ConfirmSplitButton
                referralId={referral.id}
                beforeSplit={() => {
                  return true;
                }}
                onSuccess={(referral: Referral) => {
                  setReferral(referral);
                  resetFields();
                  closeApiModal();
                }}
              />
            ),
          });
        }}
        onSuccess={(referral: Referral) => {
          setReferral(referral);
        }}
      />
    </div>
  );
};
