import React from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { Tabs, TabsList, TabsTrigger } from 'components/dsfr/Tabs';
import { useDashboardContext } from './DashboardContext';

// TODO : tab translations
export const messages = defineMessages({});

export enum ReferralTab {
  Process = 'process',
  Validate = 'validate',
  InValidation = 'in_validation',
  Change = 'change',
  Done = 'done',
}

export const ReferralTabs: React.FC = () => {
  const intl = useIntl();
  const { params, toggleFilter } = useDashboardContext();

  // TODO : translations do not exists, function is just a copy of the status
  // one but needs to be reworked
  const getTranslatedTab = (tab: ReferralTab) => {
    const uppercaseTab = tab.charAt(0).toUpperCase() + tab.slice(1);
    const tabLabel = `state${uppercaseTab}` as keyof typeof messages;
    const message = messages[tabLabel];

    if (!message) {
      return uppercaseTab;
    }

    return intl.formatMessage(message);
  };

  const setReferralTab = (tab: ReferralTab) => {
    console.log('SET REFERRAL TAB');
  };

  const tabs: ReferralTab[] = [
    ReferralTab.Process,
    ReferralTab.Validate,
    ReferralTab.InValidation,
    ReferralTab.Change,
    ReferralTab.Done,
  ];

  return (
    <Tabs
      defaultValue={'process'}
      onValueChange={(value) => setReferralTab(value as ReferralTab)}
      className="w-full mb-2"
    >
      <TabsList className="flex w-full">
        {tabs.map((tab) => (
          <TabsTrigger key={tab} value={tab} className="flex-1">
            {getTranslatedTab(tab)}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
};
