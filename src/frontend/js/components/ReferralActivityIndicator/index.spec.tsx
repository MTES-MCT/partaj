import { act, render, screen } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import React from 'react';
import { IntlProvider } from 'react-intl';
import { QueryClient, QueryClientProvider } from 'react-query';

import * as types from 'types';
import { Deferred } from 'utils/test/Deferred';
import * as factories from 'utils/test/factories';
import { getUserFullname } from 'utils/user';
import { ReferralActivityIndicator } from '.';

const { ReferralActivityVerb } = types;

describe('<ReferralActivityIndicator />', () => {
  it(`displays the activity for "${ReferralActivityVerb.ADDED_REQUESTER}""`, () => {
    const queryClient = new QueryClient();
    const referral: types.Referral = factories.ReferralFactory.generate();
    const activity: types.ReferralActivity = factories.ReferralActivityFactory.generate();
    activity.created_at = '2019-08-27T18:49:56.981Z';
    activity.item_content_object = factories.UserFactory.generate();
    activity.referral = referral.id;
    activity.verb = ReferralActivityVerb.ADDED_REQUESTER;

    render(
      <IntlProvider locale="en">
        <QueryClientProvider client={queryClient}>
          <ReferralActivityIndicator activity={activity} />
        </QueryClientProvider>
      </IntlProvider>,
    );

    screen.getByText(
      `${getUserFullname(activity.actor)} added ${getUserFullname(
        activity.item_content_object as types.User,
      )} as a requester on this referral`,
    );
    screen.getByText('August 27, 2019, 6:49 PM');
  });

  it(`displays the activity for "${ReferralActivityVerb.ANSWERED}"`, async () => {
    const queryClient = new QueryClient();
    // Create a referral along with a connected answer
    const referral: types.Referral = factories.ReferralFactory.generate();
    const answer: types.ReferralAnswer = factories.ReferralAnswerFactory.generate();
    answer.created_by = referral.units[0].members[0];
    answer.referral = referral.id;
    answer.state = types.ReferralAnswerState.PUBLISHED;
    referral.answers = [answer];
    // Create an activity for the answer we just built
    const activity: types.ReferralActivity = factories.ReferralActivityFactory.generate();
    activity.created_at = '2019-08-04T04:43:36.464Z';
    activity.item_content_object = answer;
    activity.referral = referral.id;
    activity.verb = ReferralActivityVerb.ANSWERED;

    const validationApproved1 = factories.ReferralAnswerValidationRequestFactory.generate();
    validationApproved1.response = factories.ReferralAnswerValidationResponseFactory.generate();
    validationApproved1.response.state =
      types.ReferralAnswerValidationResponseState.VALIDATED;

    const validationApproved2 = factories.ReferralAnswerValidationRequestFactory.generate();
    validationApproved2.response = factories.ReferralAnswerValidationResponseFactory.generate();
    validationApproved2.response.state =
      types.ReferralAnswerValidationResponseState.VALIDATED;

    const validationDenied = factories.ReferralAnswerValidationRequestFactory.generate();
    validationDenied.response = factories.ReferralAnswerValidationResponseFactory.generate();
    validationDenied.response.state =
      types.ReferralAnswerValidationResponseState.NOT_VALIDATED;

    const validationPending = factories.ReferralAnswerValidationRequestFactory.generate();
    const deferred = new Deferred();
    fetchMock.get(
      '/api/referralanswervalidationrequests/?limit=999',
      deferred.promise,
    );

    render(
      <IntlProvider locale="en">
        <QueryClientProvider client={queryClient}>
          <ReferralActivityIndicator activity={activity} />
        </QueryClientProvider>
      </IntlProvider>,
    );

    await act(async () =>
      deferred.resolve({
        count: 4,
        next: null,
        previous: null,
        results: [
          validationApproved1,
          validationDenied,
          validationApproved2,
          validationPending,
        ],
      }),
    );

    screen.getByText(
      `${getUserFullname(activity.actor)} answered this referral`,
    );
    screen.getByText('August 4, 2019, 4:43 AM');
    screen.getByText(
      `Validations: ${getUserFullname(
        validationApproved1.validator,
      )}, ${getUserFullname(validationApproved2.validator)}`,
    );
  });

  it(`displays the activity for "${ReferralActivityVerb.ASSIGNED}" [another user]`, () => {
    const queryClient = new QueryClient();
    const referral: types.Referral = factories.ReferralFactory.generate();
    const activity: types.ReferralActivity = factories.ReferralActivityFactory.generate();
    activity.created_at = '2019-08-27T18:49:56.981Z';
    activity.item_content_object = factories.UserFactory.generate();
    activity.referral = referral.id;
    activity.verb = ReferralActivityVerb.ASSIGNED;

    render(
      <IntlProvider locale="en">
        <QueryClientProvider client={queryClient}>
          <ReferralActivityIndicator activity={activity} />
        </QueryClientProvider>
      </IntlProvider>,
    );

    screen.getByText(
      `${getUserFullname(activity.actor)} assigned ${getUserFullname(
        activity.item_content_object as types.User,
      )} to this referral`,
    );
    screen.getByText('August 27, 2019, 6:49 PM');
  });

  it(`displays the activity for "${ReferralActivityVerb.ASSIGNED_UNIT}"`, () => {
    const queryClient = new QueryClient();
    const referral: types.Referral = factories.ReferralFactory.generate();
    const activity: types.ReferralActivity = factories.ReferralActivityFactory.generate();
    activity.created_at = '2019-08-27T18:49:56.981Z';
    activity.item_content_object = factories.UnitFactory.generate() as types.Unit;
    activity.item_content_object.name = 'SG/DAJ/BUREAU';
    activity.referral = referral.id;
    activity.verb = ReferralActivityVerb.ASSIGNED_UNIT;

    render(
      <IntlProvider locale="en">
        <QueryClientProvider client={queryClient}>
          <ReferralActivityIndicator activity={activity} />
        </QueryClientProvider>
      </IntlProvider>,
    );

    screen.getByText(
      `${getUserFullname(
        activity.actor,
      )} assigned SG/DAJ/BUREAU to this referral`,
    );
    screen.getByText('August 27, 2019, 6:49 PM');
  });

  it(`displays the activity for "${ReferralActivityVerb.ASSIGNED}" [self]`, () => {
    const queryClient = new QueryClient();
    const referral: types.Referral = factories.ReferralFactory.generate();
    const activity: types.ReferralActivity = factories.ReferralActivityFactory.generate();
    activity.created_at = '2020-03-24T07:41:10.709Z';
    activity.item_content_object = activity.actor;
    activity.referral = referral.id;
    activity.verb = ReferralActivityVerb.ASSIGNED;

    render(
      <IntlProvider locale="en">
        <QueryClientProvider client={queryClient}>
          <ReferralActivityIndicator activity={activity} />
        </QueryClientProvider>
      </IntlProvider>,
    );

    screen.getByText(
      `${getUserFullname(activity.actor)} assigned themselves to this referral`,
    );
    screen.getByText('March 24, 2020, 7:41 AM');
  });

  it(`displays the activity for "${ReferralActivityVerb.DRAFT_ANSWERED}"`, () => {
    const queryClient = new QueryClient();
    // Create a referral along with a connected answer
    const referral: types.Referral = factories.ReferralFactory.generate();
    const answer: types.ReferralAnswer = factories.ReferralAnswerFactory.generate();
    answer.created_by = referral.units[0].members[0];
    answer.referral = referral.id;
    answer.state = types.ReferralAnswerState.DRAFT;
    referral.answers = [answer];
    // Create an activity for the answer we just built
    const activity: types.ReferralActivity = factories.ReferralActivityFactory.generate();
    activity.created_at = '2019-08-04T04:43:36.464Z';
    activity.item_content_object = answer;
    activity.referral = referral.id;
    activity.verb = ReferralActivityVerb.DRAFT_ANSWERED;

    render(
      <IntlProvider locale="en">
        <QueryClientProvider client={queryClient}>
          <ReferralActivityIndicator activity={activity} />
        </QueryClientProvider>
      </IntlProvider>,
    );

    screen.getByText(
      `${getUserFullname(
        activity.actor,
      )} created a draft answer for this referral`,
    );
    screen.getByText('August 4, 2019, 4:43 AM');
  });

  it(`displays the activity for "${ReferralActivityVerb.REMOVED_REQUESTER}""`, () => {
    const queryClient = new QueryClient();
    const referral: types.Referral = factories.ReferralFactory.generate();
    const activity: types.ReferralActivity = factories.ReferralActivityFactory.generate();
    activity.created_at = '2019-08-27T18:49:56.981Z';
    activity.item_content_object = factories.UserFactory.generate();
    activity.referral = referral.id;
    activity.verb = ReferralActivityVerb.REMOVED_REQUESTER;

    render(
      <IntlProvider locale="en">
        <QueryClientProvider client={queryClient}>
          <ReferralActivityIndicator activity={activity} />
        </QueryClientProvider>
      </IntlProvider>,
    );

    screen.getByText(
      `${getUserFullname(activity.actor)} removed ${getUserFullname(
        activity.item_content_object as types.User,
      )} from requesters for this referral`,
    );
    screen.getByText('August 27, 2019, 6:49 PM');
  });

  it(`displays the activity for "${ReferralActivityVerb.UNASSIGNED}" [another user]`, () => {
    const queryClient = new QueryClient();
    const referral: types.Referral = factories.ReferralFactory.generate();
    const activity: types.ReferralActivity = factories.ReferralActivityFactory.generate();
    activity.created_at = '2019-08-03T01:49:46.377Z';
    activity.item_content_object = factories.UserFactory.generate();
    activity.referral = referral.id;
    activity.verb = ReferralActivityVerb.UNASSIGNED;

    render(
      <IntlProvider locale="en">
        <QueryClientProvider client={queryClient}>
          <ReferralActivityIndicator activity={activity} />
        </QueryClientProvider>
      </IntlProvider>,
    );

    screen.getByText(
      `${getUserFullname(activity.actor)} removed ${getUserFullname(
        activity.item_content_object as types.User,
      )} from assignees to this referral`,
    );
    screen.getByText('August 3, 2019, 1:49 AM');
  });

  it(`displays the activity for "${ReferralActivityVerb.UNASSIGNED}" [self]`, () => {
    const queryClient = new QueryClient();
    const referral: types.Referral = factories.ReferralFactory.generate();
    const activity: types.ReferralActivity = factories.ReferralActivityFactory.generate();
    activity.created_at = '2020-04-13T04:30:11.739Z';
    activity.item_content_object = activity.actor;
    activity.referral = referral.id;
    activity.verb = ReferralActivityVerb.UNASSIGNED;

    render(
      <IntlProvider locale="en">
        <QueryClientProvider client={queryClient}>
          <ReferralActivityIndicator activity={activity} />
        </QueryClientProvider>
      </IntlProvider>,
    );

    screen.getByText(
      `${getUserFullname(
        activity.actor,
      )} removed themselves from assignees to this referral`,
    );
    screen.getByText('April 13, 2020, 4:30 AM');
  });

  it(`displays the activity for "${ReferralActivityVerb.UNASSIGNED_UNIT}"`, () => {
    const queryClient = new QueryClient();
    const referral: types.Referral = factories.ReferralFactory.generate();
    const activity: types.ReferralActivity = factories.ReferralActivityFactory.generate();
    activity.created_at = '2019-08-27T18:49:56.981Z';
    activity.item_content_object = factories.UnitFactory.generate() as types.Unit;
    activity.item_content_object.name = 'SG/DAJ/BUREAU';
    activity.referral = referral.id;
    activity.verb = ReferralActivityVerb.UNASSIGNED_UNIT;

    render(
      <IntlProvider locale="en">
        <QueryClientProvider client={queryClient}>
          <ReferralActivityIndicator activity={activity} />
        </QueryClientProvider>
      </IntlProvider>,
    );

    screen.getByText(
      `${getUserFullname(
        activity.actor,
      )} removed SG/DAJ/BUREAU's assignment to this referral`,
    );
    screen.getByText('August 27, 2019, 6:49 PM');
  });

  it(`displays the activity for "${ReferralActivityVerb.VALIDATED}"`, () => {
    const queryClient = new QueryClient();
    const referral: types.Referral = factories.ReferralFactory.generate();
    const answer: types.ReferralAnswer = factories.ReferralAnswerFactory.generate();
    answer.referral = referral.id;
    const validationRequest = factories.ReferralAnswerValidationRequestFactory.generate();
    validationRequest.response = factories.ReferralAnswerValidationResponseFactory.generate();
    const activity: types.ReferralActivity = factories.ReferralActivityFactory.generate();
    activity.created_at = '2020-10-05T02:09:12.713Z';
    activity.item_content_object = validationRequest;
    activity.verb = ReferralActivityVerb.VALIDATED;

    render(
      <IntlProvider locale="en">
        <QueryClientProvider client={queryClient}>
          <ReferralActivityIndicator activity={activity} />
        </QueryClientProvider>
      </IntlProvider>,
    );

    screen.getByText(
      `${getUserFullname(activity.actor)} validated an answer to this referral`,
    );
    screen.getByText('October 5, 2020, 2:09 AM');
  });

  it(`displays the activity for "${ReferralActivityVerb.VALIDATION_DENIED}"`, () => {
    const queryClient = new QueryClient();
    const referral: types.Referral = factories.ReferralFactory.generate();
    const answer: types.ReferralAnswer = factories.ReferralAnswerFactory.generate();
    answer.referral = referral.id;
    const validationRequest = factories.ReferralAnswerValidationRequestFactory.generate();
    validationRequest.response = factories.ReferralAnswerValidationResponseFactory.generate();
    const activity: types.ReferralActivity = factories.ReferralActivityFactory.generate();
    activity.created_at = '2020-10-05T02:09:12.713Z';
    activity.item_content_object = validationRequest;
    activity.verb = ReferralActivityVerb.VALIDATION_DENIED;

    render(
      <IntlProvider locale="en">
        <QueryClientProvider client={queryClient}>
          <ReferralActivityIndicator activity={activity} />
        </QueryClientProvider>
      </IntlProvider>,
    );

    screen.getByText(
      `${getUserFullname(
        activity.actor,
      )} requested changes to an answer to this referral`,
    );
    screen.getByText('October 5, 2020, 2:09 AM');
  });

  it(`displays the activity for "${ReferralActivityVerb.VALIDATION_REQUESTED}"`, () => {
    const queryClient = new QueryClient();
    const referral: types.Referral = factories.ReferralFactory.generate();
    const answer: types.ReferralAnswer = factories.ReferralAnswerFactory.generate();
    answer.referral = referral.id;
    const validationRequest = factories.ReferralAnswerValidationRequestFactory.generate();
    const activity: types.ReferralActivity = factories.ReferralActivityFactory.generate();
    activity.created_at = '2020-10-05T02:09:12.713Z';
    activity.item_content_object = validationRequest;
    activity.verb = ReferralActivityVerb.VALIDATION_REQUESTED;

    render(
      <IntlProvider locale="en">
        <QueryClientProvider client={queryClient}>
          <ReferralActivityIndicator activity={activity} />
        </QueryClientProvider>
      </IntlProvider>,
    );

    screen.getByText(
      `${getUserFullname(
        activity.actor,
      )} requested a validation from ${getUserFullname(
        validationRequest.validator,
      )} for an answer to this referral`,
    );
    screen.getByText('October 5, 2020, 2:09 AM');
  });
});
