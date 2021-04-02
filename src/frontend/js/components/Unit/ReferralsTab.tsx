import React from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { Route, Switch, useRouteMatch } from 'react-router-dom';

import { Crumb } from 'components/BreadCrumbs';
import { GenericErrorMessage } from 'components/GenericErrorMessage';
import { ReferralDetail } from 'components/ReferralDetail';
import { ReferralTable } from 'components/ReferralTable';
import { Spinner } from 'components/Spinner';
import { useReferralLites } from 'data';

const messages = defineMessages({
  crumbReferral: {
    defaultMessage: 'Referral',
    description: 'Breadcrumb title for the referral view in Unit.',
    id: 'components.Unit.ReferralsTab.crumbReferral',
  },
  loading: {
    defaultMessage: 'Loading unit referrals...',
    description: 'Accessiblity message for the spinner un unit referral list',
    id: 'components.Unit.ReferralsTab.loading',
  },
});

interface UnitReferralsListProps {
  unitId: string;
}

const UnitReferralsList: React.FC<UnitReferralsListProps> = ({ unitId }) => {
  const { url } = useRouteMatch();

  const { status, data } = useReferralLites({ unit: unitId });

  switch (status) {
    case 'error':
      return <GenericErrorMessage />;

    case 'idle':
    case 'loading':
      return (
        <Spinner size="large">
          <FormattedMessage {...messages.loading} />
        </Spinner>
      );

    case 'success':
      return (
        <ReferralTable
          getReferralUrl={(referral) => `${url}/referral-detail/${referral.id}`}
          referrals={data!.results}
        />
      );
  }
};

interface ReferralsTabProps {
  unitHeader: JSX.Element;
  unitId: string;
}

export const ReferralsTab: React.FC<ReferralsTabProps> = ({
  unitId,
  unitHeader,
}) => {
  const { path } = useRouteMatch();

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
        <UnitReferralsList unitId={unitId} />
      </Route>
    </Switch>
  );
};
