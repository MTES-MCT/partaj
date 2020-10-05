/**
 * MODEL TYPES
 */
export interface Referral {
  answers: ReferralAnswer[];
  assignees: User['id'][];
  attachments: ReferralAttachment[];
  context: string;
  created_at: string;
  id: number;
  prior_work: string;
  question: string;
  requester: string;
  state: ReferralState;
  topic: Topic;
  updated_at: string;
  urgency_level: ReferralUrgency;
  urgency_explanation: string;
  user: User;
}

export enum ReferralState {
  ASSIGNED = 'assigned',
  RECEIVED = 'received',
  CLOSED = 'closed',
  INCOMPLETE = 'incomplete',
  ANSWERED = 'answered',
}

interface AttachmentBase {
  id: string;
  created_at: string;
  file: string;
  name: string;
  size: number;
}

interface ReferralAttachment extends AttachmentBase {
  name_with_extension: string;
  referral: Referral['id'];
}

interface ReferralAnswerAttachment extends AttachmentBase {
  name_with_extension: string;
  referral_answer: ReferralAnswer['id'];
}

export type Attachment = ReferralAttachment | ReferralAnswerAttachment;

export enum ReferralAnswerState {
  DRAFT = 'draft',
  PUBLISHED = 'published',
}

export interface ReferralAnswer {
  attachments: ReferralAnswerAttachment[];
  content: string;
  created_at: string;
  created_by: User['id'];
  id: string;
  published_answer: ReferralAnswer;
  referral: Referral['id'];
  state: ReferralAnswerState;
}

interface ReferralActivityBase {
  actor: User;
  created_at: string;
  id: string;
  item_content_type: number;
  item_object_id: string;
  referral: Referral['id'];
}

export enum ReferralActivityVerb {
  ANSWERED = 'answered',
  DRAFT_ANSWERED = 'draft_answered',
  ASSIGNED = 'assigned',
  CREATED = 'created',
  UNASSIGNED = 'unassigned',
}

interface ReferralActivityAnswered extends ReferralActivityBase {
  item_content_object: ReferralAnswer;
  verb: ReferralActivityVerb.ANSWERED;
}

interface ReferralActivityAssigned extends ReferralActivityBase {
  item_content_object: User;
  verb: ReferralActivityVerb.ASSIGNED;
}

interface ReferralActivityCreated extends ReferralActivityBase {
  item_content_object: null;
  verb: ReferralActivityVerb.CREATED;
}

interface ReferralActivityDraftAnswered extends ReferralActivityBase {
  item_content_object: ReferralAnswer;
  verb: ReferralActivityVerb.DRAFT_ANSWERED;
}

interface ReferralActivityUnassigned extends ReferralActivityBase {
  item_content_object: User;
  verb: ReferralActivityVerb.UNASSIGNED;
}

export type ReferralActivity =
  | ReferralActivityAnswered
  | ReferralActivityAssigned
  | ReferralActivityCreated
  | ReferralActivityDraftAnswered
  | ReferralActivityUnassigned;

export interface Topic {
  created_at: string;
  id: string;
  name: string;
  unit: Unit;
}

export interface Unit {
  created_at: string;
  id: string;
  members: UnitMember[];
  name: string;
}

export interface UnitMember extends User {
  membership: UnitMembership;
}

export interface UnitMembership {
  created_at: string;
  id: string;
  role: UnitMembershipRole;
  updated_at: string;
  user: string;
  unit: string;
}

export enum UnitMembershipRole {
  ADMIN = 'admin',
  MEMBER = 'member',
  OWNER = 'owner',
}

export interface ReferralUrgency {
  duration: string;
  id: number;
  is_default: boolean;
  name: string;
  requires_justification: boolean;
}

export interface User {
  date_joined: string;
  email: string;
  first_name: string;
  id: string;
  is_staff: boolean;
  is_superuser: boolean;
  last_name: string;
  phone_number: string;
  unit_name: string;
  username: string;
}

/**
 * API RELATED TYPES
 */
export interface APIList<T> {
  count: number;
  next: string;
  previous: string;
  results: T[];
}
