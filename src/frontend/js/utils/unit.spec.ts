import { UnitMember, UnitMembershipRole } from 'types';
import {
  UnitFactory,
  UnitMemberFactory,
  UnitMembershipFactory,
} from 'utils/test/factories';
import {
  getUnitOrganizers,
  isUserUnitMember,
  isUserUnitOrganizer,
} from './unit';

describe('utils/unit', () => {
  const unit = UnitFactory.generate();

  // Create members of each role for the unit
  let admins: UnitMember[] = UnitMemberFactory.generate(3);
  admins = admins.map((member) => ({
    ...member,
    membership: {
      ...member.membership,
      role: UnitMembershipRole.ADMIN,
      unit: unit.id,
    },
  }));
  let owners: UnitMember[] = UnitMemberFactory.generate(2);
  owners = owners.map((member) => ({
    ...member,
    membership: {
      ...member.membership,
      role: UnitMembershipRole.OWNER,
      unit: unit.id,
    },
  }));
  let members: UnitMember[] = UnitMembershipFactory.generate(10);
  members = members.map((member) => ({
    ...member,
    membership: {
      ...member.membership,
      role: UnitMembershipRole.MEMBER,
      unit: unit.id,
    },
  }));

  describe('getUnitOrganizers()', () => {
    it('returns a list of the units organizers', () => {
      // Test a unit with members, admins and owners
      const organizers = getUnitOrganizers({
        ...unit,
        members: [...admins, ...owners, ...members],
      });
      for (let organizer of [...admins, ...owners]) {
        expect(organizers.includes(organizer)).toEqual(true);
      }
      for (let member of members) {
        expect(organizers.includes(member)).toEqual(false);
      }

      // Test a unit with no admins or owners, only members
      expect(getUnitOrganizers({ ...unit, members })).toEqual([]);
    });
  });

  describe('isUserUnitMember()', () => {
    const thatUnit = {
      ...unit,
      members: [...admins, ...owners, ...members],
    };

    it('returns a boolean that states if the given user is a member of the unit', () => {
      expect(isUserUnitMember(null, unit)).toEqual(false);
      expect(isUserUnitMember(UnitMemberFactory.generate(), thatUnit)).toEqual(
        false,
      );

      expect(isUserUnitMember(members[0], thatUnit)).toEqual(true);
      expect(isUserUnitMember(admins[0], thatUnit)).toEqual(true);
      expect(isUserUnitMember(owners[0], thatUnit)).toEqual(true);
    });
  });

  describe('isUserUnitOrganizer()', () => {
    const thatUnit = {
      ...unit,
      members: [...admins, ...owners, ...members],
    };

    it('returns a boolean that states if the given user is an organizer of the unit', () => {
      expect(isUserUnitOrganizer(null, unit)).toEqual(false);
      expect(
        isUserUnitOrganizer(UnitMemberFactory.generate(), thatUnit),
      ).toEqual(false);
      expect(isUserUnitOrganizer(members[0], thatUnit)).toEqual(false);

      expect(isUserUnitOrganizer(admins[0], thatUnit)).toEqual(true);
      expect(isUserUnitOrganizer(owners[0], thatUnit)).toEqual(true);
    });
  });
});
