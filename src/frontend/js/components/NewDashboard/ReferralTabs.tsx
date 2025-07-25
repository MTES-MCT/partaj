import React from 'react';
import { defineMessages } from 'react-intl';
import { Tabs, TabsList, TabsTrigger } from 'components/dsfr/Tabs';
import { useDashboardContext } from './DashboardContext';
import { useTranslateTab } from './utils';

export enum ReferralTab {
  All = 'all',
  Process = 'process',
  Assign = 'assign',
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
  [ReferralTab.Assign]: {
    defaultMessage: 'To assign',
    description: 'Assign tab title',
    id: 'components.ReferralTabs.assign',
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
  const { results, changeTab, activeTab } = useDashboardContext();
  const translateTab = useTranslateTab();

  return (
    <Tabs
      defaultValue={ReferralTab.All}
      value={activeTab.name}
      onValueChange={(value) => changeTab(value as ReferralTab)}
      className="w-full mb-2 flex justify-start"
    >
      <TabsList className="flex w-full justify-start bg-white">
        {Object.keys(results).map((objKey: string) => (
          <TabsTrigger
            key={objKey}
            value={objKey}
            className="flex justify-start space-x-2 items-center"
          >
            <span>{translateTab(objKey as ReferralTab)}</span>
            <span>
              {'('}
              {results[objKey as ReferralTab]!.count}
              {')'}
            </span>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
};
