import React, { useContext } from 'react';
import { ReferralRelationship } from '../../types';
import { RelatedReferralsSearch } from './RelatedReferralsSearch';
import { ReferralContext } from '../../data/providers/ReferralProvider';
import { DownloadIcon, InboxIcon, OpenNewTabIcon } from '../Icons';
import { NavLink } from 'react-router-dom';
import { defineMessages, useIntl } from 'react-intl';
import { RemoveRelationShipButton } from '../buttons/RemoveRelatedReferralButton';

const messages = defineMessages({
  previewActionTooltip: {
    defaultMessage: 'View the notice',
    description: 'Preview button tooltip text',
    id: 'components.NoteItem.previewActionTooltip',
  },
  downloadActionTooltip: {
    defaultMessage: 'Download the notice',
    description: 'Download button tooltip text',
    id: 'components.NoteItem.downloadActionTooltip',
  },
  newTabActionTooltip: {
    defaultMessage: 'Open the notice in new tab',
    description: 'New tab open button tooltip text',
    id: 'components.NoteItem.newTabActionTooltip',
  },
});

export const RelatedReferrals: React.FC = () => {
  const { referral, relationships, setRelationships } = useContext(
    ReferralContext,
  );

  const intl = useIntl();

  return (
    <>
      {referral && (
        <>
          {relationships.length > 0 ? (
            <div className="space-y-4 mb-6">
              {relationships.map((relationship: ReferralRelationship) => (
                <div className={'flex space-x-4 w-full'}>
                  <div className="flex w-full items-center justify-between border">
                    <div className="flex flex-grow text-sm p-2 bg-primary-50 h-full text-left">
                      {relationship.related_referral.id} -
                      {relationship.related_referral.object}
                    </div>
                    <div className="flex">
                      <a
                        className="button button-white tooltip tooltip-action border-l"
                        data-tooltip={intl.formatMessage(
                          messages.downloadActionTooltip,
                        )}
                        href={relationship.related_referral.note.document.file}
                        key={`download-${relationship.related_referral.note.document.id}`}
                      >
                        <DownloadIcon
                          className="w-6 h-6 fill-dsfr-primary-500"
                          label={intl.formatMessage(
                            messages.downloadActionTooltip,
                          )}
                        />
                      </a>
                      <NavLink
                        className="button button-white tooltip tooltip-action border-l"
                        data-tooltip={intl.formatMessage(
                          messages.newTabActionTooltip,
                        )}
                        to={`/notes/${relationship.related_referral.note.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <OpenNewTabIcon
                          className="w-6 h-6 fill-dsfr-primary-500"
                          label={intl.formatMessage(
                            messages.newTabActionTooltip,
                          )}
                        />
                      </NavLink>
                    </div>
                  </div>

                  <RemoveRelationShipButton
                    relationship={relationship}
                    setRelationships={setRelationships}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="border-l-4 border border-dsfr-grey-200 bg-dsfr-grey-50 p-4 mb-4">
              <div className="flex flex-col items-center justify-center space-y-4">
                <InboxIcon className="fill-dsfr-primary-500 w-12 h-12" />
                <p className="font-medium text-dsfr-grey-700">
                  Pas encore de saisine liée
                </p>
                <p className="text-sm text-dsfr-grey-500 mt-1 max-w-512 text-center">
                  Cherchez et épinglez les saisines de la base de connaissances
                  pouvant servir au traitement de cette saisine par vous et vos
                  collègues.
                </p>
              </div>
            </div>
          )}
          <RelatedReferralsSearch
            referralId={referral.id}
            setRelationships={setRelationships}
          />
        </>
      )}
    </>
  );
};
