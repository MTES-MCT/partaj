import { appData } from 'appData';
import {
  useMutation,
  UseMutationOptions,
  useQuery,
  useQueryClient,
  UseQueryOptions,
} from '@tanstack/react-query';

import * as types from 'types';
import { sendForm } from 'utils/sendForm';
import { detailAction } from './detailAction';
import { deleteAction } from './deleteAction';
import {
  fetchList,
  FetchListQueryKey,
  FetchListQueryParams,
} from './fetchList';
import { fetchOne, FetchOneQueryKey } from './fetchOne';
import {
  ErrorResponse,
  NotificationType,
  ReferralLite,
  ReferralUserRole,
  ReportEventType,
} from 'types';
import { snakeCase } from 'lodash-es';
import { ReferralTab } from '../components/NewDashboard/ReferralTabs';

type FetchOneQueryOptions<TData> = Omit<
  UseQueryOptions<TData, unknown, TData, FetchOneQueryKey>,
  'queryKey' | 'queryFn'
>;

type FetchListQueryOptions<TData> = Omit<
  UseQueryOptions<TData, unknown, TData, FetchListQueryKey>,
  'queryKey' | 'queryFn'
>;

export const useReferral = (
  referralId: string,
  queryOptions?: FetchOneQueryOptions<types.Referral>,
) => {
  return useQuery({
    queryKey: ['referrals', referralId],
    queryFn: fetchOne,
    ...queryOptions,
  });
};

export const useFeatureFlag = (
  tag: string,
  queryOptions?: FetchOneQueryOptions<types.FeatureFlag>,
) => {
  return useQuery({
    queryKey: ['featureflags', tag],
    queryFn: fetchOne,
    ...queryOptions,
  });
};

type UseReferralActionAssign = {
  action: 'assign';
  payload: { assignee: string };
  referral: types.Referral;
};
type UseReferralActionAssignUnit = {
  action: 'assign_unit';
  payload: { unit: string; assignunit_explanation: string };
  referral: types.Referral;
};
type UseReferralActionChangeUrgencyLevel = {
  action: 'change_urgencylevel';
  payload: { urgencylevel: string; urgencylevel_explanation: string };
  referral: types.Referral;
};
type UseReferralActionCloseReferral = {
  action: 'close_referral';
  payload: { close_explanation: string };
  referral: types.Referral;
};

type UseReferralActionAddUser = {
  action: 'upsert_user';
  payload: {
    user: string;
    role?: ReferralUserRole;
    notifications?: NotificationType;
  };
  referral: types.Referral;
};

type UseReferralActionRemoveUser = {
  action: 'remove_user';
  payload: { user: string };
  referral: types.Referral;
};
type UseReferralActionUnassign = {
  action: 'unassign';
  payload: { assignee: string };
  referral: types.Referral;
};
type UseReferralActionUnassignUnit = {
  action: 'unassign_unit';
  payload: { unit: string };
  referral: types.Referral;
};

type UseReferralActionInvite = {
  action: 'invite';
  payload: { email: string; invitationRole: string };
  referral: types.Referral;
};

type UseReferralActionUpdateTopic = {
  action: 'update_topic';
  payload: { topic: string };
  referral: types.Referral;
};

type UseReferralActionUpdateStatus = {
  action: 'update_status';
  payload: { status: string };
  referral: types.Referral;
};

type UseReferralActionUpdateAnswerProperties = {
  action: 'update_answer_properties';
  payload: { value: string };
  referral: types.Referral;
};

type UseReferralActionUpdateTitle = {
  action: 'update_title';
  payload: { title: string };
  referral: types.Referral;
};

type UseReferralActionOverrideSendToKnowledgeBase = {
  action: 'override_send_to_knowledge_base';
  payload: { send_to_knowledge_base: boolean };
  referral: types.Referral;
};

type UseReferralActionUpdatePublishedReferralFromKnowledgeBase = {
  action: 'update_published_referral_from_knowledge_base';
  payload: { send_to_knowledge_base: boolean };
  referral: types.Referral;
};

export type UseReferralActionData =
  | UseReferralActionAddUser
  | UseReferralActionAssign
  | UseReferralActionAssignUnit
  | UseReferralActionChangeUrgencyLevel
  | UseReferralActionCloseReferral
  | UseReferralActionRemoveUser
  | UseReferralActionUnassign
  | UseReferralActionUnassignUnit
  | UseReferralActionInvite
  | UseReferralActionUpdateTopic
  | UseReferralActionUpdateStatus
  | UseReferralActionUpdateAnswerProperties
  | UseReferralActionUpdateTitle
  | UseReferralActionOverrideSendToKnowledgeBase
  | UseReferralActionUpdatePublishedReferralFromKnowledgeBase;

type UseReferralActionOptions = UseMutationOptions<
  types.Referral,
  unknown,
  UseReferralActionData
>;

export const useReferralAction = (options?: UseReferralActionOptions) => {
  const queryClient = useQueryClient();
  return useMutation<types.Referral, unknown, UseReferralActionData>({
    mutationFn: ({ action, payload, referral }) =>
      detailAction({
        action,
        name: 'referrals',
        objectId: String(referral.id),
        payload,
      }),
    ...options,
    onSuccess: (data, variables, onMutateResult, context) => {
      queryClient.invalidateQueries({ queryKey: ['referrals'] });
      queryClient.invalidateQueries({ queryKey: ['referralactivities'] });
      if (options?.onSuccess) {
        options.onSuccess(data, variables, onMutateResult, context);
      }
    },
  });
};

type deleteAction = {
  name: string;
  id: string;
};
type UseDeleteActionOptions = UseMutationOptions<
  unknown,
  unknown,
  deleteAction
>;
export const useDeleteAction = (options?: UseDeleteActionOptions) => {
  return useMutation<any, unknown, deleteAction>({
    mutationFn: ({ name, id }) =>
      deleteAction({
        name: name,
        objectId: id,
      }),
    ...options,
    onSuccess: (data, variables, onMutateResult, context) => {
      if (options?.onSuccess) {
        options.onSuccess(data, variables, onMutateResult, context);
      }
    },
  });
};

type ReferralLitesResponse = types.APIList<types.ReferralLite>;

type DueDate = { due_date_after: string; due_date_before: string };

export type UseReferralLitesParams = {
  assignee?: string[];
  due_date?: DueDate;
  due_date_after?: string;
  due_date_before?: string;
  query?: string;
  state?: types.ReferralState[];
  task?:
    | 'answer_soon'
    | 'assign'
    | 'change'
    | 'done'
    | 'process'
    | 'validate'
    | 'in_validation'
    | 'my_unit'
    | 'my_referrals'
    | 'my_drafts';
  unit?: string[];
  topic?: string[];
  user?: string[];
  users_unit_name?: string[];
};

export const useReferralLites = (
  params: UseReferralLitesParams,
  queryOptions?: FetchListQueryOptions<ReferralLitesResponse>,
) => {
  if (params.hasOwnProperty('due_date') && params.due_date != undefined) {
    params.due_date_after = params.due_date!.due_date_after;
    params.due_date_before = params.due_date!.due_date_before;
    params['due_date'] = undefined;
  }

  return useQuery({
    queryKey: ['referrallites', params as FetchListQueryParams],
    queryFn: fetchList,
    ...queryOptions,
  });
};

export interface ReferralLiteResultV2 {
  count: number;
  items: ReferralLite[];
}

type ReferralLitesV2Response = { [key in ReferralTab]?: ReferralLiteResultV2 };

export const useReferralLitesV2 = (
  params: URLSearchParams,
  url: string,
  unitId?: string,
  queryOptions?: FetchListQueryOptions<ReferralLitesV2Response>,
) => {
  const normalizedParams: { [key: string]: any } = {};

  params.forEach((value, key) => {
    if (!normalizedParams.hasOwnProperty(snakeCase(key))) {
      normalizedParams[snakeCase(key)] = [];
    }
    normalizedParams[snakeCase(key)].push(value);
  });

  if (unitId) {
    normalizedParams['unit_id'] = [unitId];
  }

  return useQuery({
    queryKey: [
      `referrallites/${url}`,
      normalizedParams as FetchListQueryParams,
    ],
    queryFn: fetchList,
    ...queryOptions,
  });
};

export const useUserReferralLites = (
  params: UseReferralLitesParams,
  queryOptions?: FetchListQueryOptions<ReferralLitesResponse>,
) => {
  return useQuery({
    queryKey: ['referrallites/my_unit', params as FetchListQueryParams],
    queryFn: fetchList,
    ...queryOptions,
  });
};

type ReferralActivityResponse = types.APIList<types.ReferralActivity>;
export const useReferralActivities = (
  referralId: string,
  queryOptions?: FetchListQueryOptions<ReferralActivityResponse>,
) => {
  return useQuery({
    queryKey: ['referralactivities', { referral: referralId.toString() }],
    queryFn: fetchList,
    ...queryOptions,
  });
};

export const useReferralReport = (
  reportId: string,
  queryOptions?: FetchOneQueryOptions<types.ReferralReport>,
) => {
  return useQuery({
    queryKey: ['referralreports', reportId],
    queryFn: fetchOne,
    ...queryOptions,
  });
};

type ReferralAnswersResponse = types.APIList<types.ReferralAnswer>;
type UseReferralAnswersParams = { referral: string };

export const useReferralAnswer = (
  answerId: string,
  queryOptions?: FetchOneQueryOptions<types.ReferralAnswer>,
) => {
  return useQuery({
    queryKey: ['referralanswers', answerId],
    queryFn: fetchOne,
    ...queryOptions,
  });
};

export const useReferralAnswers = (
  params: UseReferralAnswersParams,
  queryOptions?: FetchListQueryOptions<ReferralAnswersResponse>,
) => {
  return useQuery({
    queryKey: ['referralanswers', params],
    queryFn: fetchList,
    ...queryOptions,
  });
};

type ReferralAnswerValidationRequestsResponse = types.APIList<
  types.ReferralAnswerValidationRequest
>;
export const useReferralAnswerValidationRequests = (
  answerId: string,
  queryOptions?: FetchListQueryOptions<
    ReferralAnswerValidationRequestsResponse
  >,
) => {
  return useQuery({
    queryKey: ['referralanswervalidationrequests', { answer: answerId }],
    queryFn: fetchList,
    ...queryOptions,
  });
};

type UseCreateMessageData = {
  content: string;
  notifications?: string[];
  report?: string;
  files?: File[];
};

type UseCreateMessageError =
  | { code: 'exception' }
  | {
      code: 'invalid';
      errors: { [key in keyof UseCreateMessageData]?: string[] }[];
    }
  | ErrorResponse;
type UseCreateEventOptions = UseMutationOptions<
  types.ReportEvent,
  UseCreateMessageError,
  UseCreateMessageData
>;

export const useCreateMessage = (
  url: string,
  queryKey: string,
  options?: UseCreateEventOptions,
) => {
  const queryClient = useQueryClient();
  return useMutation<
    types.ReportEvent,
    UseCreateMessageError,
    UseCreateMessageData
  >({
    mutationFn: (data) =>
      sendForm({
        headers: { Authorization: `Token ${appData.token}` },
        keyValuePairs: [
          ...(Object.entries(data).filter(
            (entry) => entry[0] !== 'files' && entry[0] !== 'notifications',
          ) as [string, string][]),
          ['notifications', data.notifications] as [string, string[]],
          ...(data.files && data.files.length > 0
            ? data.files.map((file) => ['files', file] as [string, File])
            : []),
        ],
        url,
      }),
    ...options,
    onSuccess: (data, variables, onMutateResult, context) => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      if (options?.onSuccess) {
        options.onSuccess(data, variables, onMutateResult, context);
      }
    },
  });
};

type ReferralMessagesResponse = types.APIList<types.ReferralMessage>;
type UseReferralMessagesParams = { referral: string };
export const useReferralMessages = (
  params: UseReferralMessagesParams,
  queryOptions?: FetchListQueryOptions<ReferralMessagesResponse>,
) => {
  return useQuery({
    queryKey: ['referralmessages', params],
    queryFn: fetchList,
    ...queryOptions,
  });
};

type ReportEventsResponse = types.APIList<types.ReportEvent>;
type UseReportEventsParams = {
  report: string;
  type?: ReportEventType;
};
export const useReportEvents = (
  params: UseReportEventsParams,
  queryOptions?: FetchListQueryOptions<ReportEventsResponse>,
) => {
  return useQuery({
    queryKey: ['reportevents', params],
    queryFn: fetchList,
    ...queryOptions,
  });
};

type ReferralUrgenciesResponse = types.APIList<types.ReferralUrgency>;
export const useReferralUrgencies = (
  queryOptions?: FetchListQueryOptions<ReferralUrgenciesResponse>,
) => {
  return useQuery({
    queryKey: ['urgencies'],
    queryFn: fetchList,
    ...queryOptions,
  });
};

type TopicsResponse = types.APIList<types.Topic>;
type UseTopicsParams = { unit: string };

export const useTopics = (
  params?: UseTopicsParams,
  queryOptions?: FetchListQueryOptions<TopicsResponse>,
) => {
  return useQuery({
    queryKey: !!params ? ['topics', params] : ['topics'],
    queryFn: fetchList,
    ...queryOptions,
  });
};

export const useUnit = (
  unitId: string,
  queryOptions?: FetchOneQueryOptions<types.Unit>,
) => {
  return useQuery({
    queryKey: ['units', unitId],
    queryFn: fetchOne,
    ...queryOptions,
  });
};

type UnitsResponse = types.APIList<types.Unit>;
export const useUnits = (
  queryOptions?: FetchListQueryOptions<UnitsResponse>,
) => {
  return useQuery({
    queryKey: ['units'],
    queryFn: fetchList,
    ...queryOptions,
  });
};

type UnitMembershipsResponse = types.APIList<types.UnitMembership>;
type UseUnitMembershipsParams = { unit: string };
export const useUnitMemberships = (
  params: UseUnitMembershipsParams,
  queryOptions?: FetchListQueryOptions<UnitMembershipsResponse>,
) => {
  return useQuery({
    queryKey: ['unitmemberships', params],
    queryFn: fetchList,
    ...queryOptions,
  });
};
