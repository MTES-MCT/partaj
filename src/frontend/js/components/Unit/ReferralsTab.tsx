import React from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { Route, Switch, useRouteMatch } from 'react-router-dom';

import { Crumb } from 'components/BreadCrumbs';
import { ReferralDetail } from 'components/ReferralDetail';
import { ReferralTable } from 'components/ReferralTable';
import { FilterColumns } from 'components/ReferralTable/Filters';

const messages = defineMessages({
  crumbReferral: {
    defaultMessage: 'Referral',
    description: 'Breadcrumb title for the referral view in Unit.',
    id: 'components.Unit.ReferralsTab.crumbReferral',
  },
});

interface ReferralsTabProps {
  unitHeader: JSX.Element;
  unitId: string;
}

export const ReferralsTab: React.FC<ReferralsTabProps> = ({
  unitId,
  unitHeader,
}) => {
  const { path, url } = useRouteMatch();

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
          defaultParams={{ unit: [unitId] }}
          disabledColumns={[FilterColumns.UNIT]}
          getReferralUrl={(referral) => `${url}/referral-detail/${referral.id}`}
        />
      </Route>
    </Switch>
  );
};
