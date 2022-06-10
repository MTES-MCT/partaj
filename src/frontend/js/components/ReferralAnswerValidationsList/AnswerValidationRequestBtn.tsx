import React from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { useHistory, useRouteMatch } from 'react-router-dom';
import { useUIDSeed } from 'react-uid';

import { appData } from 'appData';
import {
  DropdownButton,
  DropdownOpenButton,
  useDropdownMenu,
} from 'components/DropdownMenu';
import { ReferralAnswerValidationRequest } from 'types';

const messages = defineMessages({
  dropdownOpenTitle: {
    defaultMessage: 'Show actions',
    description:
      'Accessible name for the actions button on the referral answer validations list.',
    id: 'components.ReferralAnswerValidationsList.AnswerValidationRequestBtn.dropdownOpenTitle',
  },
  validate: {
    defaultMessage: 'Perform the validation',
    description:
      'Title for the button to perform a validation on the referral answer validations list.',
    id: 'components.ReferralAnswerValidationsList.AnswerValidationRequestBtn.validate',
  },
});

interface AnswerValidationRequestBtnProps {
  validationRequest: ReferralAnswerValidationRequest;
}

export const AnswerValidationRequestBtn: React.FC<
  AnswerValidationRequestBtnProps
> = ({ validationRequest }) => {
  const dropdown = useDropdownMenu();
  const seed = useUIDSeed();

  const history = useHistory();
  const { url } = useRouteMatch();

  return (
    <div className="flex flex-row">
      <div {...dropdown.getContainerProps({ className: 'ml-3' })}>
        <DropdownOpenButton
          {...dropdown.getDropdownButtonProps()}
          aria-labelledby={seed('dropdown-button-title')}
        >
          <svg role="img" className="fill-current block w-6 h-6">
            <title id={seed('dropdown-button-title')}>
              <FormattedMessage {...messages.dropdownOpenTitle} />
            </title>
            <use xlinkHref={`${appData.assets.icons}#icon-three-dots`} />
          </svg>
        </DropdownOpenButton>
        {dropdown.getDropdownContainer(
          <DropdownButton
            className="hover:bg-gray-100 focus:bg-gray-100"
            onClick={() =>
              history.push(`${url}/validation/${validationRequest.id}`)
            }
          >
            <FormattedMessage {...messages.validate} />
          </DropdownButton>,
        )}
      </div>
    </div>
  );
};
