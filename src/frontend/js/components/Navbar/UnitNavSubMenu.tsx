import React, { PropsWithChildren } from 'react';
import { UnitMembership } from '../../types';
import { NavLink, useLocation } from 'react-router-dom';
import { CircleFillIcon } from '../Icons';

export const UnitNavSubMenu: React.FC<PropsWithChildren<{
  membership: UnitMembership;
  item: string;
}>> = ({ membership, item, children }) => {
  const params = new URLSearchParams();
  params.append('contributors_unit_names', membership.full_unit_name);
  params.append('tab', item);

  const location = useLocation();
  const matchesUnit = location.pathname.startsWith(`/unit/${membership.unit}`);
  const search = new URLSearchParams(location.search);
  const isSubItemActive =
    matchesUnit &&
    search.get('contributors_unit_names') === membership.full_unit_name &&
    search.get('tab') === item;

  return (
    <NavLink
      className={() =>
        `navbar-nav-subitem space-x-2${isSubItemActive ? ' active' : ''}`
      }
      key={membership.unit}
      to={`/unit/${membership.unit}?${params.toString()}`}
      aria-current="true"
    >
      <CircleFillIcon className="h-1 w-1" /> <span>{children}</span>
    </NavLink>
  );
};
