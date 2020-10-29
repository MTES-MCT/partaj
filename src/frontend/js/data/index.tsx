import { QueryConfig, useQuery } from 'react-query';

import * as types from 'types';
import { Context } from 'types/context';
import { fetchList } from './fetchList';
import { fetchOne } from './fetchOne';

export const useReferral = (
  context: Context,
  referralId: number | string,
  queryConfig?: QueryConfig<types.Referral, unknown>,
) => {
  return useQuery<types.Referral>(
    ['referrals', referralId],
    fetchOne(context),
    queryConfig,
  );
};

type ReferralActivityResponse = types.APIList<types.ReferralActivity>;
export const useReferralActivities = (
  context: Context,
  referralId?: number | string,
  queryConfig?: QueryConfig<ReferralActivityResponse, unknown>,
) => {
  return useQuery<ReferralActivityResponse, 'referralactivities'>(
    ['referralactivities', { referral: referralId }],
    fetchList(context),
    queryConfig,
  );
};

export const useReferralAnswer = (
  context: Context,
  answerId: number | string,
  queryConfig?: QueryConfig<types.ReferralAnswer, unknown>,
) => {
  return useQuery<types.ReferralAnswer>(
    ['referralanswers', answerId],
    fetchOne(context),
    queryConfig,
  );
};

type ReferralAnswerValidationRequestsResponse = types.APIList<
  types.ReferralAnswerValidationRequest
>;
export const useReferralAnswerValidationRequests = (
  context: Context,
  answerId: number | string,
  queryConfig?: QueryConfig<ReferralAnswerValidationRequestsResponse, unknown>,
) => {
  return useQuery<
    ReferralAnswerValidationRequestsResponse,
    'referralanswervalidationrequests'
  >(
    ['referralanswervalidationrequests', { answer: answerId }],
    fetchList(context),
    queryConfig,
  );
};
