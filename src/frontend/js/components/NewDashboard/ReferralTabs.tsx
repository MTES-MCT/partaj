import React from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { Tabs, TabsList, TabsTrigger } from 'components/dsfr/Tabs';
import { useDashboardContext } from './DashboardContext';
import { ReferralLiteResultV2 } from '../../data';
import { camelCase } from 'lodash-es';

// TODO : tab translations
export const messages = defineMessages({});

export enum ReferralTab {
  All = 'all',
  Process = 'process',
  Validate = 'validate',
  InValidation = 'in_validation',
  Change = 'change',
  Done = 'done',
}

export const ReferralTabs: React.FC = () => {
  const intl = useIntl();
  const { results, changeTab } = useDashboardContext();

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

  return (
    <Tabs
      defaultValue={'process'}
      onValueChange={(value) => changeTab(value as ReferralTab)}
      className="w-full mb-2"
    >
      <TabsList className="flex w-full">
        {Object.keys(results).map((objKey: string) => (
          <TabsTrigger key={objKey} value={objKey} className="flex-1">
            <span>{getTranslatedTab(objKey as ReferralTab)}</span>
            <span>{results[objKey as ReferralTab]!.count}</span>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
};
