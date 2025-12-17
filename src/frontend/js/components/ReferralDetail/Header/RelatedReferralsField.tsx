import React, { useContext } from 'react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { ReferralHeaderField } from './ReferralHeaderField';
import { ListIcon, EditIcon, LinkIcon } from '../../Icons';
import { BaseSideModalContext } from '../../../data/providers/BaseSideModalProvider';
import { ReferralContext } from '../../../data/providers/ReferralProvider';
import { RelatedReferrals } from '../../RelatedReferrals';

const messages = defineMessages({
  relatedReferralsTitle: {
    defaultMessage: 'Saisines liées',
    description: 'Related referrals field title',
    id: 'components.RelatedReferralsField.relatedReferralsTitle',
  },
  relatedReferralsCount: {
    defaultMessage: '{count} saisine{plural}',
    description: 'Related referrals count text',
    id: 'components.RelatedReferralsField.relatedReferralsCount',
  },
  noRelatedReferrals: {
    defaultMessage: 'Aucune saisine liée',
    description: 'Text when no related referrals exist',
    id: 'components.RelatedReferralsField.noRelatedReferrals',
  },
  modalTitle: {
    defaultMessage: 'Saisines liées',
    description: 'Modal title for related referrals',
    id: 'components.RelatedReferralsField.modalTitle',
  },
  viewReferral: {
    defaultMessage: 'Voir la saisine',
    description: 'Link text to view a referral',
    id: 'components.RelatedReferralsField.viewReferral',
  },
  noRelatedReferralsTooltip: {
    defaultMessage: 'Modifier les saisines liées',
    description: 'Tooltip for no related referrals button',
    id: 'components.RelatedReferralsField.noRelatedReferralsTooltip',
  },
});

export const RelatedReferralsField: React.FC = () => {
  const { relationships } = useContext(ReferralContext);
  const { openBaseSideModal } = useContext(BaseSideModalContext);
  const intl = useIntl();
  const relatedCount = relationships?.length || 0;

  const handleClick = () => {
    openBaseSideModal({
      icon: <LinkIcon className="h-8 w-8" />,
      title: intl.formatMessage(messages.modalTitle),
      width: 'max-w-4xl',
      height: 'h-full',
      content: <RelatedReferrals />,
    });
  };

  return (
    <ReferralHeaderField
      title={<FormattedMessage {...messages.relatedReferralsTitle} />}
      icon={<LinkIcon className="w-5 h-5" />}
    >
      <button
        onClick={handleClick}
        className="flex tooltip tooltip-action button whitespace-nowrap button-white-grey button-superfit text-base text-black space-x-2"
        data-tooltip={
          relatedCount > 0
            ? intl.formatMessage(messages.noRelatedReferralsTooltip)
            : relationships.map(
                (relationship) => `#${relationship.related_referral.id} `,
              )
        }
      >
        {relatedCount > 0 ? (
          <>
            <span className="text-black truncate">
              {relationships.map((relationship) => (
                <>{`#${relationship.related_referral.id} `}</>
              ))}
            </span>
            <EditIcon className="fill-grey400 flex-shrink-0" />
          </>
        ) : (
          <>
            <span>
              <FormattedMessage {...messages.noRelatedReferrals} />
            </span>
            <EditIcon className="fill-grey400" />
          </>
        )}
      </button>
    </ReferralHeaderField>
  );
};
