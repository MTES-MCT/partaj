import { defineMessages, FormattedMessage } from 'react-intl';
import { useMutation } from 'react-query';

import React, { useEffect, useState } from 'react';
import {
  DOMElementPosition,
  Message,
  ReferralLite,
  ReferralUserAction,
} from '../../types';
import { Nullable } from '../../types/utils';
import { useClickOutside } from '../../utils/useClickOutside';
import { appData } from '../../appData';
import { Spinner } from '../Spinner';

const messages = defineMessages({
  cancel: {
    defaultMessage: 'Cancel',
    description: 'Cancel button text',
    id: 'components.SubscribeModal.cancel',
  },
});

const RadioButton = ({ active }: { active: boolean }) => {
  return (
    <div className="rounded-full w-3 h-3 p-0.5 border border-primary-500">
      <div
        className={`rounded-full w-full h-full ${
          active ? 'radio-active' : 'radio-inactive'
        }`}
      ></div>
    </div>
  );
};

export const APIRadioModal = ({
  referral,
  path,
  showModal,
  closeModal,
  onSuccess,
  onChange,
  title,
  items,
  value,
  maxWidth = 'max-w-sm',
  position = { top: 0, right: 0 },
  modalRef,
}: {
  path: string;
  referral: ReferralLite;
  showModal: boolean;
  closeModal: Function;
  onSuccess: Function;
  onChange: Function;
  title: Message;
  value: Nullable<string>;
  items: Array<any>;
  maxWidth?: string;
  position?: DOMElementPosition;
  modalRef?: any;
}) => {
  type UserActionParams = {
    action: ReferralUserAction;
    payload: any;
  };

  const [selectedOption, setSelectedOption] = useState<number>(-1);

  const userAction = async (params: UserActionParams) => {
    const response = await fetch(`/api/${path}${params.action}/`, {
      headers: {
        Authorization: `Token ${appData.token}`,
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify({
        ...params.payload,
      }),
    });

    if (!response.ok) {
      throw new Error(
        `Failed to call user API for referral action ${params.action}`,
      );
    }
    return await response.json();
  };

  const mutation = useMutation(
    (params: UserActionParams) => userAction(params),
    {
      onSuccess: (data, variables, context) => {
        onSuccess(data);
      },
      onError: (e) => {
        closeModal();
      },
    },
  );

  const handleKeyDown = (event: KeyboardEvent) => {
    if (showModal) {
      const key = event.key;
      switch (key) {
        case 'Esc':
        case 'Escape':
          event.preventDefault();
          setSelectedOption(-1);
          closeModal();
          break;
        case 'Enter':
          event.preventDefault();
          if (items[selectedOption] && items[selectedOption].value != value) {
            onChange(items[selectedOption].value);
            mutation.mutate(items[selectedOption], {
              onSuccess: () => {
                setSelectedOption(-1);
              },
            });
          }
          // if focus is on cancel button keep default behavior
          break;
        case 'ArrowUp':
          event.preventDefault();
          setSelectedOption((prevState) => {
            return prevState - 1 >= 0 ? prevState - 1 : items.length - 1;
          });
          break;
        case 'ArrowDown':
          event.preventDefault();
          setSelectedOption((prevState) => {
            return prevState == items.length - 1 ? 0 : prevState + 1;
          });
          break;
        default:
          break;
      }
    }
  };

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown, false);

    return () => {
      document.removeEventListener('keydown', handleKeyDown, false);
    };
  }, [handleKeyDown]);

  const { ref } = useClickOutside({
    ref: modalRef,
    onClick: () => {
      showModal && setSelectedOption(-1);
      showModal && closeModal();
    },
  });

  useEffect(() => {
    if (showModal) {
      (ref.current! as HTMLElement).focus();
    }
  }, [showModal]);

  return (
    <>
      {referral && (
        <div
          ref={ref}
          tabIndex={-1}
          onClick={(e) => {
            /* stopPropagation is used to avoid redirection if the button is nested inside a link */
            e.stopPropagation();
          }}
          className={`${
            showModal ? 'block' : 'hidden'
          } flex flex-col border fixed z-30 bg-white shadow-2xl rounded ${maxWidth}`}
          style={position}
        >
          <div className="flex justify-between items-center p-2 cursor-default">
            <span className="modal-title whitespace-nowrap hover:cursor-default">
              <FormattedMessage {...title} />
            </span>
            <button
              type="button"
              className="text-sm hover:underline"
              onClick={() => closeModal()}
              tabIndex={0}
            >
              <FormattedMessage {...messages.cancel} />
            </button>
          </div>
          <div role="listbox" className="flex flex-col modal-item-list">
            {items.map((item, index) => (
              <div
                key={`key-${item.name}`}
                role="option"
                tabIndex={0}
                aria-selected={index === selectedOption}
                aria-describedby={`description-${item.name}`}
                aria-labelledby={`label-${item.name}`}
                className={`p-1 border-t cursor-pointer ${
                  item.value === value ? 'bg-primary-50' : ''
                }`}
                onFocus={() => setSelectedOption(index)}
                onMouseEnter={() => setSelectedOption(index)}
                onMouseLeave={() => setSelectedOption(-1)}
                onClick={() => {
                  onChange(item.value);
                  mutation.mutate(item, {
                    onSuccess: () => {
                      setSelectedOption(-1);
                    },
                  });
                }}
              >
                <div className="flex p-1 rounded">
                  {value === item.value && mutation.isLoading ? (
                    <div className="flex items-center w-4">
                      <Spinner
                        size="small"
                        color="#8080D1"
                        className="inset-0"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center w-4">
                      <RadioButton active={value === item.value} />
                    </div>
                  )}
                  <div className="flex p-1">{item.icon}</div>
                  <div className="flex flex-col">
                    <div
                      id={`label-${item.name}`}
                      className="text-base text-primary-700"
                    >
                      {item.title}
                    </div>
                    <div
                      id={`description-${item.name}`}
                      className="text-sm text-gray-500"
                    >
                      {item.description}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
};
