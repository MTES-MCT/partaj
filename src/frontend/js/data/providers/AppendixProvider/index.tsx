import React, { ReactNode, useState } from 'react';

import { ReferralReportAppendix } from 'types';
import { Nullable } from 'types/utils';

export const AppendixContext = React.createContext<{
  appendix: Nullable<ReferralReportAppendix>;
  setAppendix: Function;
}>({
  setAppendix: () => {
    return;
  },
  appendix: null,
});

export const AppendixProvider = ({
  children,
  initialAppendix,
}: {
  children: ReactNode;
  initialAppendix: Nullable<ReferralReportAppendix>;
}) => {
  const [appendix, setAppendix] = useState<Nullable<ReferralReportAppendix>>(
    initialAppendix,
  );

  const { Provider } = AppendixContext;

  return <Provider value={{ appendix, setAppendix }}>{children}</Provider>;
};
