import { Nullable } from './utils';

/**
 * MODEL TYPES
 */
export interface Referral {
  answers: ReferralAnswer[];
  assignees: UserLite[];
  attachments: ReferralAttachment[];
  context: string;
  created_at: string;
  due_date: string;
  id: number;
  object: string;
  prior_work: string;
  question: string;
  report: Nullable<ReferralReport>;
  state: ReferralState;
  topic: Topic;
  updated_at: string;
  units: Unit[];
  urgency_level: ReferralUrgency;
  urgency_explanation: string;
  feature_flag: number;
  users: User[];
}

export interface ReferralLite
  extends Pick<Referral, 'assignees' | 'due_date' | 'id' | 'object' | 'state'> {
  users: UserLite[];
  published_date: string;
}

export enum ReferralState {
  DRAFT = 'draft',
  ANSWERED = 'answered',
  ASSIGNED = 'assigned',
  CLOSED = 'closed',
  INCOMPLETE = 'incomplete',
  IN_VALIDATION = 'in_validation',
  PROCESSING = 'processing',
  RECEIVED = 'received',
}

interface AttachmentBase {
  id: string;
  created_at: string;
  file: string;
  name: string;
  size: number;
  name_with_extension: string;
}

export interface ReferralAttachment extends AttachmentBase {
  referral: Referral['id'];
}

export interface ReferralAnswerAttachment extends AttachmentBase {
  referral_answer: ReferralAnswer['id'];
}

export interface ReferralMessageAttachment extends AttachmentBase {
  referral_message: ReferralMessage['id'];
}

export interface ReferralReportAttachment extends AttachmentBase {
  report: ReferralReport['id'];
}

export interface VersionDocument extends AttachmentBase {}

export type Attachment =
  | ReferralAttachment
  | ReferralAnswerAttachment
  | ReferralMessageAttachment;

export enum ReferralAnswerState {
  DRAFT = 'draft',
  PUBLISHED = 'published',
}

export interface ReferralAnswer {
  attachments: ReferralAnswerAttachment[];
  content: string;
  created_at: string;
  created_by: User;
  draft_answer: ReferralAnswer['id'];
  id: string;
  published_answer: ReferralAnswer['id'];
  referral: Referral['id'];
  state: ReferralAnswerState;
  updated_at: string;
  validators: UserLite[];
}

export interface ReferralReport {
  id: string;
  versions: ReferralReportVersion[];
  created_at: string;
  updated_at: string;
  state: string;
  attachments: ReferralReportAttachment[];
}

export interface ReferralReportVersion {
  id: string;
  created_at: string;
  updated_at: string;
  created_by: User;
  document: VersionDocument;
  state: string;
}

export interface ReferralMessage {
  attachments: ReferralMessageAttachment[];
  content: string;
  created_at: string;
  id: string;
  referral: string;
  user: UserLite;
}

export interface ReferralAnswerValidationRequest {
  answer: ReferralAnswer;
  id: string;
  response: ReferralAnswerValidationResponse;
  validator: User;
}

export enum ReferralAnswerValidationResponseState {
  NOT_VALIDATED = 'not_validated',
  PENDING = 'pending',
  VALIDATED = 'validated',
}

export interface ReferralAnswerValidationResponse {
  comment: string;
  id: string;
  state: ReferralAnswerValidationResponseState;
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
  ADDED_REQUESTER = 'added_requester',
  DRAFT_ANSWERED = 'draft_answered',
  ASSIGNED = 'assigned',
  ASSIGNED_UNIT = 'assigned_unit',
  CREATED = 'created',
  REMOVED_REQUESTER = 'removed_requester',
  UNASSIGNED = 'unassigned',
  UNASSIGNED_UNIT = 'unassigned_unit',
  VALIDATED = 'validated',
  VALIDATION_DENIED = 'validation_denied',
  VALIDATION_REQUESTED = 'validation_requested',
  VERSION_ADDED = 'version_added',
  URGENCYLEVEL_CHANGED = 'urgencylevel_changed',
  CLOSED = 'closed',
}

interface ReferralActivityAddedRequester extends ReferralActivityBase {
  item_content_object: User;
  verb: ReferralActivityVerb.ADDED_REQUESTER;
}

interface ReferralActivityAnswered extends ReferralActivityBase {
  item_content_object: ReferralAnswer;
  verb: ReferralActivityVerb.ANSWERED;
}

interface ReferralActivityAssigned extends ReferralActivityBase {
  item_content_object: User;
  verb: ReferralActivityVerb.ASSIGNED;
}

export interface ReferralActivityAssignedUnit extends ReferralActivityBase {
  item_content_object: Unit;
  verb: ReferralActivityVerb.ASSIGNED_UNIT;
  message: string;
}

export interface ReferralActivityClosed extends ReferralActivityBase {
  item_content_object: null;
  verb: ReferralActivityVerb.CLOSED;
  message: string;
}

interface ReferralActivityCreated extends ReferralActivityBase {
  item_content_object: null;
  verb: ReferralActivityVerb.CREATED;
}

interface ReferralActivityDraftAnswered extends ReferralActivityBase {
  item_content_object: ReferralAnswer;
  verb: ReferralActivityVerb.DRAFT_ANSWERED;
}

interface ReferralActivityRemovedRequester extends ReferralActivityBase {
  item_content_object: User;
  verb: ReferralActivityVerb.REMOVED_REQUESTER;
}

interface ReferralActivityUnassigned extends ReferralActivityBase {
  item_content_object: User;
  verb: ReferralActivityVerb.UNASSIGNED;
}

interface ReferralActivityUnassignedUnit extends ReferralActivityBase {
  item_content_object: Unit;
  verb: ReferralActivityVerb.UNASSIGNED_UNIT;
}

interface ReferralActivityUrgencyLevelChanged extends ReferralActivityBase {
  item_content_object: ReferralUrgencyLevelHistory;
  verb: ReferralActivityVerb.URGENCYLEVEL_CHANGED;
}

interface ReferralActivityValidated extends ReferralActivityBase {
  item_content_object: ReferralAnswerValidationRequest;
  verb: ReferralActivityVerb.VALIDATED;
}

interface ReferralActivityValidationDenied extends ReferralActivityBase {
  item_content_object: ReferralAnswerValidationRequest;
  verb: ReferralActivityVerb.VALIDATION_DENIED;
}

interface ReferralActivityValidationRequested extends ReferralActivityBase {
  item_content_object: ReferralAnswerValidationRequest;
  verb: ReferralActivityVerb.VALIDATION_REQUESTED;
}

interface ReferralActivityVersionAdded extends ReferralActivityBase {
  item_content_object: ReferralReportVersion;
  verb: ReferralActivityVerb.VERSION_ADDED;
}

export type ReferralActivity =
  | ReferralActivityAddedRequester
  | ReferralActivityAnswered
  | ReferralActivityAssigned
  | ReferralActivityAssignedUnit
  | ReferralActivityClosed
  | ReferralActivityCreated
  | ReferralActivityDraftAnswered
  | ReferralActivityRemovedRequester
  | ReferralActivityUnassigned
  | ReferralActivityUnassignedUnit
  | ReferralActivityUrgencyLevelChanged
  | ReferralActivityValidated
  | ReferralActivityValidationDenied
  | ReferralActivityValidationRequested
  | ReferralActivityVersionAdded;

export interface Topic {
  created_at: string;
  id: string;
  is_active: boolean;
  path: string;
  parent: string;
  name: string;
  unit: Unit['id'];
  unit_name: Unit['name'];
}

export type TopicLite = Pick<
  Topic,
  'created_at' | 'id' | 'name' | 'path' | 'unit_name'
>;

export interface Unit {
  created_at: string;
  id: string;
  members: UnitMember[];
  name: string;
}

export type UnitLite = Pick<Unit, 'id' | 'name'>;

export interface UnitMember extends User {
  membership: UnitMembership;
}

export interface UnitMembership {
  created_at: string;
  id: string;
  role: UnitMembershipRole;
  updated_at: string;
  user: UserLite;
  unit: string;
  unit_name: string;
}

export enum UnitMembershipRole {
  ADMIN = 'admin',
  MEMBER = 'member',
  OWNER = 'owner',
}

export interface ReferralUrgency {
  duration: string;
  id: number;
  index: Nullable<number>;
  name: string;
  requires_justification: boolean;
}

export interface ReferralUrgencyLevelHistory {
  id: string;
  referral: string;
  old_referral_urgency: ReferralUrgency;
  new_referral_urgency: ReferralUrgency;
  explanation: string;
}

export interface User {
  date_joined: string;
  email: string;
  first_name: string;
  id: string;
  is_staff: boolean;
  is_superuser: boolean;
  last_name: string;
  memberships: UnitMembership[];
  phone_number: string;
  unit_name: string;
  username: string;
}

export type UserLite = Pick<
  User,
  'first_name' | 'last_name' | 'id' | 'unit_name'
>;

/**
 * API RELATED TYPES
 */
export interface APIList<T> {
  count: number;
  next: string;
  previous: string;
  results: T[];
}
