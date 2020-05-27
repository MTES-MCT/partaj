import { render, screen } from '@testing-library/react';
import React from 'react';
import { IntlProvider } from 'react-intl';

import { CurrentUserContext } from 'data/useCurrentUser';
import { Referral, ReferralState, Unit, UnitMembershipRole } from 'types';
import { Context } from 'types/context';
import {
  ReferralFactory,
  UnitFactory,
  UnitMemberFactory,
} from 'utils/test/factories';
import { ReferralDetailAssignment } from '.';

describe('<ReferralDetailAssignment />', () => {
  const context: Context = {
    assets: { icons: 'icons.svg' },
    csrftoken: 'the csrf token',
    token: 'the auth token',
  };

  const referral: Referral = ReferralFactory.generate();

  describe('[as unit organizer]', () => {
    // Create a unit and pick one of their organizers as our current user. We'll link it to
    // the referral topic.
    const unit: Unit = UnitFactory.generate();
    unit.members = UnitMemberFactory.generate(5);
    unit.members[0].membership.role = UnitMembershipRole.OWNER;

    it('shows an empty list of assignees and a button to assign members', () => {
      render(
        <IntlProvider locale="en">
          <CurrentUserContext.Provider value={{ currentUser: unit.members[0] }}>
            <ReferralDetailAssignment
              {...{
                context,
                referral: { ...referral, topic: { ...referral.topic, unit } },
                setReferral: jest.fn(),
              }}
            />
          </CurrentUserContext.Provider>
        </IntlProvider>,
      );

      screen.getByRole('list', { name: 'Assignment(s)' });
      screen.getByText('No assignment yet');
      screen.getByRole('button', { name: 'Assign a member' });
    });

    it('does not show the button to assign members if referral state does not allow it', () => {
      render(
        <IntlProvider locale="en">
          <CurrentUserContext.Provider value={{ currentUser: unit.members[0] }}>
            <ReferralDetailAssignment
              {...{
                context,
                referral: {
                  ...referral,
                  state: ReferralState.ANSWERED,
                  topic: { ...referral.topic, unit },
                },
                setReferral: jest.fn(),
              }}
            />
          </CurrentUserContext.Provider>
        </IntlProvider>,
      );

      screen.getByRole('list', { name: 'Assignment(s)' });
      screen.getByText('No assignment yet');
      expect(
        screen.queryByRole('button', { name: 'Assign a member' }),
      ).toBeNull();
    });

    it('does not show the button to assign members if everyone is already assigned', () => {
      render(
        <IntlProvider locale="en">
          <CurrentUserContext.Provider value={{ currentUser: unit.members[0] }}>
            <ReferralDetailAssignment
              {...{
                context,
                referral: {
                  ...referral,
                  assignees: unit.members.map((member) => member.id),
                  state: ReferralState.ASSIGNED,
                  topic: { ...referral.topic, unit },
                },
                setReferral: jest.fn(),
              }}
            />
          </CurrentUserContext.Provider>
        </IntlProvider>,
      );

      screen.getByRole('list', { name: 'Assignment(s)' });
      for (let member of unit.members) {
        screen.getByText(`${member.first_name} ${member.last_name}`);
      }
      expect(
        screen.queryByRole('button', { name: 'Assign a member' }),
      ).toBeNull();
    });
  });

  describe('[as requester]', () => {
    it('shows an empty list of assignees', () => {
      render(
        <IntlProvider locale="en">
          <ReferralDetailAssignment
            {...{ context, referral }}
            setReferral={jest.fn()}
          />
        </IntlProvider>,
      );

      screen.getByRole('list', { name: 'Assignment(s)' });
      screen.getByText('No assignment yet');
      expect(
        screen.queryByRole('button', { name: 'Assign a member' }),
      ).toBeNull();
    });

    it('shows the list of assignees', () => {
      const unit: Unit = UnitFactory.generate();
      unit.members = UnitMemberFactory.generate(3);
      const [assignee1, assignee2, nonAssignee] = unit.members;

      render(
        <IntlProvider locale="en">
          <ReferralDetailAssignment
            {...{
              context,
              referral: {
                ...referral,
                assignees: [assignee1.id, assignee2.id],
                state: ReferralState.ASSIGNED,
                topic: { ...referral.topic, unit },
              },
            }}
            setReferral={jest.fn()}
          />
        </IntlProvider>,
      );

      screen.getByRole('list', { name: 'Assignment(s)' });
      for (let assignee of [assignee1, assignee2]) {
        screen.getByText(`${assignee.first_name} ${assignee.last_name}`);
      }
      expect(
        screen.queryByText(
          `${nonAssignee.first_name} ${nonAssignee.last_name}`,
        ),
      ).toBeNull();
      expect(
        screen.queryByRole('button', { name: 'Assign a member' }),
      ).toBeNull();
    });
  });
});
