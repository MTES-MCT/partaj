import React, { Fragment, useContext, useEffect, useState } from 'react';
import * as Sentry from '@sentry/react';
import { useRequestValidationAction } from '../../data/reports';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { ReferralContext } from '../../data/providers/ReferralProvider';
import { IconTextButton } from '../buttons/IconTextButton';
import { CheckIcon, ValidationIcon } from '../Icons';
import {
  ReferralReportVersion,
  RequestValidationResponse,
  UnitMembershipRole,
} from '../../types';
import { useCurrentUser } from '../../data/useCurrentUser';
import { kebabCase } from 'lodash-es';
import { sortObject } from '../../utils/object';
import { commonMessages } from '../../const/translations';
import { getLastItem } from '../../utils/string';
import { useAppendixValidatorsAction } from '../../data/appendices';
import { BaseSideModalContext } from '../../data/providers/BaseSideModalProvider';
import { TextArea, TextAreaSize } from '../text/TextArea';
import { Nullable } from '../../types/utils';
import { VersionSummary } from '../ReferralReport/VersionSummary';

const messages = defineMessages({
  mainTitle: {
    defaultMessage: 'Validation request',
    description: 'Modal main title',
    id: 'components.ValidationAppendixModal.mainTitle',
  },
  cancel: {
    defaultMessage: 'Cancel',
    description: 'Cancel button text',
    id: 'components.ValidationAppendixModal.cancel',
  },
  chooseValidatorsTitle: {
    defaultMessage: 'Choose your validators',
    description: 'Choose validators title',
    id: 'components.ValidationAppendixModal.chooseValidatorsTitle',
  },
  chooseValidatorsDescription: {
    defaultMessage: 'They will be notified of your request by e-mail',
    description: 'Choose validators description',
    id: 'components.ValidationAppendixModal.chooseValidatorsDescription',
  },
  addComment: {
    defaultMessage: 'Add comment to your request (optional)',
    description: 'Add comment text',
    id: 'components.ValidationAppendixModal.addComment',
  },
  addCommentDescription: {
    defaultMessage: 'It will be displayed in the private unit conversation',
    description: 'Add comment description',
    id: 'components.ValidationAppendixModal.addCommentDescription',
  },
  requestValidation: {
    defaultMessage: 'Request validation',
    description: 'Ask for validation text',
    id: 'components.ValidationAppendixModal.requestValidation',
  },
});

interface SelectedOption {
  unitName: string;
  role: string;
}

export const ValidationContent = ({
  version,
  setVersion,
}: {
  version: Nullable<ReferralReportVersion>;
  setVersion: Function;
  versionNumber: number;
}) => {
  const intl = useIntl();
  const requestValidationMutation = useRequestValidationAction();
  const [validators, setValidators] = useState<boolean>(false);
  const { isBaseSideModalOpen, closeBaseSideModal } = useContext(
    BaseSideModalContext,
  );

  const validatorsMutation = useAppendixValidatorsAction({
    onSuccess: (data) => {
      setValidators(data);
    },
  });

  const [messageContent, setMessageContent] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedOptions, setSelectedOptions] = useState<Array<SelectedOption>>(
    [],
  );
  const { referral, setReferral } = useContext(ReferralContext);
  const { currentUser } = useCurrentUser();

  const closeModal = () => {
    closeBaseSideModal();
    setMessageContent('');
    setErrorMessage('');
    setSelectedOptions([]);
  };

  useEffect(() => {
    if (isBaseSideModalOpen && validatorsMutation.isIdle) {
      validatorsMutation.mutate({ version });
    }
  }, [isBaseSideModalOpen]);

  const getSortedValidators = (validators: any) => {
    return sortObject(
      [
        UnitMembershipRole.OWNER,
        UnitMembershipRole.ADMIN,
        UnitMembershipRole.SUPERADMIN,
      ],
      validators,
    );
  };

  const submitForm = (version: ReferralReportVersion) => {
    if (selectedOptions.length === 0) {
      setErrorMessage(
        "Veuillez choisir un ou plusieurs validateurs avant d'envoyer votre demande",
      );
      return 0;
    }

    requestValidationMutation.mutate(
      {
        selectedOptions,
        version: version.id,
        comment: messageContent,
      },
      {
        onSuccess: (data: RequestValidationResponse) => {
          setVersion(data.report.last_version);
          setReferral((previousReferral: any) => {
            previousReferral['state'] = data.state;

            return { ...previousReferral };
          });
          closeModal();
        },
        onError: (error) => {
          Sentry.captureException(error);
          setErrorMessage(
            intl.formatMessage(commonMessages.minDefaultErrorMessage),
          );
        },
      },
    );
  };

  const isOptionSelected = (role: string, unitName: string) => {
    return (
      selectedOptions.filter(
        (option) => option.unitName === unitName && role === option.role,
      ).length === 1
    );
  };

  const toggleOption = ({ role, unitName }: SelectedOption) => {
    if (errorMessage) {
      setErrorMessage('');
    }

    if (!isOptionSelected(role, unitName)) {
      setSelectedOptions((prevState) => [...prevState, { role, unitName }]);
    } else {
      setSelectedOptions((prevState) => {
        return prevState.filter(
          (option) => option.role !== role || option.unitName !== unitName,
        );
      });
    }
  };

  return (
    <>
      {referral && version && currentUser && (
        <div>
          <div className="flex flex-col flex-grow p-2 overflow-y-auto space-y-6">
            <VersionSummary version={version} />
            <div>
              <div>
                <h3 className="text-lg font-medium">
                  <FormattedMessage {...messages.chooseValidatorsTitle} />
                </h3>
                <p className="text-sm text-gray-500">
                  <FormattedMessage {...messages.chooseValidatorsDescription} />
                </p>
              </div>
              <ul
                className="flex flex-col space-y-2"
                role="listbox"
                aria-multiselectable="true"
              >
                {Object.entries(getSortedValidators(validators)).map(
                  ([role, value]) => (
                    <Fragment key={`role-${kebabCase(role)}`}>
                      <p className="text-base font-medium">
                        <FormattedMessage
                          {...commonMessages[role as UnitMembershipRole]}
                        />
                      </p>
                      <>
                        {Object.entries(value as object).map(
                          ([unitName, members]) => (
                            <li
                              id={kebabCase(unitName)}
                              key={kebabCase(unitName)}
                              role="option"
                              className={`flex cursor-pointer items-center text-s p-2 space-x-2 rounded-sm border hover:bg-warning-200 ${
                                isOptionSelected(role, unitName)
                                  ? 'border-black'
                                  : 'border-gray-300'
                              }`}
                              aria-selected={isOptionSelected(role, unitName)}
                              tabIndex={0}
                              onClick={() => {
                                toggleOption({
                                  role,
                                  unitName,
                                });
                              }}
                            >
                              <div
                                role="checkbox"
                                aria-checked={isOptionSelected(role, unitName)}
                                className={`dsfr-checkbox`}
                              >
                                <CheckIcon className="fill-black" />
                              </div>
                              <div className="flex flex-col">
                                <p className="text-base">
                                  {getLastItem(unitName, '/')}
                                </p>
                                <div className="flex items-center justify-start w-full space-x-2">
                                  {members.map((member: any) => (
                                    <div
                                      className="space-x-1"
                                      key={kebabCase(member)}
                                    >
                                      <span>{member}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </li>
                          ),
                        )}
                      </>
                    </Fragment>
                  ),
                )}
              </ul>
            </div>
            <div>
              <div className="flex flex-col flex-grow">
                <h3>
                  <FormattedMessage {...messages.addComment} />
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  <FormattedMessage {...messages.addCommentDescription} />
                </p>
                <TextArea
                  id="validation-appendix-content-textarea"
                  size={TextAreaSize.L}
                  value={messageContent}
                  onChange={(value: string) => setMessageContent(value)}
                />
              </div>
              <span
                className="absolute text-danger-500 text-sm"
                style={{ bottom: '50px' }}
              >
                {errorMessage}
              </span>
            </div>
          </div>
          <div className="flex w-full justify-between z-20 bg-white p-4">
            <button
              className="hover:underline"
              onClick={() => closeBaseSideModal()}
            >
              <FormattedMessage {...messages.cancel} />
            </button>
            <IconTextButton
              otherClasses="btn-warning px-4 py-3"
              type={'submit'}
              icon={<ValidationIcon className="fill-black" />}
              onClick={() => submitForm(version)}
              text={intl.formatMessage(messages.requestValidation)}
            />
          </div>
        </div>
      )}
    </>
  );
};
