import React, { useContext } from 'react';
import { BaseSelect, SelectOption } from './BaseSelect';
import {
  ReferralReportVersion,
  ReportEvent,
  ReportEventVerb,
  User,
} from '../../types';
import { VersionContext } from '../../data/providers/VersionProvider';
import { useCurrentUser } from '../../data/useCurrentUser';

export const ValidationSelect = ({
  options,
}: {
  options: Array<SelectOption>;
}) => {
  const { version } = useContext(VersionContext);
  const { currentUser } = useCurrentUser();

  const hasValidated = (currentUser: User, version: ReferralReportVersion) => {
    return (
      version.events.filter(
        (event: ReportEvent) =>
          event.verb === ReportEventVerb.VERSION_VALIDATED &&
          event.user.id === currentUser.id,
      ).length > 0
    );
  };

  const hasRequestedChange = (
    currentUser: User,
    version: ReferralReportVersion,
  ) => {
    return (
      version.events.filter(
        (event: ReportEvent) =>
          event.verb === ReportEventVerb.REQUEST_CHANGE &&
          event.user.id === currentUser.id,
      ).length > 0
    );
  };

  const getButtonText = (currentUser: User, version: ReferralReportVersion) => {
    if (hasValidated(currentUser, version)) {
      return 'Validée';
    } else if (hasRequestedChange(currentUser, version)) {
      return 'Révision demandée';
    } else {
      return 'Validation / Revision';
    }
  };

  const getButtonCss = (currentUser: User, version: ReferralReportVersion) => {
    if (hasValidated(currentUser, version)) {
      return 'btn-success-light';
    } else if (hasRequestedChange(currentUser, version)) {
      return 'btn-danger';
    } else {
      return 'btn-purple-light';
    }
  };

  return (
    <>
      {currentUser && version && (
        <BaseSelect
          options={options}
          buttonCss={getButtonCss(currentUser, version)}
        >
          <span>{getButtonText(currentUser, version)}</span>
        </BaseSelect>
      )}
    </>
  );
};
