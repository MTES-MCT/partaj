import React, { useContext, useEffect, useState } from 'react';
import * as Sentry from '@sentry/react';
import { useClickOutside } from '../../utils/useClickOutside';
import { useRequestValidationAction } from '../../data/reports';
import { defineMessages, FormattedMessage } from 'react-intl';
import { VersionContext } from '../../data/providers/VersionProvider';
import { ReferralContext } from '../../data/providers/ReferralProvider';
import { IconTextButton } from '../buttons/IconTextButton';
import { CheckIcon, ValidationIcon } from '../Icons';
import {
  ReferralReportVersion,
  Unit,
  UnitMember,
  UnitValidators,
} from '../../types';
import { TextArea } from '../inputs/TextArea';
import { useCurrentUser } from '../../data/useCurrentUser';
import { getUserFullname } from '../../utils/user';
import { EscKeyCodes } from '../../const';
import { kebabCase } from "lodash-es";

const messages = defineMessages({
  mainTitle: {
    defaultMessage: 'Validation request',
    description: 'Modal main title',
    id: 'components.ValidationModal.mainTitle',
  },
  cancel: {
    defaultMessage: 'Cancel',
    description: 'Cancel button text',
    id: 'components.ValidationModal.cancel',
  },
  chooseValidatorsTitle: {
    defaultMessage: 'Choose your validators',
    description: 'Choose validators title',
    id: 'components.ValidationModal.chooseValidatorsTitle',
  },
  chooseValidatorsDescription: {
    defaultMessage: 'They will be notified of your request by e-mail',
    description: 'Choose validators description',
    id: 'components.ValidationModal.chooseValidatorsDescription',
  },
  addComment: {
    defaultMessage: 'Add comment to your request (optional)',
    description: 'Add comment text',
    id: 'components.ValidationModal.addComment',
  },
  requestValidation: {
    defaultMessage: 'Request validation',
    description: 'Ask for validation text',
    id: 'components.ValidationModal.requestValidation',
  },
});

interface SelectedOption {
  unitId: string;
  role: 'owner' | 'admin';
}

export const ValidationModal = ({
  setValidationModalOpen,
  isValidationModalOpen,
}: {
  setValidationModalOpen: Function;
  isValidationModalOpen: boolean;
}) => {
  const requestValidationMutation = useRequestValidationAction();
  const [messageContent, setMessageContent] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedOptions, setSelectedOptions] = useState<Array<SelectedOption>>(
    [],
  );
  const { referral } = useContext(ReferralContext);
  const { currentUser } = useCurrentUser();
  const { version, setVersion } = useContext(VersionContext);

  const closeModal = () => {
    setValidationModalOpen(false);
    setMessageContent('');
    setErrorMessage('');
    setSelectedOptions([]);
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
        onSuccess: (data) => {
          setVersion(data);
          closeModal();
        },
        onError: (error) => {
          Sentry.captureException(error);
          setErrorMessage(
            'Une erreur est survenue, veuillez réessayer plus tard',
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

  const isOptionSelected = (role: string, unitId: string) => {
    return (
      selectedOptions.filter(
        (option) => option.unitId === unitId && role === option.role,
      ).length === 1
    );
  };

  const toggleOption = ({ role, unitId }: SelectedOption) => {
    if (errorMessage) {
      setErrorMessage('');
    }

    if (!isOptionSelected(role, unitId)) {
      setSelectedOptions((prevState) => [...prevState, { role, unitId }]);
    } else {
      setSelectedOptions((prevState) => {
        return prevState.filter(
          (option) => option.role !== role || option.unitId !== unitId,
        );
      });
    }
  };

  const validationTree =
    referral &&
    currentUser &&
    referral.units.map((unit: Unit) => {
      const owners = unit.members.filter(
        (member: UnitMember) =>
          member.membership.role === 'owner' && member.id !== currentUser.id,
      );

      if (owners.length > 0) {
        return {
          id: unit.id,
          name: unit.name,
          members: owners.map((member) => getUserFullname(member)),
        };
      }
    });

  return (
    <>
      {referral && version && currentUser && (
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
            } z-20 flex flex-col w-full max-w-480 overflow-hidden rounded-sm bg-white h-560 shadow-2xl`}
            style={{
              margin: 0,
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
            }}
          >
            <div className="flex w-full items-center justify-center sticky top-0 z-20 bg-warning-200 px-2 py-1">
              <FormattedMessage {...messages.mainTitle} />
            </div>
            <div className="flex flex-col flex-grow p-2 space-y-6">
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
                    {validationTree && validationTree.map((unit: UnitValidators | undefined) => {
                      return unit ? (
                        <li
                          id={unit.id}
                          key={unit.id}
                          role="option"
                          className={`flex cursor-pointer items-center text-s p-2 space-x-2 rounded-sm border ${
                            isOptionSelected('owner', unit.id)
                              ? 'border-black'
                              : 'border-gray-200'
                          }`}
                          aria-selected={isOptionSelected('owner', unit.id)}
                          tabIndex={0}
                          onClick={() => {
                            toggleOption({ role: 'owner', unitId: unit.id });
                          }}
                        >
                          <div
                            role="checkbox"
                            aria-checked={isOptionSelected('owner', unit.id)}
                            className={`checkbox`}
                          >
                            <CheckIcon className="fill-black" />
                          </div>
                          <div className="flex flex-col">
                            <p className="text-base font-medium">
                              Chef de bureau {unit.name}
                            </p>
                            <div className="flex items-center justify-start w-full space-x-2">
                              {unit.members.map((member) => (
                                  <div className="space-x-1" key={kebabCase(member)}>
                                    <span>{member}</span>
                                  </div>
                                ))}
                            </div>
                          </div>
                        </li>
                      ) : null;
                    })}
                  </ul>
                </div>
              </div>
              <div className="flex flex-col flex-grow">
                <h3>
                  <FormattedMessage {...messages.addComment} />
                </h3>
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

              <div className="flex w-full justify-between z-20 bg-white">
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
                  onClick={() => submitForm(version)}
                >
                  <FormattedMessage {...messages.requestValidation} />
                </IconTextButton>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
