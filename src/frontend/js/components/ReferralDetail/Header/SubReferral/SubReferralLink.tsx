import React, { useContext } from 'react';
import { ReferralSection, ReferralType } from 'types';
import {
  getClassForSubReferralLink,
  getClassForSubReferralTooltip,
} from '../../../../utils/styles';
import { getReferralUrlForUser } from '../../../../utils/urls';
import { userHasAccess } from '../../../../utils/referral';
import { defineMessages, FormattedMessage } from 'react-intl';
import { ArrowCornerDownRight } from '../../../Icons';
import { NavLink } from 'react-router-dom';
import { useCurrentUser } from '../../../../data/useCurrentUser';
import { ReferralContext } from '../../../../data/providers/ReferralProvider';

const messages = defineMessages({
  mainReferral: {
    defaultMessage: 'main referral',
    description: 'main referral text',
    id: 'components.ReferralHeader.mainReferral',
  },
  noAccess: {
    defaultMessage: 'You do not have access to this referral',
    description: 'No access text for the sub referral',
    id: 'components.ReferralHeader.noAccess',
  },
  secondaryReferral: {
    defaultMessage: 'sub referral',
    description: 'secondary referral text',
    id: 'components.ReferralHeader.secondaryReferral',
  },
});

export const SubReferralLink = ({ section }: { section: ReferralSection }) => {
  const { referral } = useContext(ReferralContext);
  const { currentUser } = useCurrentUser();

  return (
    <>
      {' '}
      {referral && currentUser && (
        <NavLink
          key={section.id}
          aria-describedby={`tooltip-link-${section.id}`}
          className={`text-white h-fit w-fit px-2 py-0.25 text-sm ${getClassForSubReferralLink(
            referral,
            section,
            currentUser,
          )} new-tooltip`}
          to={`${getReferralUrlForUser(currentUser, section.referral)}`}
        >
          #{section.referral.id}
          <div
            role="tooltip"
            id={`tooltip-link-${section.id}`}
            className={`${getClassForSubReferralTooltip(
              referral,
              section,
              currentUser,
            )} tooltip-popup`}
          >
            {userHasAccess(currentUser, section.referral) ? (
              <div className="flex flex-col">
                <div
                  className={`flex w-full items-center ${
                    section.type === ReferralType.MAIN
                      ? 'text-primary-700'
                      : 'text-dsfr-orange-1000'
                  }`}
                >
                  <span className="text-xs uppercase">
                    {section.type === ReferralType.MAIN ? (
                      <FormattedMessage {...messages.mainReferral} />
                    ) : (
                      <FormattedMessage {...messages.secondaryReferral} />
                    )}
                  </span>
                </div>
                <span>
                  {' '}
                  {section.referral.title ?? section.referral.object}
                </span>
                {section.referral.sub_title && (
                  <div className="flex items-stretch">
                    <div className="flex opa items-start flex-shrink-0 mt-1">
                      <ArrowCornerDownRight className="w-4 h-4 fill-primary400" />
                    </div>
                    <span className="flex items-start text-sm">
                      {section.referral.sub_title}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center px-6 py-4">
                <span className="text-sm">
                  {' '}
                  Vous n'avez pas accès à cette saisine
                </span>
              </div>
            )}
          </div>
        </NavLink>
      )}
    </>
  );
};
