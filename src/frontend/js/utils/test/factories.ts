import { compose, createSpec, derived, faker } from '@helpscout/helix';

import { ReferralState, UnitMembershipRole } from 'types';

export const UserFactory = createSpec({
  date_joined: derived(() => faker.date.past().toString()),
  email: faker.internet.email(),
  first_name: faker.name.firstName(),
  id: faker.random.number(),
  is_staff: derived(() => false),
  is_superuser: derived(() => false),
  last_name: faker.name.lastName(),
  phone_number: faker.phone.phoneNumber(),
  title: faker.name.title(),
  unite: faker.company.companyName(),
  username: faker.internet.email(),
});

const UnitMembershipRoleFactory = createSpec(
  faker.random.arrayElement(Object.keys(UnitMembershipRole)),
);

export const UnitMembershipFactory = createSpec({
  created_at: faker.date.past(),
  id: faker.random.uuid(),
  role: UnitMembershipRoleFactory,
  updated_at: faker.date.past(),
  user: faker.random.uuid(),
  unit: faker.random.uuid(),
});

const UnitMemberMixin = createSpec({
  membership: UnitMembershipFactory,
});

export const UnitMemberFactory = compose(UserFactory, UnitMemberMixin);

export const UnitFactory = createSpec({
  created_at: derived(() => faker.date.past().toString()),
  id: faker.random.uuid(),
  members: UnitMemberFactory.generate(1, 5),
  name: faker.company.companyName(),
});

export const TopicFactory = createSpec({
  created_at: derived(() => faker.date.past().toString()),
  id: faker.random.uuid(),
  name: faker.lorem.words(),
  unit: UnitFactory,
});

const ReferralUrgencyFactory = createSpec(
  faker.random.arrayElement(['u1', 'u2', 'u3']),
);

export const AnswerFactory = createSpec({
  content: faker.lorem.paragraphs(),
  created_at: derived(() => faker.date.past().toString()),
  created_by: faker.random.uuid(),
  id: faker.random.uuid(),
  referral: faker.random.number(),
});

export const ReferralFactory = createSpec({
  answers: derived(() => []),
  assignees: derived(() => []),
  context: faker.lorem.paragraphs(),
  created_at: derived(() => faker.date.past().toString()),
  id: faker.random.number(),
  prior_work: faker.lorem.paragraphs(),
  question: faker.lorem.paragraphs(),
  requester: faker.fake('{{name.firstName}} {{name.lastName}}'),
  state: derived(() => ReferralState.RECEIVED),
  topic: TopicFactory,
  updated_at: derived(() => faker.date.past().toString()),
  urgency: ReferralUrgencyFactory,
  urgency_explanation: faker.lorem.words(),
  user: UserFactory,
});
