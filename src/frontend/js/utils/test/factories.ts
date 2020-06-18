import { compose, createSpec, derived, faker } from '@helpscout/helix';

import { ReferralState, UnitMembershipRole, ReferralActivityVerb } from 'types';

export const UserFactory = createSpec({
  date_joined: derived(() => faker.date.past()().toISOString()),
  email: faker.internet.email(),
  first_name: faker.name.firstName(),
  id: faker.random.uuid(),
  is_staff: derived(() => false),
  is_superuser: derived(() => false),
  last_name: faker.name.lastName(),
  phone_number: faker.phone.phoneNumber(),
  title: faker.name.title(),
  unit_name: faker.company.companyName(),
  username: faker.internet.email(),
});

const UnitMembershipRoleFactory = createSpec(
  faker.random.arrayElement(Object.keys(UnitMembershipRole)),
);

export const UnitMembershipFactory = createSpec({
  created_at: derived(() => faker.date.past()().toISOString()),
  id: faker.random.uuid(),
  role: UnitMembershipRoleFactory,
  updated_at: derived(() => faker.date.past()().toISOString()),
  user: faker.random.uuid(),
  unit: faker.random.uuid(),
});

const UnitMemberMixin = createSpec({
  membership: UnitMembershipFactory,
});

export const UnitMemberFactory = compose(UserFactory, UnitMemberMixin);

export const UnitFactory = createSpec({
  created_at: derived(() => faker.date.past()().toISOString()),
  id: faker.random.uuid(),
  members: UnitMemberFactory.generate(1, 5),
  name: faker.company.companyName(),
});

export const TopicFactory = createSpec({
  created_at: derived(() => faker.date.past()().toISOString()),
  id: faker.random.uuid(),
  name: faker.lorem.words(),
  unit: UnitFactory,
});

const ReferralActivityVerbFactory = createSpec(
  faker.random.arrayElement(Object.keys(ReferralActivityVerb)),
);

export const ReferralActivityFactory = createSpec({
  actor: UserFactory,
  created_at: derived(() => faker.date.past()().toISOString()),
  id: faker.random.uuid(),
  item_content_object: null,
  item_content_type: faker.random.number(),
  item_object_id: faker.random.uuid(),
  referral: faker.random.number(),
  verb: ReferralActivityVerbFactory,
});

export const ReferralAnswerAttachmentFactory = createSpec({
  id: faker.random.uuid(),
  created_at: derived(() => faker.date.past()().toISOString()),
  file: faker.internet.url(),
  name: faker.system.filePath(),
  name_with_extension: faker.system.fileName(),
  referral_answer: faker.random.uuid(),
  size: faker.random.number(),
});

export const ReferralAnswerFactory = createSpec({
  attachments: ReferralAnswerAttachmentFactory.generate(1, 5),
  content: faker.lorem.paragraphs(),
  created_at: derived(() => faker.date.past()().toISOString()),
  created_by: faker.random.uuid(),
  id: faker.random.uuid(),
  referral: faker.random.number(),
});

export const ReferralAttachmentFactory = createSpec({
  id: faker.random.uuid(),
  created_at: derived(() => faker.date.past()().toISOString()),
  file: faker.internet.url(),
  name: faker.system.filePath(),
  name_with_extension: faker.system.fileName(),
  referral: faker.random.number(),
  size: faker.random.number(),
  size_human: derived(() => '2.2Mio'),
});

const ReferralUrgencyFactory = createSpec(
  faker.random.arrayElement(['u1', 'u2', 'u3']),
);

export const ReferralFactory = createSpec({
  activity: derived(() => []),
  answers: derived(() => []),
  assignees: derived(() => []),
  attachments: ReferralAttachmentFactory.generate(1, 5),
  context: faker.lorem.paragraphs(),
  created_at: derived(() => faker.date.past()().toISOString()),
  id: faker.random.number(),
  prior_work: faker.lorem.paragraphs(),
  question: faker.lorem.paragraphs(),
  requester: faker.fake('{{name.firstName}} {{name.lastName}}'),
  state: derived(() => ReferralState.RECEIVED),
  topic: TopicFactory,
  updated_at: derived(() => faker.date.past()().toISOString()),
  urgency: ReferralUrgencyFactory,
  urgency_explanation: faker.lorem.words(),
  urgency_human: faker.lorem.words(),
  user: UserFactory,
});
