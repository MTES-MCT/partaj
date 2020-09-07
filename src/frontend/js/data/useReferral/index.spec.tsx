import { render, act } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import React, { Dispatch, SetStateAction } from 'react';

import { Referral } from 'types';
import { Context } from 'types/context';
import { Nullable } from 'types/utils';
import { Deferred } from 'utils/test/Deferred';
import { ReferralFactory } from 'utils/test/factories';
import { useReferral } from '.';

describe('useReferral', () => {
  const context: Context = {
    assets: { icons: 'icons.svg' },
    csrftoken: 'the csrf token',
    environment: 'test',
    sentry_dsn: 'https://sentry.dsn/0',
    token: 'the auth token',
  };

  let getLatestHookValues: () => {
    referral: Nullable<Referral>;
    setReferral: Dispatch<SetStateAction<Nullable<Referral>>>;
  };
  const TestComponent = ({ referralId }: { referralId: number }) => {
    const hookValues = useReferral(referralId, context);
    getLatestHookValues = () => hookValues;
    return <div></div>;
  };

  const referral = ReferralFactory.generate();
  referral.id = 42;

  it('gets the relevant referral by id and returns it to consumers', async () => {
    const deferred = new Deferred();
    fetchMock.get('/api/referrals/42/', deferred.promise);
    render(<TestComponent referralId={42} />);
    expect(getLatestHookValues().referral).toEqual(null);
    expect(
      fetchMock.called('/api/referrals/42/', {
        headers: {
          Authorization: 'Token the auth token',
          'Content-Type': 'application/json',
        },
      }),
    ).toEqual(true);

    await act(async () => deferred.resolve(referral));
    expect(getLatestHookValues().referral).toEqual(referral);
  });
});
