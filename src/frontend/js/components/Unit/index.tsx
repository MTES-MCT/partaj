import React from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { QueryStatus } from 'react-query';
import {
  Link,
  NavLink,
  Route,
  Switch,
  useParams,
  useRouteMatch,
} from 'react-router-dom';

import { ReferralDetail } from 'components/ReferralDetail';
import { Spinner } from 'components/Spinner';
import { UnitMemberList } from 'components/UnitMemberList';
import { UnitReferralList } from 'components/UnitReferralList';
import { UnitTopicList } from 'components/UnitTopicList';
import { useUnit } from 'data';

const messages = defineMessages({
  archives: {
    defaultMessage: 'Archives',
    description: 'Navigation title in unit sub-navigation.',
    id: 'components.Unit.archives',
  },
  loadingUnitTitle: {
    defaultMessage: 'Loading unit title...',
    description:
      'Accessible message for the spinner while loading the unit title',
    id: 'components.Unit.loadingUnitTitle',
  },
  members: {
    defaultMessage: 'Members',
    description: 'Navigation title in unit sub-navigation.',
    id: 'components.Unit.members',
  },
  openReferrals: {
    defaultMessage: 'Open referrals',
    description: 'Navigation title in unit sub-navigation.',
    id: 'components.Unit.openReferrals',
  },
  topics: {
    defaultMessage: 'Topics',
    description: 'Navigation title in unit sub-navigation.',
    id: 'components.Unit.topics',
  },
});

interface UnitRouteParams {
  unitId: string;
}

export const Unit: React.FC = () => {
  const { path, url } = useRouteMatch();
  const { unitId } = useParams<UnitRouteParams>();

  // We have to compute whether the "Open referrals" nav link is active manually as it is both
  // one of the views in Unit and the default view (without additional url parts)
  const isOnOpenReferrals = useRouteMatch({ path, exact: true });
  const isOpenReferralDetail = useRouteMatch({
    path: `${path}/referral-detail/:referralId`,
  });
  const isOpenReferralsActive = isOnOpenReferrals || isOpenReferralDetail;

  const { data, status } = useUnit(unitId);

  let unitTitle;
  switch (status) {
    case QueryStatus.Idle:
    case QueryStatus.Loading:
      unitTitle = (
        <Spinner size="small">
          <FormattedMessage {...messages.loadingUnitTitle} />
        </Spinner>
      );
      break;

    case QueryStatus.Error:
      unitTitle = null;
      break;

    case QueryStatus.Success:
      unitTitle = data!.name;
      break;
  }

  return (
    <div className="container mx-auto flex-grow flex flex-col">
      <div className="mb-4">
        <h1 className="text-4xl my-4">{unitTitle}</h1>
        <nav className="flex">
          <Link
            className={`nav-pill mr-3 ${isOpenReferralsActive ? 'active' : ''}`}
            to={url}
            aria-current={isOpenReferralsActive ? 'true' : 'false'}
          >
            <FormattedMessage {...messages.openReferrals} />
          </Link>
          <NavLink
            className="nav-pill mr-3"
            to={`${url}/topics`}
            aria-current="true"
          >
            <FormattedMessage {...messages.topics} />
          </NavLink>
          <NavLink
            className="nav-pill mr-3"
            to={`${url}/members`}
            aria-current="true"
          >
            <FormattedMessage {...messages.members} />
          </NavLink>
          <a className="nav-pill mr-3 disabled" href="#">
            <FormattedMessage {...messages.archives} />
          </a>
        </nav>
      </div>
      <Switch>
        <Route exact path={`${path}/members`}>
          <UnitMemberList unit={unitId} />
        </Route>

        <Route exact path={`${path}/topics`}>
          <UnitTopicList unit={unitId} />
        </Route>

        <Route path={`${path}/referral-detail/:referralId`}>
          <ReferralDetail />
        </Route>

        <Route path={path}>
          <UnitReferralList unitId={unitId} />
        </Route>
      </Switch>
    </div>
  );
};
