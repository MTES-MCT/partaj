import { compose, createSpec, derived, faker } from '@helpscout/helix';

import * as types from 'types';

export const UserFactory = createSpec({
  date_joined: derived(() => faker.date.past()().toISOString()),
  email: faker.internet.email(),
  first_name: faker.name.firstName(),
  id: faker.random.uuid(),
  is_staff: derived(() => false),
  is_superuser: derived(() => false),
  last_name: faker.name.lastName(),
  memberships: derived(() => [UnitMembershipFactory.generate()]),
  phone_number: faker.phone.phoneNumber(),
  title: faker.name.title(),
  unit_name: faker.company.companyName(),
  username: faker.internet.email(),
});

const UserLiteFactory = createSpec({
  first_name: faker.name.firstName(),
  id: faker.random.uuid(),
  last_name: faker.name.lastName(),
});

const UnitMembershipRoleFactory = createSpec(
  faker.random.arrayElement(Object.keys(types.UnitMembershipRole)),
);

export const UnitMembershipFactory = createSpec({
  created_at: derived(() => faker.date.past()().toISOString()),
  id: faker.random.uuid(),
  role: UnitMembershipRoleFactory,
  updated_at: derived(() => faker.date.past()().toISOString()),
  user: faker.random.uuid(),
  unit: faker.random.uuid(),
  unit_name: faker.company.companyName(),
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
  unit: faker.random.uuid(),
  unit_name: faker.company.companyName(),
});

export const AttachmentFactory = createSpec({
  id: faker.random.uuid(),
  created_at: derived(() => faker.date.past()().toISOString()),
  file: faker.internet.url(),
  name: faker.system.filePath(),
  name_with_extension: faker.system.fileName(),
  referral: faker.random.number(),
  size: faker.random.number(),
});

const ReferralActivityVerbFactory = createSpec(
  faker.random.arrayElement(Object.keys(types.ReferralActivityVerb)),
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

export const ReferralMessageAttachmentFactory = createSpec({
  id: faker.random.uuid(),
  created_at: derived(() => faker.date.past()().toISOString()),
  file: faker.internet.url(),
  name: derived((attachment: types.ReferralMessageAttachment) => {
    const [extension, ...parts] = attachment.name_with_extension
      .split('.')
      .reverse();
    return parts.reverse().join('.');
  }),
  name_with_extension: faker.system.fileName(),
  referral_answers: faker.random.uuid(),
  size: faker.random.number(),
});

export const ReferralMessageFactory = createSpec({
  attachments: ReferralMessageAttachmentFactory.generate(1, 5),
  content: faker.lorem.paragraphs(),
  created_at: derived(() => faker.date.past()().toISOString()),
  id: faker.random.uuid(),
  referral: faker.random.number(),
  user: UserLiteFactory,
});

export const ReferralAnswerAttachmentFactory = createSpec({
  id: faker.random.uuid(),
  created_at: derived(() => faker.date.past()().toISOString()),
  file: faker.internet.url(),
  name: derived((attachment: types.ReferralAnswerAttachment) => {
    const [extension, ...parts] = attachment.name_with_extension
      .split('.')
      .reverse();
    return parts.reverse().join('.');
  }),
  name_with_extension: faker.system.fileName(),
  referral_answers: derived(() => [faker.random.uuid()]),
  size: faker.random.number(),
});

export const ReferralAnswerFactory = createSpec({
  attachments: ReferralAnswerAttachmentFactory.generate(1, 5),
  content: faker.lorem.paragraphs(),
  created_at: derived(() => faker.date.past()().toISOString()),
  created_by: UserFactory,
  id: faker.random.uuid(),
  referral: faker.random.number(),
  state: derived(() => types.ReferralAnswerState.DRAFT),
  validators: derived(() => []),
});

export const ReferralAttachmentFactory = createSpec({
  id: faker.random.uuid(),
  created_at: derived(() => faker.date.past()().toISOString()),
  file: faker.internet.url(),
  name: faker.system.filePath(),
  name_with_extension: faker.system.fileName(),
  referral: faker.random.number(),
  size: faker.random.number(),
});

export const ReferralAnswerValidationRequestFactory = createSpec({
  answer: ReferralAnswerFactory,
  id: faker.random.uuid(),
  response: derived(() => null),
  validator: UserFactory,
});

const ReferralAnswerValidationResponseStateFactory = createSpec(
  faker.random.arrayElement(
    Object.keys(types.ReferralAnswerValidationResponseState),
  ),
);

export const ReferralAnswerValidationResponseFactory = createSpec({
  comment: faker.lorem.paragraphs(),
  id: faker.random.uuid(),
  state: ReferralAnswerValidationResponseStateFactory,
});

export const ReferralUrgencyFactory = createSpec({
  duration: faker.random.arrayElement([
    '1 00:00:00',
    '3 00:00:00',
    '7 00:00:00',
    '21 00:00:00',
  ]),
  id: faker.random.number(),
  name: faker.lorem.words(),
  requires_justification: '',
});

export const ReferralFactory = createSpec({
  activity: derived(() => []),
  answers: derived(() => []),
  assignees: derived(() => []),
  attachments: ReferralAttachmentFactory.generate(1, 5),
  context: faker.lorem.paragraphs(),
  created_at: derived(() => faker.date.past()().toISOString()),
  due_date: derived(() => faker.date.future()().toISOString()),
  id: faker.random.number(),
  object: faker.lorem.words(),
  prior_work: faker.lorem.paragraphs(),
  question: faker.lorem.paragraphs(),
  requester: faker.fake('{{name.firstName}} {{name.lastName}}'),
  state: derived(() => types.ReferralState.RECEIVED),
  topic: TopicFactory,
  units: UnitFactory.generate(1, 2),
  updated_at: derived(() => faker.date.past()().toISOString()),
  urgency: ReferralUrgencyFactory,
  urgency_explanation: faker.lorem.words(),
  urgency_level: ReferralUrgencyFactory,
  users: UserFactory.generate(1, 5),
  feature_flag: 0,
});
