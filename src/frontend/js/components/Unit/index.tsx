import React from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { QueryStatus } from 'react-query';
import {
  NavLink,
  Redirect,
  Route,
  Switch,
  useParams,
  useRouteMatch,
} from 'react-router-dom';

import { Crumb } from 'components/BreadCrumbs';
import { Spinner } from 'components/Spinner';
import { UnitMemberList } from 'components/UnitMemberList';
import { UnitTopicList } from 'components/UnitTopicList';
import { useUnit } from 'data';
import { ReferralsTab } from './ReferralsTab';

const messages = defineMessages({
  archives: {
    defaultMessage: 'Archives',
    description: 'Navigation title in unit sub-navigation.',
    id: 'components.Unit.archives',
  },
  crumbReferralsList: {
    defaultMessage: 'Referrals list',
    description: 'Breadcrumb title for referrals list in Unit.',
    id: 'components.Unit.crumbsReferrasList',
  },
  loadingUnitTitle: {
    defaultMessage: 'Loading unit title...',
    description:
      'Accessible message for the spinner while loading the unit title.',
    id: 'components.Unit.loadingUnitTitle',
  },
  members: {
    defaultMessage: 'Members',
    description: 'Navigation & breadcrumb title in unit sub-navigation.',
    id: 'components.Unit.members',
  },
  openReferrals: {
    defaultMessage: 'Open referrals',
    description: 'Navigation title in unit sub-navigation.',
    id: 'components.Unit.openReferrals',
  },
  topics: {
    defaultMessage: 'Topics',
    description: 'Navigation & breadcrumb title in unit sub-navigation.',
    id: 'components.Unit.topics',
  },
});

interface UnitHeaderProps {
  unitTitle: string | JSX.Element;
  url: string;
}

export const UnitHeader: React.FC<UnitHeaderProps> = ({ unitTitle, url }) => (
  <div className="mb-4">
    <h1 className="text-4xl my-4">{unitTitle}</h1>
    <nav className="flex">
      <NavLink
        className="nav-pill mr-3"
        to={`${url}/referrals-list`}
        aria-current="true"
      >
        <FormattedMessage {...messages.openReferrals} />
      </NavLink>
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
);

interface UnitRouteParams {
  unitId: string;
}

export const Unit: React.FC = () => {
  const { path, url } = useRouteMatch();
  const { unitId } = useParams<UnitRouteParams>();

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
      <Switch>
        <Route exact path={`${path}/members`}>
          <UnitHeader unitTitle={unitTitle!} url={url} />
          <UnitMemberList unit={unitId} />
          <Crumb
            key="unit-members"
            title={<FormattedMessage {...messages.members} />}
          />
        </Route>

        <Route exact path={`${path}/topics`}>
          <UnitHeader unitTitle={unitTitle!} url={url} />
          <UnitTopicList unit={unitId} />
          <Crumb
            key="unit-topics"
            title={<FormattedMessage {...messages.topics} />}
          />
        </Route>

        <Route path={`${path}/referrals-list`}>
          <ReferralsTab
            unitId={unitId}
            unitHeader={<UnitHeader unitTitle={unitTitle!} url={url} />}
          />
          <Crumb
            key="unit-referrals-list"
            title={<FormattedMessage {...messages.crumbReferralsList} />}
          />
        </Route>

        <Route path={path}>
          <Redirect to={`${url}/referrals-list`} />
        </Route>
      </Switch>
    </div>
  );
};
