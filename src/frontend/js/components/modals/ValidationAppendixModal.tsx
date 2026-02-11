import React, { Fragment, useContext, useEffect, useState } from 'react';
import * as Sentry from '@sentry/react';
import { useClickOutside } from '../../utils/useClickOutside';
import {
  useRequestAppendixValidationAction,
  useRequestValidationAction,
} from '../../data/reports';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { ReferralContext } from '../../data/providers/ReferralProvider';
import { IconTextButton } from '../buttons/IconTextButton';
import { CheckIcon, ValidationIcon } from '../Icons';
import {
  ReferralReportAppendix,
  RequestValidationResponse,
  UnitMembershipRole,
} from '../../types';
import { TextArea } from '../inputs/TextArea';
import { useCurrentUser } from '../../data/useCurrentUser';
import { EscKeyCodes } from '../../const';
import { kebabCase } from 'lodash-es';
import { sortObject } from '../../utils/object';
import { commonMessages } from '../../const/translations';
import { getLastItem } from '../../utils/string';
import { AppendixContext } from '../../data/providers/AppendixProvider';
import { useAppendixValidatorsAction } from '../../data/appendices';

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

export const ValidationAppendixModal = ({
  setValidationModalOpen,
  isValidationModalOpen,
}: {
  setValidationModalOpen: Function;
  isValidationModalOpen: boolean;
}) => {
  const intl = useIntl();
  const requestValidationMutation = useRequestAppendixValidationAction();
  const [validators, setValidators] = useState<boolean>(false);

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
  const { appendix, setAppendix } = useContext(AppendixContext);

  const closeModal = () => {
    setValidationModalOpen(false);
    setMessageContent('');
    setErrorMessage('');
    setSelectedOptions([]);
  };

  useEffect(() => {
    if (isValidationModalOpen && validatorsMutation.isIdle) {
      validatorsMutation.mutate({ appendix });
    }
  }, [isValidationModalOpen]);

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

  const submitForm = (appendix: ReferralReportAppendix) => {
    if (selectedOptions.length === 0) {
      setErrorMessage(
        "Veuillez choisir un ou plusieurs validateurs avant d'envoyer votre demande",
      );
      return 0;
    }

    requestValidationMutation.mutate(
      {
        selectedOptions,
        appendix: appendix.id,
        comment: messageContent,
      },
      {
        onSuccess: (data: RequestValidationResponse) => {
          setAppendix(
            data.report.appendices.find(
              (reportAppendix) => appendix.id === reportAppendix.id,
            ),
          );
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

  const handleKeyDown = (event: KeyboardEvent) => {
    const key = event.key || event.keyCode;

    if (EscKeyCodes.includes(key)) {
      event.preventDefault();
      closeModal();
    }
  };

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown, false);

    return () => {
      document.removeEventListener('keydown', handleKeyDown, false);
    };
  }, [handleKeyDown]);

  const { ref } = useClickOutside({
    onClick: () => {
      closeModal();
    },
  });

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
      {referral && appendix && currentUser && (
        <div
          className={`${
            isValidationModalOpen ? 'fixed' : 'hidden'
          } bg-gray-transparent-70p inset-0 z-19 flex justify-center items-center`}
          style={{ margin: 0 }}
        >
          <div
            ref={ref}
            className={`${
              isValidationModalOpen ? 'fixed' : 'hidden'
            } z-20 flex flex-col w-full max-w-480 rounded-sm bg-white shadow-2xl`}
            style={{
              maxHeight: '90%',
              margin: 0,
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
            }}
          >
            <div className="flex w-full items-center justify-center absolute top-0 z-20 bg-warning-200 p-2">
              <FormattedMessage {...messages.mainTitle} />
            </div>
            <div className="flex flex-col flex-grow p-2 space-y-6 overflow-y-auto my-10">
              <div className="space-y-2">
                <div className="flex flex-col">
                  <h3>
                    <FormattedMessage {...messages.chooseValidatorsTitle} />
                  </h3>
                  <p className="text-sm text-gray-500">
                    <FormattedMessage
                      {...messages.chooseValidatorsDescription}
                    />
                  </p>
                </div>
                <div>
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
                                  aria-selected={isOptionSelected(
                                    role,
                                    unitName,
                                  )}
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
                                    aria-checked={isOptionSelected(
                                      role,
                                      unitName,
                                    )}
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
              </div>
              <div className="flex flex-col flex-grow">
                <h3>
                  <FormattedMessage {...messages.addComment} />
                </h3>
                <p className="text-sm text-gray-500">
                  <FormattedMessage {...messages.addCommentDescription} />
                </p>
                <div className="border border-gray-300 p-2">
                  <TextArea
                    focus={false}
                    messageContent={messageContent}
                    onChange={(value: string) => setMessageContent(value)}
                    customCss={{
                      container: '',
                      carbonCopy: {
                        height: '10rem',
                      },
                    }}
                  />
                </div>
              </div>
              <span
                className="absolute text-danger-500 text-sm"
                style={{ bottom: '50px' }}
              >
                {errorMessage}
              </span>
            </div>
            <div className="flex w-full justify-between z-20 absolute bottom-0 bg-white p-2">
              <button
                className="hover:underline"
                onClick={() => setValidationModalOpen(false)}
              >
                <FormattedMessage {...messages.cancel} />
              </button>
              <IconTextButton
                otherClasses="btn-warning"
                type={'submit'}
                icon={<ValidationIcon className="fill-black" />}
                onClick={() => submitForm(appendix)}
                text={intl.formatMessage(messages.requestValidation)}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};
