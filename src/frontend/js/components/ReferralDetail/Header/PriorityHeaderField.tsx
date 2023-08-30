import React, { useContext } from 'react';

import { ReferralStatus, ReferralUserAction } from 'types';
import { ReferralContext } from '../../../data/providers/ReferralProvider';
import { useClickOutside } from '../../../utils/useClickOutside';
import { ArrowDownIcon, IconColor } from '../../Icons';
import { RoleModalContext } from '../../../data/providers/RoleModalProvider';
import { ReferralStatusModal } from '../../modals/ReferralStatusModal';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';

const messages = defineMessages({
  sensitivenessNormal: {
    defaultMessage: 'Normal',
    description: 'Normal priority header sensitiveness text',
    id: 'components.PriorityHeaderField.normal',
  },
  sensitivenessHigh: {
    defaultMessage: 'High',
    description: 'High priority header sensitiveness text',
    id: 'components.PriorityHeaderField.high',
  },
  sensitivenessTooltip: {
    defaultMessage: 'Change referral sensitiveness',
    description: 'sensitiveness tooltip text',
    id: 'components.PriorityHeaderField.sensitivenessTooltip',
  },
});

export const PriorityHeaderField: any = () => {
  const intl = useIntl();
  const { referral } = useContext(ReferralContext);
  const { closeModal, displayModal, modalRef } = useContext(RoleModalContext);

  const { ref } = useClickOutside({
    onClick: () => {
      closeModal();
    },
    insideRef: modalRef,
  });

  return (
    <>
      {referral && (
        <>
          <button
            ref={ref}
            type="button"
            className="tooltip tooltip-action button whitespace-nowrap button-white-grey button-superfit text-black text-base space-x-2"
            onClick={(e) => {
              e.stopPropagation();
              displayModal({
                buttonRef: ref,
                action: ReferralUserAction.UPDATE_STATUS,
                value: referral.status,
              });
            }}
            data-tooltip={intl.formatMessage(messages.sensitivenessTooltip)}
          >
            {referral.status == ReferralStatus.NORMAL && (
              <span>
                <FormattedMessage {...messages.sensitivenessNormal} />
              </span>
            )}
            {referral.status == ReferralStatus.SENSITIVE && (
              <span>
                <FormattedMessage {...messages.sensitivenessHigh} />
              </span>
            )}
            <ArrowDownIcon color={IconColor.GREY_400} />
          </button>
          <ReferralStatusModal />
        </>
      )}
    </>
  );
};
