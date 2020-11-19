import * as Sentry from '@sentry/react';
import { useMachine } from '@xstate/react';
import React from 'react';
import { useQueryCache } from 'react-query';
import { Machine } from 'xstate';

import { DropdownButton } from 'components/DropdownMenu';
import { UnitMember, Referral } from 'types';
import { ContextProps } from 'types/context';
import { getUserFullname } from 'utils/user';

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
    <DropdownButton
      className={styles[action]}
      isLoading={current.matches('loading')}
      onClick={() => send('SET_ASSIGNMENT')}
    >
      <span className="truncate" style={{ maxWidth: 'calc(100% - 1.5rem)' }}>
        {getUserFullname(member)}
      </span>
    </DropdownButton>
  );
};
