export interface Referral {
  activity: ReferralActivity[];
  answers: ReferralAnswer[];
  assignees: User['id'][];
  context: string;
  created_at: string;
  id: number;
  prior_work: string;
  question: string;
  requester: string;
  state: ReferralState;
  topic: Topic;
  updated_at: string;
  urgency: string;
  urgency_explanation: string;
  user: User;
}

export interface ReferralAnswer {
  content: string;
  created_at: string;
  created_by: User['id'];
  id: string;
  referral: Referral['id'];
}

interface ReferralActivityBase {
  actor: User;
  created_at: string;
  id: string;
  item_content_type: number;
  item_object_id: string;
  referral: Referral['id'];
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

export type ReferralActivity =
  | ReferralActivityAnswered
  | ReferralActivityAssigned
  | ReferralActivityCreated;

export enum ReferralActivityVerb {
  ANSWERED = 'answered',
  ASSIGNED = 'assigned',
  CREATED = 'created',
}

export enum ReferralState {
  ASSIGNED = 'assigned',
  RECEIVED = 'received',
  CLOSED = 'closed',
  INCOMPLETE = 'incomplete',
  ANSWERED = 'answered',
}

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

export interface User {
  date_joined: string;
  email: string;
  first_name: string;
  id: string;
  is_staff: boolean;
  is_superuser: boolean;
  last_name: string;
  unite: string;
  username: string;
}
