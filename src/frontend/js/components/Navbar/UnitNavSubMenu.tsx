import React, { PropsWithChildren } from 'react';
import { UnitMembership } from '../../types';
import { NavLink } from 'react-router-dom';
import { CircleFillIcon } from '../Icons';

export const UnitNavSubMenu: React.FC<PropsWithChildren<{
  membership: UnitMembership;
  item: string;
}>> = ({ membership, item, children }) => {
  const params = new URLSearchParams();
  params.append('contributors_unit_names', membership.full_unit_name);
  params.append('tab', item);

  return (
    <NavLink
      className="navbar-nav-subitem space-x-2"
      key={membership.unit}
      to={`/unit/${membership.unit}?${params.toString()}`}
      aria-current="true"
      isActive={(match, location) => {
        if (!match) {
          return false;
        }
        const contributors_unit_names_param = new URLSearchParams(
          location.search,
        ).get('contributors_unit_names');

        const tab = new URLSearchParams(location.search).get('tab');

        return (
          contributors_unit_names_param === membership.full_unit_name &&
          tab === item
        );
      }}
    >
      <CircleFillIcon className="h-1 w-1" /> <span>{children}</span>
    </NavLink>
  );
};
