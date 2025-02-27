import React from 'react';
import { Tabs, TabsList, TabsTrigger } from 'components/dsfr/Tabs';
import { useTranslateUnitTab } from './utils';
import { UnitNavSubMenuItems } from '../Navbar/UnitNavMenu';

export const UnitTabs: React.FC<{
  activeTab: UnitNavSubMenuItems;
  changeTab: Function;
}> = ({ activeTab, changeTab }) => {
  const translateTab = useTranslateUnitTab();

  return (
    <Tabs
      defaultValue={activeTab}
      value={activeTab}
      onValueChange={(value) => changeTab(value as UnitNavSubMenuItems)}
      className="w-full mb-6 flex justify-start"
    >
      <TabsList className="flex w-full justify-start bg-white">
        {Object.values(UnitNavSubMenuItems).map((objKey: string) => (
          <TabsTrigger
            key={objKey}
            value={objKey}
            className="flex justify-start space-x-2 items-center text-base px-3 py-2"
          >
            <span>{translateTab(objKey as UnitNavSubMenuItems)}</span>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
};
