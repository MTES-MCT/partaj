import * as Sentry from '@sentry/react';
import { useMachine } from '@xstate/react';
import React from 'react';
import { Machine } from 'xstate';

import { Spinner } from 'components/Spinner';
import { UnitMember, Referral } from 'types';
import { ContextProps } from 'types/context';
import { getUserFullname } from 'utils/user';
import { useQueryCache } from 'react-query';

const styles = {
  assign: 'hover:bg-gray-100 focus:bg-gray-100',
  unassign: 'hover:bg-red-100 focus:bg-red-100',
};

const setAssignmentMachine = Machine({
  id: 'setAssignmentMachine',
  initial: 'idle',
  states: {
    idle: {
      on: {
        SET_ASSIGNMENT: 'loading',
      },
    },
    loading: {
      invoke: {
        id: 'setAssignment',
        onDone: { target: 'success', actions: 'invalidateReferralQueries' },
        onError: { target: 'failure', actions: 'handleError' },
        src: 'assignOrUnassign',
      },
    },
    success: {
      type: 'final',
    },
    failure: {},
  },
});

interface ReferralMemberAssignmentButtonProps {
  action: 'assign' | 'unassign';
  member: UnitMember;
  referral: Referral;
}

export const ReferralMemberAssignmentButton: React.FC<
  ReferralMemberAssignmentButtonProps & ContextProps
> = ({ action, context, member, referral }) => {
  const queryCache = useQueryCache();

  const [current, send] = useMachine(setAssignmentMachine, {
    actions: {
      handleError: (_, event) => {
        Sentry.captureException(event.data);
      },
      invalidateReferralQueries: () => {
        queryCache.invalidateQueries(['referrals']);
        queryCache.invalidateQueries(['referralactivities']);
      },
    },
    services: {
      assignOrUnassign: async () => {
        const response = await fetch(
          `/api/referrals/${referral!.id}/${action}/`,
          {
            body: JSON.stringify({ assignee_id: member.id }),
            headers: {
              Authorization: `Token ${context.token}`,
              'Content-Type': 'application/json',
            },
            method: 'POST',
          },
        );
        if (!response.ok) {
          throw new Error(
            'Failed to get created new assignment in ReferralDetailAssignment.',
          );
        }
        return await response.json();
      },
    },
  });

  return (
    <button
      className={
        `whitespace-no-wrap flex max-w-full items-center justify-between w-full text-left px-4 py-2 text-sm ` +
        `leading-5 text-gray-700 hover:text-gray-900 focus:outline-none focus:text-gray-900 ` +
        `${styles[action]} ${current.matches('loading') ? 'cursor-wait' : ''}`
      }
      onClick={() => send('SET_ASSIGNMENT')}
      aria-busy={current.matches('loading')}
      aria-disabled={current.matches('loading')}
    >
      <span className="truncate" style={{ maxWidth: 'calc(100% - 1.5rem)' }}>
        {getUserFullname(member)}
      </span>
      {current.matches('loading') ? (
        <span aria-hidden="true">
          <Spinner size="small">
            {/* No children with loading text as the spinner is aria-hidden (handled by aria-busy) */}
          </Spinner>
        </span>
      ) : null}
    </button>
  );
};
