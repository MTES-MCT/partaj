import { act, render, screen } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import React, { useContext } from 'react';
import { IntlProvider } from 'react-intl';

import { Referral, ReferralRelationship, ReferralSection } from 'types';
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
    relationships: Array<ReferralRelationship>;
    setRelationships: Function;
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
    const secondDeferred = new Deferred<ReferralRelationship[]>();

    fetchMock.get('/api/referrals/1/', deferred.promise);
    fetchMock.get('/api/referrals/1/group/', groupDeferred.promise);
    fetchMock.get(
      '/api/referralrelationships?referralId=1',
      secondDeferred.promise,
    );

    const { rerender } = render(
      <IntlProvider locale="en">
        <ReferralProvider referralId={'1'}>
          <TestComponent />
        </ReferralProvider>
      </IntlProvider>,
    );

    expect(fetchMock.called('/api/referrals/1/')).toEqual(true);

    // Resolve the first fetch to allow the second fetch to be called
    const referral = ReferralFactory.generate();
    await act(async () => deferred.resolve(referral));

    expect(fetchMock.called('/api/referralrelationships?referralId=1')).toEqual(
      true,
    );

    // Resolve the second fetch to complete the loading
    const relationships: ReferralRelationship[] = [];
    await act(async () => secondDeferred.resolve(relationships));

    expect(fetchMock.called('/api/referrals/1/group/')).toEqual(true);
    const group: ReferralSection[] = [];
    await act(async () => groupDeferred.resolve(group));

    expect(fetchMock.calls().length).toEqual(3);


    expect(getLatestHookValues()).toEqual({
      setReferral: expect.anything(),
      referral: referral,
      refetch: expect.anything(),
      relationships: [],
      group: [],
      setRelationships: expect.anything(),
    });

    rerender(
      <IntlProvider locale="en">
        <ReferralProvider referralId={'1'}>
          <TestComponent />
          <SiblingComponent />
        </ReferralProvider>
      </IntlProvider>,
    );

    expect(screen.getByText(`Test component ${referral.object}`));
    expect(screen.getByText(`Sibling component ${referral.state}`));
  });
});
