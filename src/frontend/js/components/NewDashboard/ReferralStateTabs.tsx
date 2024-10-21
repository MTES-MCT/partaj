import React from 'react';

import { Tabs, TabsList, TabsTrigger } from 'components/dsfr/Tabs';
import { ReferralState } from 'types';
import { useTranslateStatus } from './utils';

interface ReferralStateTabsProps {
  referralState: ReferralState | 'all';
  handleReferralStateChange: (state: ReferralState | 'all') => void;
}

export const ReferralStateTabs: React.FC<ReferralStateTabsProps> = ({
  referralState,
  handleReferralStateChange,
}) => {
  const translateStatus = useTranslateStatus();

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
          {translateStatus('all')}
        </TabsTrigger>
        {Object.values(ReferralState).map((state) => (
          <TabsTrigger key={state} value={state} className="flex-1">
            {translateStatus(state)}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
};
