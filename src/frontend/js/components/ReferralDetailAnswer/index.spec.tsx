import { render, screen, wait, waitFor, act } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import React from 'react';
import { IntlProvider } from 'react-intl';

import {
  Referral,
  ReferralState,
  Topic,
  Unit,
  UnitMember,
  UnitMembershipRole,
  User,
  Answer,
} from 'types';
import { ContextProps } from 'types/context';
import { Deferred } from 'utils/test/Deferred';
import { ReferralDetailAnswer } from '.';
import { ReferralFactory, AnswerFactory } from 'utils/test/factories';

describe('<ReferralDetailAnswer />', () => {
  const context: ContextProps['context'] = { csrftoken: 'the csrf token' };

  afterEach(() => fetchMock.restore());

  it('gets the referral and shows the answer if there is one', async () => {
    // Create a referral and an answer authored by an unit member
    const referral: Referral = ReferralFactory.generate();
    const answer: Answer = AnswerFactory.generate();
    answer.created_by = referral.topic.unit.members[0].id;
    answer.content = 'The answer content';

    const deferred = new Deferred<Referral>();
    fetchMock.get('/api/referrals/42/', deferred.promise);

    render(
      <IntlProvider locale="en">
        <ReferralDetailAnswer context={context} referralId={42} />
      </IntlProvider>,
    );

    screen.getByRole('status', { name: 'Loading answer...' });
    expect(fetchMock.called('/api/referrals/42/', { method: 'GET' }));

    await act(async () =>
      deferred.resolve({
        ...referral,
        answers: [answer],
        state: ReferralState.ANSWERED,
      }),
    );

    screen.getByRole('region', { name: 'Referral answer' });
    screen.getByText('The answer content');
  });

  it('gets the referral and renders a form if there is no answer', async () => {
    const referral: Referral = ReferralFactory.generate();

    const deferred = new Deferred<Referral>();
    fetchMock.get('/api/referrals/42/', deferred.promise);

    render(
      <IntlProvider locale="en">
        <ReferralDetailAnswer context={context} referralId={42} />
      </IntlProvider>,
    );

    screen.getByRole('status', { name: 'Loading answer...' });
    expect(fetchMock.called('/api/referrals/42/', { method: 'GET' }));

    await act(async () => deferred.resolve(referral));

    screen.getByRole('form', { name: 'Referral answer' });
    screen.getByRole('textbox', { name: 'Add an answer for this referral' });
    screen.getByRole('button', { name: 'Answer the referral' });
  });
});
