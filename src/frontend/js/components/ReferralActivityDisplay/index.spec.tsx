import { render, screen } from '@testing-library/react';
import React from 'react';
import { IntlProvider } from 'react-intl';

import * as types from 'types';
import * as factories from 'utils/test/factories';
import { getUserFullname } from 'utils/user';
import { ReferralActivityDisplay } from '.';

const { ReferralActivityVerb } = types;

describe('<ReferralActivityDisplay />', () => {
  const context = {
    assets: { icons: '/example/icons.svg' },
    csrftoken: 'the csrf token',
    environment: 'test',
    sentry_dsn: 'https://sentry.dsn/0',
    token: 'the auth token',
  };
  const setReferral = jest.fn();

  it(`displays the activity for "${ReferralActivityVerb.ANSWERED}"`, () => {
    // Create a referral along with a connected answer
    const referral: types.Referral = factories.ReferralFactory.generate();
    const answer: types.ReferralAnswer = factories.ReferralAnswerFactory.generate();
    answer.created_by = referral.topic.unit.members[0].id;
    answer.referral = referral.id;
    answer.state = types.ReferralAnswerState.PUBLISHED;
    referral.answers = [answer];
    // Create an activity for the answer we just built
    const activity: types.ReferralActivity = factories.ReferralActivityFactory.generate();
    activity.created_at = '2019-08-04T04:43:36.464Z';
    activity.item_content_object = answer;
    activity.referral = referral.id;
    activity.verb = ReferralActivityVerb.ANSWERED;

    render(
      <IntlProvider locale="en">
        <ReferralActivityDisplay
          {...{ activity, context, referral, setReferral }}
        />
      </IntlProvider>,
    );

    screen.getByText(
      `${getUserFullname(activity.actor)} answered this referral`,
    );
    screen.getByText('On August 4, 2019, 4:43 AM');
    screen.getByRole('article', { name: 'Referral answer' });
  });

  it(`displays the activity for "${ReferralActivityVerb.ASSIGNED}" [another user]`, () => {
    const referral: types.Referral = factories.ReferralFactory.generate();
    const activity: types.ReferralActivity = factories.ReferralActivityFactory.generate();
    activity.created_at = '2019-08-27T18:49:56.981Z';
    activity.item_content_object = factories.UserFactory.generate();
    activity.referral = referral.id;
    activity.verb = ReferralActivityVerb.ASSIGNED;

    render(
      <IntlProvider locale="en">
        <ReferralActivityDisplay
          {...{ activity, context, referral, setReferral }}
        />
      </IntlProvider>,
    );

    screen.getByText(
      `${getUserFullname(activity.actor)} assigned ${getUserFullname(
        activity.item_content_object as types.User,
      )} to this referral`,
    );
    screen.getByText('On August 27, 2019, 6:49 PM');
  });

  it(`displays the activity for "${ReferralActivityVerb.ASSIGNED}" [self]`, () => {
    const referral: types.Referral = factories.ReferralFactory.generate();
    const activity: types.ReferralActivity = factories.ReferralActivityFactory.generate();
    activity.created_at = '2020-03-24T07:41:10.709Z';
    activity.item_content_object = activity.actor;
    activity.referral = referral.id;
    activity.verb = ReferralActivityVerb.ASSIGNED;

    render(
      <IntlProvider locale="en">
        <ReferralActivityDisplay
          {...{ activity, context, referral, setReferral }}
        />
      </IntlProvider>,
    );

    screen.getByText(
      `${getUserFullname(activity.actor)} assigned themselves to this referral`,
    );
    screen.getByText('On March 24, 2020, 7:41 AM');
  });

  it(`displays the activity for "${ReferralActivityVerb.CREATED}"`, () => {
    const referral: types.Referral = factories.ReferralFactory.generate();
    const activity: types.ReferralActivity = factories.ReferralActivityFactory.generate();
    activity.actor = referral.user;
    activity.created_at = '2020-04-06T05:49:32.106Z';
    activity.referral = referral.id;
    activity.verb = ReferralActivityVerb.CREATED;

    render(
      <IntlProvider locale="en">
        <ReferralActivityDisplay
          {...{ activity, context, referral, setReferral }}
        />
      </IntlProvider>,
    );

    screen.getByText(
      `${getUserFullname(activity.actor)} requested a new referral`,
    );
    screen.getByText('On April 6, 2020, 5:49 AM');
    screen.getByRole('article', { name: `Referral #${referral.id}` });
  });

  it(`displays the activity for "${ReferralActivityVerb.UNASSIGNED}" [another user]`, () => {
    const referral: types.Referral = factories.ReferralFactory.generate();
    const activity: types.ReferralActivity = factories.ReferralActivityFactory.generate();
    activity.created_at = '2019-08-03T01:49:46.377Z';
    activity.item_content_object = factories.UserFactory.generate();
    activity.referral = referral.id;
    activity.verb = ReferralActivityVerb.UNASSIGNED;

    render(
      <IntlProvider locale="en">
        <ReferralActivityDisplay
          {...{ activity, context, referral, setReferral }}
        />
      </IntlProvider>,
    );

    screen.getByText(
      `${getUserFullname(activity.actor)} removed ${getUserFullname(
        activity.item_content_object as types.User,
      )} from assignees to this referral`,
    );
    screen.getByText('On August 3, 2019, 1:49 AM');
  });

  it(`displays the activity for "${ReferralActivityVerb.UNASSIGNED}" [self]`, () => {
    const referral: types.Referral = factories.ReferralFactory.generate();
    const activity: types.ReferralActivity = factories.ReferralActivityFactory.generate();
    activity.created_at = '2020-04-13T04:30:11.739Z';
    activity.item_content_object = activity.actor;
    activity.referral = referral.id;
    activity.verb = ReferralActivityVerb.UNASSIGNED;

    render(
      <IntlProvider locale="en">
        <ReferralActivityDisplay
          {...{ activity, context, referral, setReferral }}
        />
      </IntlProvider>,
    );

    screen.getByText(
      `${getUserFullname(
        activity.actor,
      )} removed themselves from assignees to this referral`,
    );
    screen.getByText('On April 13, 2020, 4:30 AM');
  });
});
