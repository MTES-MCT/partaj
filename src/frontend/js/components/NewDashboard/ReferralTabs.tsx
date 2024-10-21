import React from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { Tabs, TabsList, TabsTrigger } from 'components/dsfr/Tabs';

// TODO : tab translations
export const messages = defineMessages({});

export enum ReferralTab {
  Process = 'process',
  Validate = 'validate',
  InValidation = 'in_validation',
  Change = 'change',
  Done = 'done',
}

interface ReferralTabsProps {
  referralTab: ReferralTab;
  handleReferralTabChange: (tab: ReferralTab) => void;
}

export const ReferralTabs: React.FC<ReferralTabsProps> = ({
  referralTab,
  handleReferralTabChange,
}) => {
  const intl = useIntl();

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

  const tabs: ReferralTab[] = [
    ReferralTab.Process,
    ReferralTab.Validate,
    ReferralTab.InValidation,
    ReferralTab.Change,
    ReferralTab.Done,
  ];

  return (
    <Tabs
      defaultValue={referralTab}
      onValueChange={(value) => handleReferralTabChange(value as ReferralTab)}
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
