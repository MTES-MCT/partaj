import { Nullable } from './utils';
import { SelectOption } from '../components/select/SelectableList';
import { string } from 'prop-types';

/**
 * MODEL TYPES
 */

export interface Message {
  defaultMessage: string;
  description: string;
  id: string;
}

export enum NotificationType {
  ALL = 'A',
  RESTRICTED = 'R',
  NONE = 'N',
}

export enum ReferralUserAction {
  UPSERT_USER = 'upsert_user',
  INVITE_USER = 'invite',
  UPDATE_STATUS = 'update_status',
}

export enum VersionValidationAction {
  REQUEST_VALIDATION = 'request_validation',
  REQUEST_CHANGE = 'request_change',
  VALIDATE = 'validate',
}

export interface AnswerOption {
  name: string;
  value: string;
}

export interface FeatureFlag {
  is_active: boolean;
}

export enum RequesterUnitType {
  DECENTRALISED_UNIT = 'decentralised_unit',
  CENTRAL_UNIT = 'central_unit',
}

export enum ReferralType {
  MAIN = 'main',
  SECONDARY = 'secondary',
}
export interface SubReferral {
  id: string;
  object: string;
  title: string;
  sub_title: string;
  state: ReferralState;
  units: Unit[];
  users: Array<ReferralUserLink>;
}

export interface ActivityReferral {
  id: string;
  sub_title: string;
  sub_question: string;
}

export interface ReferralSection {
  id: string;
  referral: SubReferral;
  type: ReferralType;
}

export interface ReferralNote {
  id: string;
  document: {
    id: string;
    name_with_extension: string;
    created_at: string;
    file: string;
    name: string;
  };
  object: string;
  topic: string;
  author: string;
}

export interface ReferralWithNote {
  id: string;
  note: ReferralNote;
  object: string;
  topic: string;
}
export interface Referral extends ReferralLite {
  answers: ReferralAnswer[];
  attachments: ReferralAttachment[];
  context: string;
  type: ReferralType;
  created_at: string;
  prior_work: string;
  no_prior_work_justification: string;
  has_prior_work?: 'yes' | 'no';
  send_to_knowledge_base?: boolean;
  question: string;
  sub_question: string;
  sub_title: string;
  group: {
    sections: ReferralSection[];
  } | null;
  report: Nullable<ReferralReport>;
  topic: Topic;
  updated_at: string;
  units: Unit[];
  urgency_level: ReferralUrgency;
  urgency_explanation: string;
  feature_flag: number;
  ff_new_form: number;
  validation_state: number;
  answer_properties: string;
  answer_options: AnswerOption[];
  requester_unit_contact: string;
  requester_unit_type: RequesterUnitType;
  satisfaction_survey_participants: Array<string>;
}

export interface ReferralRelationship {
  id: string;
  main_referral: Referral;
  related_referral: ReferralWithNote;
  type: 'L'; //Linked
}

export interface ReferralLite {
  id: string;
  case_number: string;
  object: string;
  state: ReferralState;
  due_date: string;
  created_at: string;
  sent_at: string;
  published_date: string;
  assignees: Array<UserLite>;
  requesters: Array<ReferralUserLink>;
  observers: Array<ReferralUserLink>;
  users: Array<ReferralUserLink>;
  status: ReferralStatus;
  title: string;
  sub_title: string;
}

export interface RequestValidationResponse {
  state: ReferralState;
  report: ReferralReport;
}

export enum ReferralStatus {
  NORMAL = '10_n',
  SENSITIVE = '90_s',
}

export enum ReferralState {
  DRAFT = 'draft',
  ANSWERED = 'answered',
  SPLITTING = 'splitting',
  RECEIVED_SPLITTING = 'received_splitting',
  ASSIGNED = 'assigned',
  CLOSED = 'closed',
  IN_VALIDATION = 'in_validation',
  PROCESSING = 'processing',
  RECEIVED = 'received',
  RECEIVED_VISIBLE = 'received_visible',
}

export enum SupportedFileExtension {
  EXTENSION_PDF = '.pdf',
  EXTENSION_DOCX = '.docx',
}

export enum ScanStatus {
  VERIFIED = 'OK',
  ERROR = 'ERROR',
  INFECTED = 'FOUND',
  NOT_VERIFIED = 'UNKNOWN',
}

interface AttachmentBase {
  id: string;
  created_at: string;
  file: string;
  name: string;
  size: number;
  name_with_extension: string;
  scan_status: ScanStatus;
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
export interface AppendixDocument extends AttachmentBase {}
export interface NoteDocument extends AttachmentBase {}

export type Attachment =
  | ReferralAttachment
  | ReferralAnswerAttachment
  | ReferralReportAttachment
  | ReferralMessageAttachment
  | VersionDocument
  | AppendixDocument
  | NoteDocument;

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
  appendices: ReferralReportAppendix[];
  publishments: ReferralReportPublishment[];
  created_at: string;
  updated_at: string;
  comment: string;
  attachments: ReferralReportAttachment[];
  final_version: Nullable<ReferralReportVersion>;
  last_version: Nullable<ReferralReportVersion>;
  last_appendix: Nullable<ReferralReportAppendix>;
}

export interface ReferralReportVersion {
  id: string;
  created_at: string;
  updated_at: string;
  created_by: User;
  version_number: number | null;
  document: VersionDocument;
  state?: string;
  events: Array<ReportEvent>;
}

export interface ReferralReportAppendix {
  id: string;
  created_at: string;
  updated_at: string;
  created_by: User;
  appendix_number: number | null;
  document: AppendixDocument;
  state?: string;
  events: Array<ReportEvent>;
}

export interface ReferralReportPublishment {
  id: string;
  created_at: string;
  comment: string;
  created_by: User;
  version: ReferralReportVersion;
}

export interface ScanFile {
  id: string;
  scan_status: 'OK' | 'FOUND';
}

export interface ReferralMessage {
  attachments: ReferralMessageAttachment[];
  content: string;
  created_at: string;
  id: string;
  referral: string;
  user: UserLite;
}

export interface NotifiedUser {
  display_name: string;
}

export interface MessageNotification {
  id: string;
  notified: NotifiedUser;
}

export enum ReportVersionEventVerb {
  NEUTRAL = 'neutral',
  VERSION_ADDED = 'version_added',
  VERSION_UPDATED = 'version_updated',
  VERSION_VALIDATED = 'version_validated',
  MESSAGE = 'message',
  REQUEST_VALIDATION = 'request_validation',
  REQUEST_CHANGE = 'request_change',
}

export enum ReportAppendixEventVerb {
  APPENDIX_ADDED = 'appendix_added',
  APPENDIX_UPDATED = 'appendix_updated',
  APPENDIX_VALIDATED = 'appendix_validated',
  APPENDIX_REQUEST_VALIDATION = 'appendix_request_validation',
  APPENDIX_REQUEST_CHANGE = 'appendix_request_change',
}

export type ReportEventVerb = ReportVersionEventVerb | ReportAppendixEventVerb;

export enum ReportEventState {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  OBSOLETE = 'obsolete',
}

export interface ReportEvent {
  verb: ReportEventVerb;
  timestamp: number;
  content: string;
  created_at: string;
  id: string;
  report: string;
  state: ReportEventState;
  version: {
    version_number: number | null;
  };
  appendix: {
    appendix_number: number | null;
  };
  notifications: MessageNotification[];
  user: UserLite;
  is_granted_user_notified?: boolean;
  metadata: {
    receiver_unit_name: string;
    receiver_role: UnitMembershipRole;
    sender_role: UnitMembershipRole;
  };
}

export interface QueuedMessage {
  payload: {
    content: string;
    report?: string;
    referral?: string;
    files?: File[];
    notifications?: string[];
  };
  is_granted_user_notified?: boolean;
  realId: Nullable<string>;
  tempId: string;
}

export interface ReferralQueuedMessage {
  payload: {
    content: string;
    report?: string;
    referral?: string;
    files?: File[];
  };
  realId: Nullable<string>;
  tempId: string;
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

export enum ReferralUserRole {
  REQUESTER = 'R',
  OBSERVER = 'O',
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
  ADDED_OBSERVER = 'added_observer',
  ASSIGNED = 'assigned',
  ASSIGNED_UNIT = 'assigned_unit',
  CLOSED = 'closed',
  CREATED = 'created',
  DRAFT_ANSWERED = 'draft_answered',
  REMOVED_REQUESTER = 'removed_requester',
  REMOVED_OBSERVER = 'removed_observer',
  REOPENING = 'referral_reopened',
  SUBREFERRAL_CREATED = 'subreferral_created',
  SUBREFERRAL_CONFIRMED = 'subreferral_confirmed',
  SUBTITLE_UPDATED = 'subtitle_updated',
  SUBQUESTION_UPDATED = 'subquestion_updated',
  TOPIC_UPDATED = 'topic_updated',
  UNASSIGNED = 'unassigned',
  UNASSIGNED_UNIT = 'unassigned_unit',
  UPDATED_TITLE = 'updated_title',
  URGENCYLEVEL_CHANGED = 'urgencylevel_changed',
  VALIDATED = 'validated',
  VALIDATION_DENIED = 'validation_denied',
  VALIDATION_REQUESTED = 'validation_requested',
  VERSION_ADDED = 'version_added',
}

interface ReferralActivityAddedRequester extends ReferralActivityBase {
  item_content_object: User;
  verb: ReferralActivityVerb.ADDED_REQUESTER;
}

export interface ReferralActivityReopening extends ReferralActivityBase {
  item_content_object: { explanation: string };
  verb: ReferralActivityVerb.REOPENING;
}

interface ReferralActivitySubReferralCreated extends ReferralActivityBase {
  item_content_object: SubReferralCreatedHistory;
  verb: ReferralActivityVerb.SUBREFERRAL_CREATED;
}

interface ReferralActivitySubReferralConfirmed extends ReferralActivityBase {
  item_content_object: SubReferralConfirmedHistory;
  verb: ReferralActivityVerb.SUBREFERRAL_CONFIRMED;
}

interface ReferralActivitySubTitleUpdated extends ReferralActivityBase {
  item_content_object: ReferralSubTitleUpdateHistory;
  verb: ReferralActivityVerb.SUBTITLE_UPDATED;
}

interface ReferralActivitySubQuestionUpdated extends ReferralActivityBase {
  item_content_object: ReferralSubQuestionUpdateHistory;
  verb: ReferralActivityVerb.SUBQUESTION_UPDATED;
}

interface ReferralActivityAddedObserver extends ReferralActivityBase {
  item_content_object: User;
  verb: ReferralActivityVerb.ADDED_OBSERVER;
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

interface ReferralActivityRemovedObserver extends ReferralActivityBase {
  item_content_object: User;
  verb: ReferralActivityVerb.REMOVED_OBSERVER;
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

export interface ReferralActivityUpdatedTitle extends ReferralActivityBase {
  item_content_object: ReferralTitleHistory;
  verb: ReferralActivityVerb.UPDATED_TITLE;
  message: string;
}

export interface ReferralActivityUpdatedTopic extends ReferralActivityBase {
  item_content_object: ReferralTopicHistory;
  verb: ReferralActivityVerb.TOPIC_UPDATED;
  message: string;
}

export type ReferralActivity =
  | ReferralActivityAddedRequester
  | ReferralActivityAddedObserver
  | ReferralActivityAnswered
  | ReferralActivityAssigned
  | ReferralActivityAssignedUnit
  | ReferralActivityClosed
  | ReferralActivityCreated
  | ReferralActivityDraftAnswered
  | ReferralActivityReopening
  | ReferralActivityRemovedRequester
  | ReferralActivityRemovedObserver
  | ReferralActivityUnassigned
  | ReferralActivityUnassignedUnit
  | ReferralActivityUrgencyLevelChanged
  | ReferralActivityValidated
  | ReferralActivityValidationDenied
  | ReferralActivityValidationRequested
  | ReferralActivityVersionAdded
  | ReferralActivityUpdatedTitle
  | ReferralActivityUpdatedTopic
  | ReferralActivitySubReferralCreated
  | ReferralActivitySubReferralConfirmed
  | ReferralActivitySubQuestionUpdated
  | ReferralActivitySubTitleUpdated;

export interface Topic {
  created_at: string;
  id: string;
  is_active: boolean;
  path: string;
  parent: string;
  name: string;
  owners: Array<UserLite>;
  unit: Unit['id'];
  unit_name: Unit['name'];
}

export type TopicLite = Pick<
  Topic,
  'created_at' | 'id' | 'name' | 'path' | 'unit_name'
>;

export type DOMElementPosition = {
  top?: number;
  bottom?: number;
  right?: number;
  left?: number;
  marginTop?: string;
  marginBottom?: string;
};

export interface Unit {
  created_at: string;
  id: string;
  members: UnitMember[];
  name: string;
}

export enum UnitType {
  CENTRAL = 'central_unit',
  DECENTRALISED = 'decentralised_unit',
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
  full_unit_name: string;
}

export enum UnitMembershipRole {
  SUPERADMIN = 'superadmin',
  ADMIN = 'admin',
  MEMBER = 'member',
  OWNER = 'owner',
}

export enum GrantedUnitMembershipRole {
  SUPERADMIN = 'superadmin',
  ADMIN = 'admin',
  OWNER = 'owner',
}

export interface ReferralUrgency extends SelectOption {
  duration: string;
  index: Nullable<number>;
  requires_justification: boolean;
}

export interface ReferralUrgencyLevelHistory {
  id: string;
  referral: string;
  old_referral_urgency: ReferralUrgency;
  new_referral_urgency: ReferralUrgency;
  explanation: string;
}

export interface SubReferralCreatedHistory {
  main_referral_id: string;
  secondary_referral_id: string;
}

export interface SubReferralConfirmedHistory {
  main_referral_id: string;
  secondary_referral_id: string;
}

export interface ReferralSubTitleUpdateHistory {
  subtitle: string;
}

export interface ReferralSubQuestionUpdateHistory {
  subquestion: string;
}

export interface ReferralTitleHistory {
  id: string;
  referral: string;
  old_title: string;
  new_title: string;
}

export interface ReferralTopicHistory {
  id: string;
  referral: string;
  old_topic: string;
  new_topic: string;
}

export interface UserLite {
  id: string;
  first_name: string;
  last_name: string;
  unit_name: string;
}

export interface User extends UserLite {
  username: string;
  is_staff: boolean;
  is_superuser: boolean;
  has_db_access: boolean;
  memberships: UnitMembership[];
  phone_number: string;
  email: string;
}

export interface ReferralUserLink extends UserLite {
  notifications: NotificationType;
  role: ReferralUserRole;
  email: string;
}

export enum NoteHighlightKeys {
  ID = 'referral_id',
  TEXT = 'text',
  OBJECT = 'object',
  TOPIC = 'topic',
  AUTHOR = 'author',
}

export interface NoteLite {
  _id: string;
  _index: string;
  _score: number;
  _source: {
    _lite: string;
    _type: string;
    id: string;
    referral_id: string;
    publication_date: string;
    created_at: string;
    assigned_units_names: Array<string>;
    author: string;
    siblings: number[];
    contributors: string[];
    document: NoteDocument;
    object: 'Version 2 PDF';
    requesters_unit_names: Array<string>;
    text: string;
    topic: string;
  };
  highlight: {
    referral_id: Array<string>;
    text: Array<string>;
    object: Array<string>;
    topic: Array<string>;
    author: Array<string>;
  };
}

export interface Note {
  id: string;
  publication_date: string;
  assigned_units_names: Array<string>;
  author: string;
  contributors: string[];
  document: NoteDocument;
  object: 'Version 2 PDF';
  requesters_unit_names: Array<String>;
  text: string;
  html: string;
  topic: string;
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

export enum TaskParams {
  MY_UNIT = 'my_unit',
  MY_REFERRALS = 'my_referrals',
  MY_DRAFTS = 'my_drafts',
}

export enum ErrorCodes {
  FILE_FORMAT_FORBIDDEN = 'error_file_format_forbidden',
  FILE_SCAN_KO = 'error_file_scan_ko',
}

export interface ErrorResponse {
  errors: Array<string>;
  code: ErrorCodes;
}

export interface ErrorFile {
  errors: Array<{ code: string; message: string }>;
  file: File;
}

export type VersionEventVerb = Exclude<
  ReportEventVerb,
  ReportVersionEventVerb.MESSAGE | ReportVersionEventVerb.NEUTRAL
>;
