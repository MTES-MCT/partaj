import {
  act,
  getByRole,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import React from 'react';
import { IntlProvider } from 'react-intl';
import { QueryClient, QueryClientProvider } from 'react-query';
import { MemoryRouter, Route } from 'react-router';

import { CurrentUserContext } from 'data/useCurrentUser';
import * as types from 'types';
import { Deferred } from 'utils/test/Deferred';
import * as factories from 'utils/test/factories';
import { sendForm } from 'utils/sendForm';
import { getUserFullname } from 'utils/user';
import { ReferralDetail } from '.';

jest.mock('../../utils/sendForm', () => ({
  sendForm: jest
    .fn()
    .mockReturnValue(
      new Promise((resolve) =>
        resolve({ id: 'ecba651c-5a5f-4389-8a22-bd6038c81817' }),
      ),
    ),
}));

describe('<ReferralDetail />', () => {
  beforeEach(() => fetchMock.restore());

  it('shows general information on the referral', async () => {
    const queryClient = new QueryClient();

    const unit: types.Unit = factories.UnitFactory.generate();
    const membership: types.UnitMembership = factories.UnitMembershipFactory.generate();
    membership.unit = unit.id;
    const user: types.User = factories.UserFactory.generate();
    user.memberships = [membership];

    const referral: types.Referral = factories.ReferralFactory.generate();
    referral.units = [unit];
    referral.due_date = '2021-06-19T13:09:43.079Z';

    const getReferralDeferred = new Deferred();
    fetchMock.get(
      `/api/referrals/${referral.id}/`,
      getReferralDeferred.promise,
    );

    fetchMock.get(
      `/api/referralactivities/?limit=999&referral=${referral.id}`,
      new Promise(() => {}),
    );

    render(
      <IntlProvider locale="en">
        <MemoryRouter
          initialEntries={[
            `/unit/${referral.units[0].id}/referral-detail/${referral.id}`,
          ]}
        >
          <QueryClientProvider client={queryClient}>
            <CurrentUserContext.Provider value={{ currentUser: user }}>
              <Route path={'/unit/:unitId/referral-detail/:referralId'}>
                <ReferralDetail />
              </Route>
            </CurrentUserContext.Provider>
          </QueryClientProvider>
        </MemoryRouter>
      </IntlProvider>,
    );

    screen.getByText(`Loading referral #${referral.id}...`);
    await act(async () => getReferralDeferred.resolve(referral));

    screen.getByRole('heading', { name: referral.object });
    screen.getByText('Due date: June 19, 2021');
    screen.getByText('Received');
    screen.getByRole('button', { name: 'Show assignments' });

    screen.getByRole('link', { name: 'Referral' });
    screen.getByRole('link', { name: 'Tracking' });
    screen.getByRole('link', { name: 'Messages' });
    screen.getByRole('link', { name: 'Draft answers' });
    expect(screen.queryByRole('link', { name: 'Answer' })).toBeNull();
  });

  it('does not show the draft answers tab to the referral author', async () => {
    const queryClient = new QueryClient();
    const user = factories.UserFactory.generate();

    const referral: types.Referral = factories.ReferralFactory.generate();
    referral.due_date = '2021-06-19T13:09:43.079Z';
    referral.users = [user];

    const getReferralDeferred = new Deferred();
    fetchMock.get(
      `/api/referrals/${referral.id}/`,
      getReferralDeferred.promise,
    );

    fetchMock.get(
      `/api/referralactivities/?limit=999&referral=${referral.id}`,
      new Promise(() => {}),
    );

    render(
      <IntlProvider locale="en">
        <MemoryRouter
          initialEntries={[
            `/unit/${referral.units[0].id}/referral-detail/${referral.id}`,
          ]}
        >
          <QueryClientProvider client={queryClient}>
            <CurrentUserContext.Provider value={{ currentUser: user }}>
              <Route path={'/unit/:unitId/referral-detail/:referralId'}>
                <ReferralDetail />
              </Route>
            </CurrentUserContext.Provider>
          </QueryClientProvider>
        </MemoryRouter>
      </IntlProvider>,
    );

    screen.getByText(`Loading referral #${referral.id}...`);
    await act(async () => getReferralDeferred.resolve(referral));

    screen.getByRole('heading', { name: referral.object });
    screen.getByText('Due date: June 19, 2021');
    screen.getByText('Received');
    screen.getByRole('button', { name: 'Show assignments' });

    screen.getByRole('link', { name: 'Referral' });
    screen.getByRole('link', { name: 'Tracking' });
    screen.getByRole('link', { name: 'Messages' });
    expect(screen.queryByRole('link', { name: 'Draft answers' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Answer' })).toBeNull();
  });

  describe('content tab', () => {
    it('shows the contents of the referral', async () => {
      const queryClient = new QueryClient();
      const referral: types.Referral = factories.ReferralFactory.generate();

      const getReferralDeferred = new Deferred();
      fetchMock.get(
        `/api/referrals/${referral.id}/`,
        getReferralDeferred.promise,
      );

      fetchMock.get(
        `/api/referralactivities/?limit=999&referral=${referral.id}`,
        new Promise(() => {}),
      );

      render(
        <IntlProvider locale="en">
          <MemoryRouter
            initialEntries={[
              `/unit/${referral.units[0].id}/referral-detail/${referral.id}`,
            ]}
          >
            <QueryClientProvider client={queryClient}>
              <Route path={'/unit/:unitId/referral-detail/:referralId'}>
                <ReferralDetail />
              </Route>
            </QueryClientProvider>
          </MemoryRouter>
        </IntlProvider>,
      );

      screen.getByRole('status', {
        name: `Loading referral #${referral.id}...`,
      });
      await act(async () => getReferralDeferred.resolve(referral));

      const referralLink = screen.getByRole('link', { name: 'Referral' });
      userEvent.click(referralLink);

      screen.getByRole('heading', { name: 'Referral topic' });
      screen.getByText(referral.topic.name);
      screen.getByRole('heading', { name: 'Referral question' });
      screen.getByText((element) =>
        element.startsWith(referral.question.substr(0, 20)),
      );
      screen.getByRole('heading', { name: 'Context' });
      screen.getByText((element) =>
        element.startsWith(referral.context.substr(0, 20)),
      );
      screen.getByRole('heading', { name: 'Prior work' });
      screen.getByText((element) =>
        element.startsWith(referral.prior_work.substr(0, 20)),
      );
      screen.getByRole('group', { name: 'Attachments' });
      for (const attachment of referral.attachments) {
        screen.getByRole('link', {
          name: (content) => content.startsWith(attachment.name_with_extension),
        });
      }
      screen.getByRole('heading', { name: 'Expected response time' });
      screen.getByText(referral.urgency_level.name);
      screen.getByRole('heading', { name: 'Urgency explanation' });
      screen.getByText(referral.urgency_explanation);
    });
  });

  describe('final answer tab', () => {
    it('shows the final answer to the referral', async () => {
      const queryClient = new QueryClient();
      const referral: types.Referral = factories.ReferralFactory.generate();
      referral.state = types.ReferralState.ANSWERED;
      const answer: types.ReferralAnswer = factories.ReferralAnswerFactory.generate();
      answer.state = types.ReferralAnswerState.PUBLISHED;
      referral.units[0].members.push({
        ...answer.created_by,
        membership: factories.UnitMembershipFactory.generate(),
      });
      referral.answers.push(answer);

      const getReferralDeferred = new Deferred();
      fetchMock.get(
        `/api/referrals/${referral.id}/`,
        getReferralDeferred.promise,
      );

      fetchMock.get(
        `/api/referralactivities/?limit=999&referral=${referral.id}`,
        new Promise(() => {}),
      );

      render(
        <IntlProvider locale="en">
          <MemoryRouter
            initialEntries={[
              `/unit/${referral.units[0].id}/referral-detail/${referral.id}`,
            ]}
          >
            <QueryClientProvider client={queryClient}>
              <Route path={'/unit/:unitId/referral-detail/:referralId'}>
                <ReferralDetail />
              </Route>
            </QueryClientProvider>
          </MemoryRouter>
        </IntlProvider>,
      );

      screen.getByRole('status', {
        name: `Loading referral #${referral.id}...`,
      });
      await act(async () => getReferralDeferred.resolve(referral));

      const answerLink = screen.getByRole('link', { name: 'Answer' });
      userEvent.click(answerLink);

      screen.getByRole('article', { name: 'Referral answer' });
      screen.getByRole('group', { name: 'Attachments' });
      for (const attachment of answer.attachments) {
        screen.getByRole('link', {
          name: (content) => content.startsWith(attachment.name_with_extension),
        });
      }
    });
  });

  describe('draft answers tab', () => {
    it('shows the list of draft answers', async () => {
      const queryClient = new QueryClient();

      const unit: types.Unit = factories.UnitFactory.generate();
      const membership: types.UnitMembership = factories.UnitMembershipFactory.generate();
      membership.unit = unit.id;
      const user: types.User = factories.UserFactory.generate();
      user.memberships = [membership];

      const referral: types.Referral = factories.ReferralFactory.generate();
      referral.units = [unit];
      referral.due_date = '2021-06-19T13:09:43.079Z';

      const getReferralDeferred = new Deferred();
      fetchMock.get(
        `/api/referrals/${referral.id}/`,
        getReferralDeferred.promise,
      );

      fetchMock.get(
        `/api/referralactivities/?limit=999&referral=${referral.id}`,
        new Promise(() => {}),
      );

      const answers: types.ReferralAnswer[] = [
        factories.ReferralAnswerFactory.generate(),
      ];
      answers[0].created_at = '2020-05-15T17:51:44.798Z';
      const getReferralAnswersDeferred = new Deferred();
      fetchMock.get(
        `/api/referralanswers/?limit=999&referral=${referral.id}`,
        getReferralAnswersDeferred.promise,
      );

      fetchMock.get(
        `/api/referralanswervalidationrequests/?answer=${answers[0].id}&limit=999`,
        new Promise(() => {}),
      );

      render(
        <IntlProvider locale="en">
          <MemoryRouter
            initialEntries={[
              `/unit/${referral.units[0].id}/referral-detail/${referral.id}`,
            ]}
          >
            <QueryClientProvider client={queryClient}>
              <CurrentUserContext.Provider value={{ currentUser: user }}>
                <Route path={'/unit/:unitId/referral-detail/:referralId'}>
                  <ReferralDetail />
                </Route>
              </CurrentUserContext.Provider>
            </QueryClientProvider>
          </MemoryRouter>
        </IntlProvider>,
      );

      screen.getByText(`Loading referral #${referral.id}...`);
      await act(async () => getReferralDeferred.resolve(referral));

      const draftAnswersLink = screen.getByRole('link', {
        name: 'Draft answers',
      });
      userEvent.click(draftAnswersLink);

      screen.getByRole('status', { name: 'Loading referral answers...' });
      await act(async () =>
        getReferralAnswersDeferred.resolve({
          count: 1,
          next: null,
          previous: null,
          results: answers,
        }),
      );

      screen.getByRole('table');
      screen.getByRole('cell', {
        name: (content) =>
          content.startsWith(getUserFullname(answers[0].created_by)),
      });
      screen.getByRole('cell', { name: '5/15/2020' });
      screen.getByRole('cell', { name: 'Loading answer status...' });
    });
  });

  describe('tracking tab', () => {
    it('shows the list of activities on the referral', async () => {
      const queryClient = new QueryClient();
      const referral: types.Referral = factories.ReferralFactory.generate();

      const getReferralDeferred = new Deferred();
      fetchMock.get(
        `/api/referrals/${referral.id}/`,
        getReferralDeferred.promise,
      );

      const activityResults: types.ReferralActivity[] = [
        factories.ReferralActivityFactory.generate(),
      ];
      activityResults[0].verb = types.ReferralActivityVerb.CREATED;
      activityResults[0].item_content_object = null;

      const getActivitiesDeferred = new Deferred();
      fetchMock.get(
        `/api/referralactivities/?limit=999&referral=${referral.id}`,
        getActivitiesDeferred.promise,
      );

      render(
        <IntlProvider locale="en">
          <MemoryRouter
            initialEntries={[
              `/unit/${referral.units[0].id}/referral-detail/${referral.id}`,
            ]}
          >
            <QueryClientProvider client={queryClient}>
              <Route path={'/unit/:unitId/referral-detail/:referralId'}>
                <ReferralDetail />
              </Route>
            </QueryClientProvider>
          </MemoryRouter>
        </IntlProvider>,
      );

      screen.getByRole('status', {
        name: `Loading referral #${referral.id}...`,
      });
      await act(async () => getReferralDeferred.resolve(referral));

      screen.getByRole('status', { name: 'Loading activities...' });
      await act(async () =>
        getActivitiesDeferred.resolve({
          count: 1,
          next: null,
          previous: null,
          results: activityResults,
        }),
      );

      screen.getByText(
        `${getUserFullname(activityResults[0].actor)} requested a new referral`,
      );
    });
  });

  describe('messages tab', () => {
    it('shows a chat window where the user can send new messages', async () => {
      const queryClient = new QueryClient();
      const referral: types.Referral = factories.ReferralFactory.generate();
      referral.due_date = '2021-06-19T13:09:43.079Z';

      const getReferralDeferred = new Deferred();
      fetchMock.get(
        `/api/referrals/${referral.id}/`,
        getReferralDeferred.promise,
      );

      fetchMock.get(
        `/api/referralactivities/?limit=999&referral=${referral.id}`,
        new Promise(() => {}),
      );

      const messages: types.ReferralMessage[] = factories.ReferralMessageFactory.generate(
        2,
      );
      messages[0].attachments = factories.ReferralMessageAttachmentFactory.generate(
        3,
      );
      messages[1].attachments = factories.ReferralMessageAttachmentFactory.generate(
        2,
      );
      const getMessagesDeferred = new Deferred();
      fetchMock.get(
        `/api/referralmessages/?limit=999&referral=${referral.id}`,
        getMessagesDeferred.promise,
      );

      render(
        <IntlProvider locale="en">
          <MemoryRouter
            initialEntries={[
              `/unit/${referral.units[0].id}/referral-detail/${referral.id}`,
            ]}
          >
            <QueryClientProvider client={queryClient}>
              <Route path={'/unit/:unitId/referral-detail/:referralId'}>
                <ReferralDetail />
              </Route>
            </QueryClientProvider>
          </MemoryRouter>
        </IntlProvider>,
      );

      screen.getByRole('status', {
        name: `Loading referral #${referral.id}...`,
      });
      await act(async () => getReferralDeferred.resolve(referral));

      const messagesLink = screen.getByRole('link', {
        name: 'Messages',
      });
      userEvent.click(messagesLink);

      screen.getByRole('status', { name: 'Loading messages...' });
      await act(async () =>
        getMessagesDeferred.resolve({
          count: 2,
          next: null,
          previous: null,
          results: messages,
        }),
      );

      expect(screen.getAllByRole('article')).toHaveLength(2);
      expect(
        screen.getAllByRole('group', { name: 'Attachments' }),
      ).toHaveLength(2);
      for (const message of messages) {
        screen.getByText((content) =>
          content.startsWith(message.content.substr(0, 20)),
        );
        screen.getByText(getUserFullname(message.user));
        for (const attachment of message.attachments) {
          screen.getByRole('link', {
            name: (content) =>
              content.startsWith(attachment.name_with_extension),
          });
        }
      }

      const textarea = screen.getByRole('textbox', { name: 'Send a message' });
      userEvent.click(textarea);
      userEvent.type(textarea, 'Some message textual content');

      screen.getByRole('button', {
        name: 'Manage attachments',
      });
      const file = new File(['(⌐□_□)'], 'upload_attachment.png', {
        type: 'image/png',
      });
      await act(async () =>
        userEvent.upload(document.querySelector(`[type="file"]`)!, [file]),
      );
      screen.getByText('upload_attachment.png');
      screen.getByRole('button', { name: 'Remove' });

      const sendMessageBtn = screen.getByRole('button', { name: 'Send' });
      userEvent.click(sendMessageBtn);
      await waitFor(() => {
        expect(sendForm).toHaveBeenCalled();
      });
      expect(sendForm).toHaveBeenCalledWith({
        headers: {
          Authorization: 'Token the bearer token',
        },
        keyValuePairs: [
          ['content', 'Some message textual content'],
          ['referral', String(referral.id)],
          ['files', file],
        ],
        url: '/api/referralmessages/',
      });
    });

    it('shows help text for unit members when the window is empty', async () => {
      const queryClient = new QueryClient();
      const referral: types.Referral = factories.ReferralFactory.generate();
      referral.due_date = '2021-06-19T13:09:43.079Z';

      const getReferralDeferred = new Deferred();
      fetchMock.get(`/api/referrals/${referral.id}/`, referral);

      fetchMock.get(
        `/api/referralactivities/?limit=999&referral=${referral.id}`,
        new Promise(() => {}),
      );

      const getMessagesDeferred = new Deferred();
      fetchMock.get(
        `/api/referralmessages/?limit=999&referral=${referral.id}`,
        getMessagesDeferred.promise,
      );

      render(
        <IntlProvider locale="en">
          <MemoryRouter
            initialEntries={[
              `/unit/${referral.units[0].id}/referral-detail/${referral.id}`,
            ]}
          >
            <QueryClientProvider client={queryClient}>
              <CurrentUserContext.Provider
                value={{ currentUser: referral.units[0].members[0] }}
              >
                <Route path={'/unit/:unitId/referral-detail/:referralId'}>
                  <ReferralDetail />
                </Route>
              </CurrentUserContext.Provider>
            </QueryClientProvider>
          </MemoryRouter>
        </IntlProvider>,
      );

      screen.getByRole('status', {
        name: `Loading referral #${referral.id}...`,
      });
      await act(async () => getReferralDeferred.resolve(referral));

      const messagesLink = screen.getByRole('link', {
        name: 'Messages',
      });
      userEvent.click(messagesLink);

      screen.getByRole('status', { name: 'Loading messages...' });
      await act(async () =>
        getMessagesDeferred.resolve({
          count: 0,
          next: null,
          previous: null,
          results: [],
        }),
      );

      screen.getByRole('textbox', { name: 'Send a message' });
      screen.getByText(
        (_, element) =>
          element?.innerHTML ===
          `Send a message to requesters for this referral: <b>${referral.users
            .map((user) => getUserFullname(user))
            .join(
              ', ',
            )}</b>. They will receive an email to inform them of your message.`,
      );
    });

    it('shows help text for the requester (with no assignees) when the window is empty', async () => {
      const queryClient = new QueryClient();

      const unit1: types.Unit = factories.UnitFactory.generate();
      {
        const owner1: types.UnitMember = factories.UnitMemberFactory.generate();
        owner1.membership.role = types.UnitMembershipRole.OWNER;
        const owner2: types.UnitMember = factories.UnitMemberFactory.generate();
        owner2.membership.role = types.UnitMembershipRole.OWNER;
        const member: types.UnitMember = factories.UnitMemberFactory.generate();
        member.membership.role = types.UnitMembershipRole.MEMBER;
        unit1.members = [owner1, owner2, member];
      }

      const unit2: types.Unit = factories.UnitFactory.generate();
      {
        const owner: types.UnitMember = factories.UnitMemberFactory.generate();
        owner.membership.role = types.UnitMembershipRole.OWNER;
        const admin: types.UnitMember = factories.UnitMemberFactory.generate();
        admin.membership.role = types.UnitMembershipRole.ADMIN;
        const member: types.UnitMember = factories.UnitMemberFactory.generate();
        member.membership.role = types.UnitMembershipRole.MEMBER;
        unit2.members = [owner, admin, member];
      }

      const referral: types.Referral = factories.ReferralFactory.generate();
      referral.due_date = '2021-06-19T13:09:43.079Z';
      referral.units = [unit1, unit2];

      const owners = [
        referral.units[0].members[0],
        referral.units[0].members[1],
        referral.units[1].members[0],
      ];

      const getReferralDeferred = new Deferred();
      fetchMock.get(`/api/referrals/${referral.id}/`, referral);

      fetchMock.get(
        `/api/referralactivities/?limit=999&referral=${referral.id}`,
        new Promise(() => {}),
      );

      const getMessagesDeferred = new Deferred();
      fetchMock.get(
        `/api/referralmessages/?limit=999&referral=${referral.id}`,
        getMessagesDeferred.promise,
      );

      render(
        <IntlProvider locale="en">
          <MemoryRouter
            initialEntries={[
              `/unit/${referral.units[0].id}/referral-detail/${referral.id}`,
            ]}
          >
            <QueryClientProvider client={queryClient}>
              <CurrentUserContext.Provider
                value={{ currentUser: referral.users[0] }}
              >
                <Route path={'/unit/:unitId/referral-detail/:referralId'}>
                  <ReferralDetail />
                </Route>
              </CurrentUserContext.Provider>
            </QueryClientProvider>
          </MemoryRouter>
        </IntlProvider>,
      );

      screen.getByRole('status', {
        name: `Loading referral #${referral.id}...`,
      });
      await act(async () => getReferralDeferred.resolve(referral));

      const messagesLink = screen.getByRole('link', {
        name: 'Messages',
      });
      userEvent.click(messagesLink);

      screen.getByRole('status', { name: 'Loading messages...' });
      await act(async () =>
        getMessagesDeferred.resolve({
          count: 0,
          next: null,
          previous: null,
          results: [],
        }),
      );

      screen.getByRole('textbox', { name: 'Send a message' });
      screen.getByText(
        (_, element) =>
          element?.innerHTML ===
          `Send a message to the head(s) of the units linked to this referral: <b>${owners
            .map((owner) => getUserFullname(owner))
            .join(
              ', ',
            )}</b>. They will receive an email to inform them of your message.`,
      );
    });

    it('shows help text for the requester (with one assignee) when the window is empty', async () => {
      const queryClient = new QueryClient();
      const referral: types.Referral = factories.ReferralFactory.generate();
      referral.due_date = '2021-06-19T13:09:43.079Z';
      referral.assignees = [factories.UnitMemberFactory.generate()];

      const getReferralDeferred = new Deferred();
      fetchMock.get(`/api/referrals/${referral.id}/`, referral);

      fetchMock.get(
        `/api/referralactivities/?limit=999&referral=${referral.id}`,
        new Promise(() => {}),
      );

      const getMessagesDeferred = new Deferred();
      fetchMock.get(
        `/api/referralmessages/?limit=999&referral=${referral.id}`,
        getMessagesDeferred.promise,
      );

      render(
        <IntlProvider locale="en">
          <MemoryRouter
            initialEntries={[
              `/unit/${referral.units[0].id}/referral-detail/${referral.id}`,
            ]}
          >
            <QueryClientProvider client={queryClient}>
              <CurrentUserContext.Provider
                value={{ currentUser: referral.users[0] }}
              >
                <Route path={'/unit/:unitId/referral-detail/:referralId'}>
                  <ReferralDetail />
                </Route>
              </CurrentUserContext.Provider>
            </QueryClientProvider>
          </MemoryRouter>
        </IntlProvider>,
      );

      screen.getByRole('status', {
        name: `Loading referral #${referral.id}...`,
      });
      await act(async () => getReferralDeferred.resolve(referral));

      const messagesLink = screen.getByRole('link', {
        name: 'Messages',
      });
      userEvent.click(messagesLink);

      screen.getByRole('status', { name: 'Loading messages...' });
      await act(async () =>
        getMessagesDeferred.resolve({
          count: 0,
          next: null,
          previous: null,
          results: [],
        }),
      );

      screen.getByRole('textbox', { name: 'Send a message' });
      screen.getByText(
        (_, element) =>
          element?.innerHTML ===
          `Send a message to <b>${getUserFullname(
            referral.assignees[0],
          )}</b>, who is the assignee for this referral. They will receive an email to inform them of your message.`,
      );
    });

    it('shows help text for the requester (with more than one assignee) when the window is empty', async () => {
      const queryClient = new QueryClient();
      const referral: types.Referral = factories.ReferralFactory.generate();
      referral.due_date = '2021-06-19T13:09:43.079Z';
      referral.assignees = [
        factories.UnitMemberFactory.generate(),
        factories.UnitMemberFactory.generate(),
      ];

      const getReferralDeferred = new Deferred();
      fetchMock.get(`/api/referrals/${referral.id}/`, referral);

      fetchMock.get(
        `/api/referralactivities/?limit=999&referral=${referral.id}`,
        new Promise(() => {}),
      );

      const getMessagesDeferred = new Deferred();
      fetchMock.get(
        `/api/referralmessages/?limit=999&referral=${referral.id}`,
        getMessagesDeferred.promise,
      );

      render(
        <IntlProvider locale="en">
          <MemoryRouter
            initialEntries={[
              `/unit/${referral.units[0].id}/referral-detail/${referral.id}`,
            ]}
          >
            <QueryClientProvider client={queryClient}>
              <CurrentUserContext.Provider
                value={{ currentUser: referral.users[0] }}
              >
                <Route path={'/unit/:unitId/referral-detail/:referralId'}>
                  <ReferralDetail />
                </Route>
              </CurrentUserContext.Provider>
            </QueryClientProvider>
          </MemoryRouter>
        </IntlProvider>,
      );

      screen.getByRole('status', {
        name: `Loading referral #${referral.id}...`,
      });
      await act(async () => getReferralDeferred.resolve(referral));

      const messagesLink = screen.getByRole('link', {
        name: 'Messages',
      });
      userEvent.click(messagesLink);

      screen.getByRole('status', { name: 'Loading messages...' });
      await act(async () =>
        getMessagesDeferred.resolve({
          count: 0,
          next: null,
          previous: null,
          results: [],
        }),
      );

      screen.getByRole('textbox', { name: 'Send a message' });
      screen.getByText(
        (_, element) =>
          element?.innerHTML ===
          `Send a message to assignees for this referral: <b>${referral.assignees
            .map((assignee) => getUserFullname(assignee))
            .join(
              ', ',
            )}</b>. They will receive an email to inform them of your message.`,
      );
    });
  });

  describe('requesters tab', () => {
    it('shows the list of requesters for the referral', async () => {
      const queryClient = new QueryClient();
      const referral: types.Referral = factories.ReferralFactory.generate();

      const getReferralDeferred = new Deferred();
      fetchMock.get(
        `/api/referrals/${referral.id}/`,
        getReferralDeferred.promise,
      );

      fetchMock.get(
        `/api/referralactivities/?limit=999&referral=${referral.id}`,
        new Promise(() => {}),
      );

      render(
        <IntlProvider locale="en">
          <MemoryRouter
            initialEntries={[
              `/unit/${referral.units[0].id}/referral-detail/${referral.id}`,
            ]}
          >
            <QueryClientProvider client={queryClient}>
              <Route path={'/unit/:unitId/referral-detail/:referralId'}>
                <ReferralDetail />
              </Route>
            </QueryClientProvider>
          </MemoryRouter>
        </IntlProvider>,
      );

      screen.getByRole('status', {
        name: `Loading referral #${referral.id}...`,
      });
      await act(async () => getReferralDeferred.resolve(referral));

      const requestersLink = screen.getByRole('link', {
        name: 'Requesters',
      });
      userEvent.click(requestersLink);

      screen.getByText('Users linked to this referral');
      for (const user of referral.users) {
        screen.getByText(getUserFullname(user));
        screen.getByText(user.unit_name);
      }

      expect(
        screen.queryAllByRole('button', { name: 'Remove user from referral' }),
      ).toEqual([]);
      expect(screen.queryByText('Add users to this referral')).toBeNull();
    });

    it('shows a form to add requesters and buttons to remove requesters to referral linked users', async () => {
      const queryClient = new QueryClient();
      const referral: types.Referral = factories.ReferralFactory.generate();

      const getReferralDeferred = new Deferred();
      fetchMock.get(
        `/api/referrals/${referral.id}/`,
        getReferralDeferred.promise,
      );

      fetchMock.get(
        `/api/referralactivities/?limit=999&referral=${referral.id}`,
        new Promise(() => {}),
      );

      render(
        <IntlProvider locale="en">
          <MemoryRouter
            initialEntries={[
              `/unit/${referral.units[0].id}/referral-detail/${referral.id}`,
            ]}
          >
            <QueryClientProvider client={queryClient}>
              <CurrentUserContext.Provider
                value={{ currentUser: referral.users[0] }}
              >
                <Route path={'/unit/:unitId/referral-detail/:referralId'}>
                  <ReferralDetail />
                </Route>
              </CurrentUserContext.Provider>
            </QueryClientProvider>
          </MemoryRouter>
        </IntlProvider>,
      );

      screen.getByRole('status', {
        name: `Loading referral #${referral.id}...`,
      });
      await act(async () => getReferralDeferred.resolve(referral));

      const requestersLink = screen.getByRole('link', {
        name: 'Requesters',
      });
      userEvent.click(requestersLink);

      screen.getByText('Users linked to this referral');
      for (const user of referral.users) {
        screen.getByText(getUserFullname(user));
        screen.getByText(user.unit_name);
      }

      screen.getAllByRole('button', { name: 'Remove user from referral' });
      const input = screen.getByRole('textbox', {
        name: 'Add users to this referral',
      });

      // Add a new user to the referral
      const newRequester = factories.UserFactory.generate();

      const searchUsersDeferred = new Deferred();
      fetchMock.get(
        '/api/users/?limit=999&query=J',
        searchUsersDeferred.promise,
      );

      userEvent.type(input, 'J');
      await act(async () =>
        searchUsersDeferred.resolve({
          count: 1,
          next: null,
          previous: null,
          results: [newRequester],
        }),
      );

      const newRequesterOption = screen.getByRole('option', {
        name: getUserFullname(newRequester),
      });

      const addUserDeferred = new Deferred();
      fetchMock.post(
        `/api/referrals/${referral.id}/add_requester/`,
        addUserDeferred.promise,
        { body: { requester: newRequester.id } },
      );

      userEvent.click(newRequesterOption);
      await waitFor(() => {
        expect(input).toHaveAttribute('disabled');
      });
      screen.getAllByRole((_, element) =>
        element!.innerHTML.includes('spinner'),
      );

      await act(async () => addUserDeferred.resolve({}));
      await waitFor(() => {
        expect(
          screen.getByRole('textbox', {
            name: 'Add users to this referral',
          }),
        ).not.toHaveAttribute('disabled');
      });
      expect(
        screen.queryAllByRole((_, element) =>
          element!.innerHTML.includes('spinner'),
        ),
      ).toEqual([]);
    });

    it('shows a form to add requesters and buttons to remove requesters to referral linked unit members', async () => {
      const queryClient = new QueryClient();
      const referral: types.Referral = factories.ReferralFactory.generate();
      const requesterToRemove = factories.UserFactory.generate();
      referral.users[1] = requesterToRemove;

      const getReferralDeferred = new Deferred();
      fetchMock.get(
        `/api/referrals/${referral.id}/`,
        getReferralDeferred.promise,
      );

      fetchMock.get(
        `/api/referralactivities/?limit=999&referral=${referral.id}`,
        new Promise(() => {}),
      );

      render(
        <IntlProvider locale="en">
          <MemoryRouter
            initialEntries={[
              `/unit/${referral.units[0].id}/referral-detail/${referral.id}`,
            ]}
          >
            <QueryClientProvider client={queryClient}>
              <CurrentUserContext.Provider
                value={{ currentUser: referral.units[0].members[0] }}
              >
                <Route path={'/unit/:unitId/referral-detail/:referralId'}>
                  <ReferralDetail />
                </Route>
              </CurrentUserContext.Provider>
            </QueryClientProvider>
          </MemoryRouter>
        </IntlProvider>,
      );

      screen.getByRole('status', {
        name: `Loading referral #${referral.id}...`,
      });
      await act(async () => getReferralDeferred.resolve(referral));

      const requestersLink = screen.getByRole('link', {
        name: 'Requesters',
      });
      userEvent.click(requestersLink);

      screen.getByText('Users linked to this referral');
      for (const user of referral.users) {
        screen.getByText(getUserFullname(user));
        screen.getByText(user.unit_name);
      }

      screen.getAllByRole('button', { name: 'Remove user from referral' });
      const input = screen.getByRole('textbox', {
        name: 'Add users to this referral',
      });

      // Remove requester #2 from the referral
      const requesterToRemoveListItem = screen.getByRole('listitem', {
        name: (_, el) =>
          el.innerHTML.includes(getUserFullname(requesterToRemove)),
      });
      const requesterToRemoveBtn = getByRole(
        requesterToRemoveListItem,
        'button',
        { name: 'Remove user from referral' },
      );

      const removeUserDeferred = new Deferred();
      fetchMock.post(
        `/api/referrals/${referral.id}/remove_requester/`,
        removeUserDeferred.promise,
        { body: { requester: requesterToRemove.id } },
      );

      userEvent.click(requesterToRemoveBtn);
      await waitFor(() => {
        expect(requesterToRemoveBtn).toHaveAttribute('aria-busy', 'true');
      });
      screen.getByRole('status', {
        name: `Removing ${getUserFullname(requesterToRemove)} from referral...`,
      });

      await act(async () => removeUserDeferred.resolve({}));
      expect(requesterToRemoveBtn).toHaveAttribute('aria-busy', 'false');
      expect(
        screen.queryByRole('status', {
          name: `Removing ${getUserFullname(
            requesterToRemove,
          )} from referral...`,
        }),
      ).toBeNull();
    });
  });
});