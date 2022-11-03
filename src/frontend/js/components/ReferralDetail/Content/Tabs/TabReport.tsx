import React from 'react';
import { Referral } from 'types';
import { ReferralReport } from '../../../ReferralReport';
import { Conversation } from '../../../ReferralReport/Conversation/Conversation';
import { DownloadReferralButton } from '../../../buttons/DowloadReferralBtn';

interface TabReportProps {
  referral: Referral;
}

export const TabReport: React.FC<TabReportProps> = ({ referral }) => {
  return (
    <>
      <div className="w-full text-black border p-4">
        Une nouvelle version de projet de réponse est désormais disponible !
        Pour toute information sur le fonctionnement n'hésitez pas à consulter{' '}
        <a
          className="underline"
          target="_blank"
          href="https://documentation.partaj.beta.gouv.fr/guide-de-traitement-dune-saisine-1#traiter-une-saisine-qui-ma-ete-affectee-apres-le-04-11-2022"
        >
          la documentation
        </a>{' '}
        ou à nous contacter par tchat
      </div>
      <div className="flex space-x-4 float-right mb-8">
        <DownloadReferralButton referralId={String(referral!.id)} />
      </div>
      <ReferralReport />
      <Conversation />
    </>
  );
};
