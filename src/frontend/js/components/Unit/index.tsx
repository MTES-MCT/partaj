import React from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { Navigate, NavLink, Route, Routes, useParams } from 'react-router-dom';

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
  crumbReferralList: {
    defaultMessage: 'Referrals list',
    description: 'Breadcrumb title for referrals list in Unit.',
    id: 'components.Unit.crumbsReferralList',
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
  unitTitle: string | React.JSX.Element;
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
  const { unitId } = useParams<keyof UnitRouteParams>() as UnitRouteParams;
  const url = `/unit/${unitId}`;

  const { data, status } = useUnit(unitId);

  let unitTitle;
  let unitName;

  switch (status) {
    case 'error':
      unitTitle = null;
      break;

    case 'pending':
      unitTitle = (
        <Spinner size="small">
          <FormattedMessage {...messages.loadingUnitTitle} />
        </Spinner>
      );
      break;

    case 'success':
      unitTitle = data!.name;
      unitName = data ? data.name : '';
      break;
  }

  return (
    <div className="container mx-auto flex-grow flex flex-col">
      <Routes>
        <Route
          path="members"
          element={
            <>
              <UnitHeader unitTitle={unitTitle!} url={url} />
              <UnitMemberList unit={unitId} />
              <Crumb
                key="unit-members"
                title={<FormattedMessage {...messages.members} />}
              />
            </>
          }
        />

        <Route
          path="topics"
          element={
            <>
              <UnitHeader unitTitle={unitTitle!} url={url} />
              <UnitTopicList unit={unitId} />
              <Crumb
                key="unit-topics"
                title={<FormattedMessage {...messages.topics} />}
              />
            </>
          }
        />

        <Route
          path="referrals-list/*"
          element={
            <>
              <ReferralsTab
                unitName={unitName}
                unitId={unitId}
                unitHeader={<UnitHeader unitTitle={unitTitle!} url={url} />}
              />
              <Crumb
                key="unit-referrals-list"
                title={<FormattedMessage {...messages.crumbReferralList} />}
              />
            </>
          }
        />

        <Route index element={<Navigate to="referrals-list" replace />} />
      </Routes>
    </div>
  );
};
