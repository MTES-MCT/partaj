import React, {
  createContext,
  PropsWithChildren,
  useContext,
  useState,
} from 'react';

import { User } from 'types';
import { Context, ContextProps } from 'types/context';
import { Nullable } from 'types/utils';
import { handle } from 'utils/errors';
import { useAsyncEffect } from 'utils/useAsyncEffect';

export const CurrentUserContext = createContext<{
  currentUser: Nullable<User>;
}>({
  currentUser: null,
});

export const useCurrentUser = () => {
  return useContext(CurrentUserContext);
};

export const CurrentUserProvider = ({
  children,
  context,
}: PropsWithChildren<ContextProps>) => {
  const provideCurrentUser = useProvideCurrentUser(context);
  return (
    <CurrentUserContext.Provider value={provideCurrentUser}>
      {children}
    </CurrentUserContext.Provider>
  );
};

const useProvideCurrentUser = (context: Context) => {
  const [currentUser, setCurrentUser] = useState<Nullable<User>>(null);

  useAsyncEffect(async () => {
    const response = await fetch('/api/users/whoami/', {
      headers: {
        Authorization: `Token ${context.token}`,
        'Content-Type': 'application/json',
      },
    });
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
