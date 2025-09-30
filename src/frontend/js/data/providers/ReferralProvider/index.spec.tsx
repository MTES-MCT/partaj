import { act, render, screen } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import React, { useContext } from 'react';
import { IntlProvider } from 'react-intl';

import { Referral, ReferralSection } from 'types';
import { Nullable } from 'types/utils';
import { Deferred } from 'utils/test/Deferred';
import { ReferralFactory } from 'utils/test/factories';
import { ReferralContext, ReferralProvider } from '.';

describe('ReferralProvider', () => {
  let getLatestHookValues: () => {
    referral: Nullable<Referral>;
    refetch: Function;
    setReferral: Function;
    group: ReferralSection[];
  };
  const TestComponent = () => {
    const hookValues = useContext(ReferralContext);
    getLatestHookValues = () => hookValues;
    return (
      <div>
        Test component{' '}
        {hookValues.referral ? hookValues.referral.object : 'empty'}
      </div>
    );
  };

  const SiblingComponent = () => {
    const { referral } = useContext(ReferralContext);
    return <div>Sibling component {referral?.state}</div>;
  };

  afterEach(() => fetchMock.restore());

  it('gets the referral and returns it to consumers through a context', async () => {
    const deferred = new Deferred<Referral>();
    const groupDeferred = new Deferred<ReferralSection[]>();

    fetchMock.get('/api/referrals/1/', deferred.promise);
    fetchMock.get('/api/referrals/1/group/', groupDeferred.promise);

    const { rerender } = render(
      <IntlProvider locale="en">
        <ReferralProvider referralId={'1'}>
          <TestComponent />
          <SiblingComponent />
        </ReferralProvider>
      </IntlProvider>,
    );

    expect(fetchMock.called('/api/referrals/1/')).toEqual(true);
    const referral = ReferralFactory.generate();
    await act(async () => deferred.resolve(referral));

    expect(fetchMock.called('/api/referrals/1/group/')).toEqual(true);
    const group: ReferralSection[] = [];
    await act(async () => groupDeferred.resolve(group));

    expect(fetchMock.calls().length).toEqual(2);

    expect(screen.getByText(`Test component ${referral.object}`));
    expect(screen.getByText(`Sibling component ${referral.state}`));

    expect(getLatestHookValues()).toEqual({
      referral: expect.anything(),
      refetch: expect.anything(),
      setReferral: expect.anything(),
      group: [],
    });
  });
});
