import React, { useState } from 'react';
import { UnitMembership } from '../../types';
import { NavLink } from 'react-router-dom';
import { LineChevronRightIcon, ListIcon } from '../Icons';
import { UnitNavSubMenu } from './UnitNavSubMenu';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';

export enum UnitNavSubMenuItems {
  DASHBOARD = 'dashboard',
  MEMBERS = 'members',
  TOPICS = 'topics',
}

export const unitNavMenuItemMessages = defineMessages({
  [UnitNavSubMenuItems.TOPICS]: {
    defaultMessage: 'Unit topics',
    description: 'Nav unit submenu topics',
    id: 'components.UnitNavMenu.topics',
  },
  [UnitNavSubMenuItems.MEMBERS]: {
    defaultMessage: 'Unit members',
    description: 'Nav unit submenu members',
    id: 'components.UnitNavMenu.members',
  },
  [UnitNavSubMenuItems.DASHBOARD]: {
    defaultMessage: 'Unit dashboard',
    description: 'Nav unit submenu dashboard',
    id: 'components.UnitNavMenu.dashboard',
  },
});

const messages = defineMessages({
  iconExtendTitle: {
    defaultMessage: 'Extend menu',
    description: 'Icon extend menu title',
    id: 'components.UnitNavMenu.iconExtendMenu',
  },
});

export const UnitNavMenu: React.FC<{ membership: UnitMembership }> = ({
  membership,
}) => {
  const [isNavOpen, setNavOpen] = useState(false);
  const intl = useIntl();
  const subMenu = [
    UnitNavSubMenuItems.DASHBOARD,
    UnitNavSubMenuItems.MEMBERS,
    UnitNavSubMenuItems.TOPICS,
  ];

  const params = new URLSearchParams();
  params.append('contributors_unit_names', membership.full_unit_name);

  return (
    <>
      <NavLink
        className="navbar-nav-item space-x-2"
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
          return (
            contributors_unit_names_param === membership.full_unit_name &&
            location.hash === ''
          );
        }}
      >
        <div>
          <ListIcon className="icon-default" />
          <button
            className={'z-20 hidden hover:bg-primary-100 icon-hover'}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setNavOpen((prevState) => !prevState);
            }}
          >
            <LineChevronRightIcon
              label={intl.formatMessage(messages.iconExtendTitle)}
              title={intl.formatMessage(messages.iconExtendTitle)}
              className={`${isNavOpen ? 'rotate-90' : ''} fill-black`}
            />
          </button>
        </div>
        <p className="mb-0.5"> {membership.unit_name} </p>
      </NavLink>

      {isNavOpen && (
        <>
          {subMenu.map((item: UnitNavSubMenuItems) => (
            <UnitNavSubMenu
              item={item}
              membership={membership}
              key={`${membership.id}-${item}`}
            >
              <FormattedMessage {...unitNavMenuItemMessages[item]} />
            </UnitNavSubMenu>
          ))}
        </>
      )}
    </>
  );
};
