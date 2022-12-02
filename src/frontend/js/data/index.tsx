import { appData } from 'appData';
import {
  useMutation,
  UseMutationOptions,
  useQuery,
  useQueryClient,
  UseQueryOptions,
} from 'react-query';

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

type FetchOneQueryOptions<TData> = UseQueryOptions<
  TData,
  unknown,
  TData,
  FetchOneQueryKey
>;

type FetchListQueryOptions<TData> = UseQueryOptions<
  TData,
  unknown,
  TData,
  FetchListQueryKey
>;

export const useReferral = (
  referralId: string,
  queryOptions?: FetchOneQueryOptions<types.Referral>,
) => {
  return useQuery(['referrals', referralId], fetchOne, queryOptions);
};

type UseReferralActionAddRequester = {
  action: 'add_requester';
  payload: { requester: string };
  referral: types.Referral;
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
type UseReferralActionRemoveRequester = {
  action: 'remove_requester';
  payload: { requester: string };
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
type UseReferralActionData =
  | UseReferralActionAddRequester
  | UseReferralActionAssign
  | UseReferralActionAssignUnit
  | UseReferralActionChangeUrgencyLevel
  | UseReferralActionCloseReferral
  | UseReferralActionRemoveRequester
  | UseReferralActionUnassign
  | UseReferralActionUnassignUnit;

type UseReferralActionOptions = UseMutationOptions<
  types.Referral,
  unknown,
  UseReferralActionData
>;
export const useReferralAction = (options?: UseReferralActionOptions) => {
  const queryClient = useQueryClient();
  return useMutation<types.Referral, unknown, UseReferralActionData>(
    ({ action, payload, referral }) =>
      detailAction({
        action,
        name: 'referrals',
        objectId: String(referral.id),
        payload,
      }),
    {
      ...options,
      onSuccess: (data, variables, context) => {
        queryClient.invalidateQueries('referrals');
        queryClient.invalidateQueries('referralactivities');
        if (options?.onSuccess) {
          options.onSuccess(data, variables, context);
        }
      },
    },
  );
};

type deleteAction = {
  name: string;
  referral: types.ReferralLite;
};
type UseDeleteActionOptions = UseMutationOptions<
  unknown,
  unknown,
  deleteAction
>;
export const useDeleteAction = (options?: UseDeleteActionOptions) => {
  return useMutation<unknown, unknown, deleteAction>(
    ({ name, referral }) =>
      deleteAction({
        name: name,
        objectId: String(referral.id),
      }),
    {
      ...options,
      onSuccess: (data, variables, context) => {
        if (options?.onSuccess) {
          options.onSuccess(data, variables, context);
        }
      },
    },
  );
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
  task?: 'answer_soon' | 'assign' | 'process' | 'validate';
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

  return useQuery(
    ['referrallites', params as FetchListQueryParams],
    fetchList,
    queryOptions,
  );
};

export const useUserReferralLites = (
  params: UseReferralLitesParams,
  queryOptions?: FetchListQueryOptions<ReferralLitesResponse>,
) => {
  return useQuery(
    ['referrallites/my_unit', params as FetchListQueryParams],
    fetchList,
    queryOptions,
  );
};

type ReferralActivityResponse = types.APIList<types.ReferralActivity>;
export const useReferralActivities = (
  referralId: number,
  queryOptions?: FetchListQueryOptions<ReferralActivityResponse>,
) => {
  return useQuery(
    ['referralactivities', { referral: referralId.toString() }],
    fetchList,
    queryOptions,
  );
};

export const useReferralReport = (
  reportId: string,
  queryOptions?: FetchOneQueryOptions<types.ReferralReport>,
) => {
  return useQuery(['referralreports', reportId], fetchOne, queryOptions);
};

type ReferralAnswersResponse = types.APIList<types.ReferralAnswer>;
type UseReferralAnswersParams = { referral: string };

export const useReferralAnswer = (
  answerId: string,
  queryOptions?: FetchOneQueryOptions<types.ReferralAnswer>,
) => {
  return useQuery(['referralanswers', answerId], fetchOne, queryOptions);
};

export const useReferralAnswers = (
  params: UseReferralAnswersParams,
  queryOptions?: FetchListQueryOptions<ReferralAnswersResponse>,
) => {
  return useQuery(['referralanswers', params], fetchList, queryOptions);
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
  return useQuery(
    ['referralanswervalidationrequests', { answer: answerId }],
    fetchList,
    queryOptions,
  );
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
    };
type UseCreateMessageOptions = UseMutationOptions<
  types.ReportMessage,
  UseCreateMessageError,
  UseCreateMessageData
>;

export const useCreateMessage = (
  url: string,
  queryKey: string,
  options?: UseCreateMessageOptions,
) => {
  const queryClient = useQueryClient();
  return useMutation<
    types.ReportMessage,
    UseCreateMessageError,
    UseCreateMessageData
  >(
    (data) =>
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
    {
      ...options,
      onSuccess: (data, variables, context) => {
        queryClient.invalidateQueries(queryKey);
        if (options?.onSuccess) {
          options.onSuccess(data, variables, context);
        }
      },
    },
  );
};

type ReferralMessagesResponse = types.APIList<types.ReferralMessage>;
type UseReferralMessagesParams = { referral: string };
export const useReferralMessages = (
  params: UseReferralMessagesParams,
  queryOptions?: FetchListQueryOptions<ReferralMessagesResponse>,
) => {
  return useQuery(['referralmessages', params], fetchList, queryOptions);
};

type ReportMessagesResponse = types.APIList<types.ReportMessage>;
type UseReportMessagesParams = {
  report: string;
};
export const useReportMessages = (
  params: UseReportMessagesParams,
  queryOptions?: FetchListQueryOptions<ReportMessagesResponse>,
) => {
  return useQuery(['reportmessages', params], fetchList, queryOptions);
};

type ReferralUrgenciesResponse = types.APIList<types.ReferralUrgency>;
export const useReferralUrgencies = (
  queryOptions?: FetchListQueryOptions<ReferralUrgenciesResponse>,
) => {
  return useQuery(['urgencies'], fetchList, queryOptions);
};

type TopicsResponse = types.APIList<types.Topic>;
type UseTopicsParams = { unit: string };
export const useTopics = (
  params?: UseTopicsParams,
  queryOptions?: FetchListQueryOptions<TopicsResponse>,
) => {
  return useQuery(
    !!params ? ['topics', params] : ['topics'],
    fetchList,
    queryOptions,
  );
};

export const useUnit = (
  unitId: string,
  queryOptions?: FetchOneQueryOptions<types.Unit>,
) => {
  return useQuery(['units', unitId], fetchOne, queryOptions);
};

type UnitsResponse = types.APIList<types.Unit>;
export const useUnits = (
  queryOptions?: FetchListQueryOptions<UnitsResponse>,
) => {
  return useQuery(['units'], fetchList, queryOptions);
};

type UnitMembershipsResponse = types.APIList<types.UnitMembership>;
type UseUnitMembershipsParams = { unit: string };
export const useUnitMemberships = (
  params: UseUnitMembershipsParams,
  queryOptions?: FetchListQueryOptions<UnitMembershipsResponse>,
) => {
  return useQuery(['unitmemberships', params], fetchList, queryOptions);
};
