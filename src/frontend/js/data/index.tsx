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
import { fetchList, FetchListQueryKey } from './fetchList';
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
type UseReferralActionRefuseReferral = {
  action: 'close_referral';
  payload: { close_explanation: string };
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
  | UseReferralActionAssign
  | UseReferralActionAssignUnit
  | UseReferralActionUnassign
  | UseReferralActionUnassignUnit
  | UseReferralActionChangeUrgencyLevel
  | UseReferralActionRefuseReferral;
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

type ReferralLitesResponse = types.APIList<types.ReferralLite>;
type UseReferralLitesParams =
  | { type: string }
  | { unit: string }
  | { user: string };
function isReferralLiteTypeRequest(
  params: UseReferralLitesParams,
): params is { type: string } {
  return !!(params as any).type;
}
export const useReferralLites = (
  params: UseReferralLitesParams,
  queryOptions?: FetchListQueryOptions<ReferralLitesResponse>,
) => {
  const key = isReferralLiteTypeRequest(params)
    ? ([`referrallites/${params.type}`] as const)
    : (['referrallites', params] as const);
  return useQuery(key, fetchList, queryOptions);
};

type ReferralActivityResponse = types.APIList<types.ReferralActivity>;
export const useReferralActivities = (
  referralId: string,
  queryOptions?: FetchListQueryOptions<ReferralActivityResponse>,
) => {
  return useQuery(
    ['referralactivities', { referral: referralId }],
    fetchList,
    queryOptions,
  );
};

export const useReferralAnswer = (
  answerId: string,
  queryOptions?: FetchOneQueryOptions<types.ReferralAnswer>,
) => {
  return useQuery(['referralanswers', answerId], fetchOne, queryOptions);
};

type ReferralAnswersResponse = types.APIList<types.ReferralAnswer>;
type UseReferralAnswersParams = { referral: string };
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

type UseCreateReferralMessageData = {
  content: string;
  files: File[];
  referral: string;
};
type UseCreateReferralMessageError =
  | { code: 'exception' }
  | {
      code: 'invalid';
      errors: { [key in keyof UseCreateReferralMessageData]?: string[] }[];
    };
type UseCreateReferralMessageOptions = UseMutationOptions<
  types.ReferralMessage,
  UseCreateReferralMessageError,
  UseCreateReferralMessageData
>;
export const useCreateReferralMessage = (
  options?: UseCreateReferralMessageOptions,
) => {
  const queryClient = useQueryClient();
  return useMutation<
    types.ReferralMessage,
    UseCreateReferralMessageError,
    UseCreateReferralMessageData
  >(
    (data) =>
      sendForm({
        headers: { Authorization: `Token ${appData.token}` },
        keyValuePairs: [
          ...(Object.entries(data).filter((entry) => entry[0] !== 'files') as [
            string,
            string,
          ][]),
          ...(data.files.length > 0
            ? data.files.map((file) => ['files', file] as [string, File])
            : []),
        ],
        url: '/api/referralmessages/',
      }),
    {
      ...options,
      onSuccess: (data, variables, context) => {
        queryClient.invalidateQueries('referralmessages');
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
