import React from 'react';
import { defineMessages, useIntl } from 'react-intl';
import { Tabs, TabsList, TabsTrigger } from 'components/dsfr/Tabs';
import { useDashboardContext } from './DashboardContext';

export enum ReferralTab {
  All = 'all',
  Process = 'process',
  Validate = 'validate',
  InValidation = 'in_validation',
  Change = 'change',
  Done = 'done',
}

export const tabTitleMessages = defineMessages({
  [ReferralTab.All]: {
    defaultMessage: 'All referrals',
    description: 'All tab title',
    id: 'components.ReferralTabs.all',
  },
  [ReferralTab.Process]: {
    defaultMessage: 'To process',
    description: 'Process tab title',
    id: 'components.ReferralTabs.process',
  },
  [ReferralTab.Validate]: {
    defaultMessage: 'To validate',
    description: 'Validate tab title',
    id: 'components.ReferralTabs.validate',
  },
  [ReferralTab.InValidation]: {
    defaultMessage: 'In validation',
    description: 'In validation tab title',
    id: 'components.ReferralTabs.inValidation',
  },
  [ReferralTab.Change]: {
    defaultMessage: 'To change',
    description: 'Change tab title',
    id: 'components.ReferralTabs.change',
  },
  [ReferralTab.Done]: {
    defaultMessage: 'Done',
    description: 'Done tab title',
    id: 'components.ReferralTabs.done',
  },
});

export const ReferralTabs: React.FC = () => {
  const intl = useIntl();
  const { results, changeTab, activeTab } = useDashboardContext();
  const getTranslatedTab = (tab: ReferralTab) => {
    return tabTitleMessages[tab]
      ? intl.formatMessage(tabTitleMessages[tab])
      : tab;
  };

  return (
    <Tabs
      defaultValue={activeTab}
      onValueChange={(value) => changeTab(value as ReferralTab)}
      className="w-full mb-2"
    >
      <TabsList className="flex w-full">
        {Object.keys(results).map((objKey: string) => (
          <TabsTrigger
            key={objKey}
            value={objKey}
            className="flex justify-start space-x-2 items-center"
          >
            <span>{getTranslatedTab(objKey as ReferralTab)}</span>
            <span className="p-1 bg-primary-500 text-white rounded-full">
              {results[objKey as ReferralTab]!.count}
            </span>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
};
