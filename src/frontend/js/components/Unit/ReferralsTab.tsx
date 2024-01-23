import React from 'react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { Route, Switch, useRouteMatch } from 'react-router-dom';

import { Crumb } from 'components/BreadCrumbs';
import { ReferralDetail } from 'components/ReferralDetail';
import { ReferralTable } from 'components/ReferralTable';
import { FilterColumns } from 'components/ReferralTable/types';

const messages = defineMessages({
  crumbReferral: {
    defaultMessage: 'Referral',
    description: 'Breadcrumb title for the referral view in Unit.',
    id: 'components.Unit.ReferralsTab.crumbReferral',
  },
  tableCaption: {
    defaultMessage: '{ unitName } referrals list',
    description: 'Referral unit table caption',
    id: 'components.Unit.ReferralsTab.tableCaption',
  },
});

interface ReferralsTabProps {
  unitHeader: JSX.Element;
  unitName?: string;
  unitId: string;
}

export const ReferralsTab: React.FC<ReferralsTabProps> = ({
  unitId,
  unitName,
  unitHeader,
}) => {
  const { path, url } = useRouteMatch();
  const intl = useIntl();

  return (
    <Switch>
      <Route path={`${path}/referral-detail/:referralId`}>
        <ReferralDetail />
        <Crumb
          key="unit-referrals-list-referral-detail"
          title={<FormattedMessage {...messages.crumbReferral} />}
        />
      </Route>

      <Route path={path}>
        {unitHeader}
        <ReferralTable
          caption={intl.formatMessage(messages.tableCaption, { unitName })}
          defaultParams={{ unit: [unitId] }}
          disabledColumns={[FilterColumns.UNIT]}
          getReferralUrl={(referral) => `${url}/referral-detail/${referral.id}`}
        />
      </Route>
    </Switch>
  );
};
