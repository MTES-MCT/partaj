import * as Sentry from '@sentry/react';
import React, {
  createContext,
  PropsWithChildren,
  useContext,
  useState,
} from 'react';

import { appData } from 'appData';
import { User } from 'types';
import { Nullable } from 'types/utils';
import { useAsyncEffect } from 'utils/useAsyncEffect';

export const CurrentUserContext = createContext<{
  currentUser: Nullable<User>;
}>({
  currentUser: null,
});

export const useCurrentUser = () => {
  return useContext(CurrentUserContext);
};

export const CurrentUserProvider = ({ children }: PropsWithChildren<{}>) => {
  const provideCurrentUser = useProvideCurrentUser();
  return (
    <CurrentUserContext.Provider value={provideCurrentUser}>
      {children}
    </CurrentUserContext.Provider>
  );
};

const useProvideCurrentUser = () => {
  const [currentUser, setCurrentUser] = useState<Nullable<User>>(null);

  useAsyncEffect(async () => {
    const response = await fetch('/api/users/whoami/', {
      headers: {
        Authorization: `Token ${appData.token}`,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      Sentry.captureException(
        new Error('Failed to get current user in ReferralDetailAssignment.'),
        { extra: { code: response.status, body: response.body } },
      );
      return;
    }
    const user: User = await response.json();
    setCurrentUser(user);
  }, []);

  return { currentUser };
};
