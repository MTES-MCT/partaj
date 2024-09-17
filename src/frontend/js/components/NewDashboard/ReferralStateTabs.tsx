import { camelCase, startCase } from 'lodash';
import React from 'react';
import { useIntl } from 'react-intl';

import { Tabs, TabsList, TabsTrigger } from 'components/dsfr/Tabs';
import { ReferralState } from 'types';

import { messages } from './messages';

interface ReferralStateTabsProps {
  referralState: ReferralState | 'all';
  handleReferralStateChange: (state: ReferralState | 'all') => void;
}

export const ReferralStateTabs: React.FC<ReferralStateTabsProps> = ({
  referralState,
  handleReferralStateChange,
}) => {
  const intl = useIntl();

  const getTranslatedStatus = (state: ReferralState | 'all') => {
    if (state === 'all') {
      return intl.formatMessage(messages.tabAll);
    }
    const stateLabel = startCase(camelCase(state)).replace(/ /g, '');
    const messageKey = `state${stateLabel}` as keyof typeof messages;

    return intl.formatMessage(messages[messageKey]);
  };

  return (
    <Tabs
      defaultValue={referralState}
      onValueChange={(value) =>
        handleReferralStateChange(value as ReferralState | 'all')
      }
      className="w-full mb-2"
    >
      <TabsList className="flex w-full">
        <TabsTrigger value="all" className="flex-1">
          {getTranslatedStatus('all')}
        </TabsTrigger>
        {Object.values(ReferralState).map((state) => (
          <TabsTrigger key={state} value={state} className="flex-1">
            {getTranslatedStatus(state)}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
};
