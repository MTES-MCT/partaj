import React, { ReactNode, useState } from 'react';

import { ReferralReportVersion } from 'types';
import { Nullable } from 'types/utils';

export const VersionContext = React.createContext<{
  version: Nullable<ReferralReportVersion>;
  setVersion: Function;
}>({
  setVersion: () => {
    return;
  },
  version: null,
});

export const VersionProvider = ({
  children,
  initialVersion,
}: {
  children: ReactNode;
  initialVersion: Nullable<ReferralReportVersion>;
}) => {
  const [version, setVersion] = useState<Nullable<ReferralReportVersion>>(
    initialVersion,
  );

  const { Provider } = VersionContext;

  return <Provider value={{ version, setVersion }}>{children}</Provider>;
};
