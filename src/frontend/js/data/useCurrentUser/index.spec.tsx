import { act, render, screen } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import React from 'react';
import { IntlProvider } from 'react-intl';

import { User } from 'types';
import { Context } from 'types/context';
import { Nullable } from 'types/utils';
import { Deferred } from 'utils/test/Deferred';
import { UserFactory } from 'utils/test/factories';
import { useCurrentUser, CurrentUserProvider } from '.';

describe('useCurrentUser', () => {
  const context: Context = {
    assets: { icons: 'icons.svg' },
    csrftoken: 'the csrf token',
    token: 'the auth token',
  };

  let getLatestHookValues: () => { currentUser: Nullable<User> };
  const TestComponent = () => {
    const hookValues = useCurrentUser();
    getLatestHookValues = () => hookValues;
    return (
      <div>
        Test component{' '}
        {hookValues.currentUser ? hookValues.currentUser.first_name : 'empty'}
      </div>
    );
  };

  const SiblingComponent = () => {
    const { currentUser } = useCurrentUser();
    return <div>Sibling component {currentUser?.last_name}</div>;
  };

  afterEach(() => fetchMock.restore());

  it('gets the current user and returns it to consumers through a context', async () => {
    const deferred = new Deferred<User>();
    fetchMock.get('/api/users/whoami/', deferred.promise);

    const { rerender } = render(
      <IntlProvider locale="en">
        <CurrentUserProvider context={context}>
          <TestComponent />
        </CurrentUserProvider>
      </IntlProvider>,
    );

    expect(fetchMock.called('/api/users/whoami/')).toEqual(true);
    expect(screen.getByText('Test component empty'));
    expect(getLatestHookValues()).toEqual({ currentUser: null });
    expect(
      fetchMock.called('/api/users/whoami/', {
        headers: {
          Authorization: 'Token the auth token',
          'Content-Type': 'application/json',
        },
      }),
    ).toEqual(true);

    const user = UserFactory.generate();
    await act(async () => deferred.resolve(user));

    expect(fetchMock.calls().length).toEqual(1);
    expect(screen.getByText(`Test component ${user.first_name}`));
    expect(getLatestHookValues()).toEqual({ currentUser: user });

    rerender(
      <IntlProvider locale="en">
        <CurrentUserProvider context={context}>
          <TestComponent />
          <SiblingComponent />
        </CurrentUserProvider>
      </IntlProvider>,
    );

    expect(fetchMock.calls().length).toEqual(1);
    expect(screen.getByText(`Test component ${user.first_name}`));
    expect(screen.getByText(`Sibling component ${user.last_name}`));
    expect(getLatestHookValues()).toEqual({ currentUser: user });
  });
});
