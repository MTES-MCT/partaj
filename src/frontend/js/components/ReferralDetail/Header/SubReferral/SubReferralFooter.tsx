import React, { useContext } from 'react';
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
            content: `Le(s) champ(s) ${changedFields.map((field) => (
              <> translateSubReferralField(field) </>
            ))} n'a / n'ont pas été enregistré(s). Souhaitez-vous vraiment envoyer cette sous-saisine sans les modifications apportées?`,
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
            type: 'warning',
          });
        }}
        onSuccess={(referral: Referral) => {
          setReferral(referral);
        }}
      />
    </div>
  );
};
