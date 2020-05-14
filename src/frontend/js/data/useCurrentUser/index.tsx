import React, {
  createContext,
  PropsWithChildren,
  useContext,
  useState,
} from 'react';

import { User } from 'types';
import { Nullable } from 'types/utils';
import { handle } from 'utils/errors';
import { useAsyncEffect } from 'utils/useAsyncEffect';

const CurrentUserContext = createContext<{ currentUser: Nullable<User> }>({
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
    const response = await fetch('/api/users/whoami/');
    if (!response.ok) {
      return handle(
        new Error('Failed to get current user in ReferralDetailAssignment.'),
      );
    }
    const user: User = await response.json();
    setCurrentUser(user);
  }, []);

  return { currentUser };
};
