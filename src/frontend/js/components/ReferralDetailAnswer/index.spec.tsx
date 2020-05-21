import { act, render, screen } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import React from 'react';
import { IntlProvider } from 'react-intl';

import { CurrentUserContext } from 'data/useCurrentUser';
import {
  Referral,
  ReferralAnswer,
  ReferralState,
  UnitMember,
  User,
} from 'types';
import { ContextProps } from 'types/context';
import { Deferred } from 'utils/test/Deferred';
import {
  AnswerFactory,
  ReferralFactory,
  UnitMemberFactory,
  UserFactory,
} from 'utils/test/factories';
import { ReferralDetailAnswer } from '.';

describe('<ReferralDetailAnswer />', () => {
  const context: ContextProps['context'] = {
    assets: { icons: 'icons.svg' },
    csrftoken: 'the csrf token',
  };

  afterEach(() => fetchMock.restore());

  it('gets the referral and shows the answer if there is one', async () => {
    // Create a referral and an answer authored by an unit member
    const referral: Referral = ReferralFactory.generate();
    const answer: ReferralAnswer = AnswerFactory.generate();
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

  it('gets the referral and renders a form if there is no answer [user is unit member]', async () => {
    const currentUser: UnitMember = UnitMemberFactory.generate();
    const referral: Referral = ReferralFactory.generate();
    referral.topic.unit.members = [...referral.topic.unit.members, currentUser];

    const deferred = new Deferred<Referral>();
    fetchMock.get('/api/referrals/42/', deferred.promise);

    render(
      <IntlProvider locale="en">
        <CurrentUserContext.Provider value={{ currentUser }}>
          <ReferralDetailAnswer context={context} referralId={42} />
        </CurrentUserContext.Provider>
      </IntlProvider>,
    );

    screen.getByRole('status', { name: 'Loading answer...' });
    expect(fetchMock.called('/api/referrals/42/', { method: 'GET' }));

    await act(async () => deferred.resolve(referral));

    screen.getByRole('form', { name: 'Referral answer' });
    screen.getByRole('textbox', { name: 'Add an answer for this referral' });
    screen.getByRole('button', { name: 'Answer the referral' });
  });

  it('does not render the form for users who are not members of the related unit', async () => {
    const currentUser: User = UserFactory.generate();
    const referral: Referral = ReferralFactory.generate();

    const deferred = new Deferred<Referral>();
    fetchMock.get('/api/referrals/42/', deferred.promise);

    render(
      <IntlProvider locale="en">
        <CurrentUserContext.Provider value={{ currentUser }}>
          <ReferralDetailAnswer context={context} referralId={42} />
        </CurrentUserContext.Provider>
      </IntlProvider>,
    );

    screen.getByRole('status', { name: 'Loading answer...' });
    expect(fetchMock.called('/api/referrals/42/', { method: 'GET' }));

    await act(async () => deferred.resolve(referral));

    expect(screen.queryByRole('form', { name: 'Referral answer' })).toBeNull();
    expect(
      screen.queryByRole('textbox', {
        name: 'Add an answer for this referral',
      }),
    ).toBeNull();
    expect(
      screen.queryByRole('button', { name: 'Answer the referral' }),
    ).toBeNull();
  });
});
