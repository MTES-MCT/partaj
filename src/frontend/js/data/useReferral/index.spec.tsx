import { render, act } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import React, { Dispatch, SetStateAction } from 'react';

import { Referral } from 'types';
import { Nullable } from 'types/utils';
import { Deferred } from 'utils/test/Deferred';
import { ReferralFactory } from 'utils/test/factories';
import { useReferral } from '.';

describe('useReferral', () => {
  let getLatestHookValues: () => {
    referral: Nullable<Referral>;
    setReferral: Dispatch<SetStateAction<Nullable<Referral>>>;
  };
  const TestComponent = ({ referralId }: { referralId: number }) => {
    const hookValues = useReferral(referralId);
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

    await act(async () => deferred.resolve(referral));
    expect(getLatestHookValues().referral).toEqual(referral);
  });
});
