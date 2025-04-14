import React, { useContext, useEffect, useRef, useState } from 'react';
import { DOMElementPosition, Topic } from '../../types';
import { useClickOutside } from '../../utils/useClickOutside';
import { useReferralAction } from '../../data';
import { ArrowDownIcon } from '../Icons';
import { ReferralContext } from '../../data/providers/ReferralProvider';
import { defineMessages, useIntl } from 'react-intl';
import { kebabCase } from 'lodash-es';
import { useReferralTopicsAction } from '../../data/referral';
import { isFieldEmphasized } from '../../utils/referral';
import { getEmphasisStyle } from '../../utils/styles';

const messages = defineMessages({
  topicTooltip: {
    defaultMessage: 'Change topic for everybody',
    description: 'Topic select tooltip text',
    id: 'components.TopicSelect.topicTooltip',
  },
});

export const TopicSelect = () => {
  const intl = useIntl();
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const { referral, setReferral } = useContext(ReferralContext);
  const [selectedOption, setSelectedOption] = useState<number>(0);
  const listRef = useRef(null);
  const [position, setPosition] = useState<DOMElementPosition>({
    top: 0,
    right: 0,
  });
  const [optionList, setOptionList] = useState<Array<Topic>>([]);

  const getSelectedOption = (topicId: string) => {
    for (const [index] of optionList.entries()) {
      if (optionList[index].id === topicId) {
        return { option: optionList[index], index: index };
      }
    }
  };

  const referralMutation = useReferralAction();

  const { ref } = useClickOutside({
    onClick: () => {
      setIsOptionsOpen(false);
    },
    insideRef: listRef,
  });

  const referralTopicsMutation = useReferralTopicsAction({
    onSuccess: (data, variables, context) => {
      setOptionList(data);
    },
  });

  const isClickable = (option: Topic) => {
    return option.is_active && hasUnitInReferral(option.unit);
  };

  const hasUnitInReferral = (id: string) => {
    const units = referral?.units.filter((unit) => unit.id === id);

    return units && units.length > 0;
  };

  useEffect(() => {
    if (referral && optionList.length === 0) {
      referralTopicsMutation.mutate({ referral });
    }

    if (referral && optionList.length > 0) {
      setSelectedOption(
        (getSelectedOption(referral.topic.id)!.index as unknown) as number,
      );
    }
  }, [referral, optionList]);

  const toggleOptions = (buttonRef: any) => {
    setPosition(getPosition(buttonRef));
    setIsOptionsOpen(!isOptionsOpen);
  };

  const setSelectedThenCloseDropdown = (index: any) => {
    setIsOptionsOpen(false);
  };

  const getPosition = (buttonRef: any) => {
    const remainingBottomSpace =
      window.innerHeight - buttonRef.current.getBoundingClientRect().top;
    if (remainingBottomSpace < 250) {
      return {
        bottom:
          window.innerHeight - buttonRef.current.getBoundingClientRect().top,
        right:
          window.innerWidth - buttonRef.current.getBoundingClientRect().right,
      };
    }
    return {
      top: buttonRef.current.getBoundingClientRect().top,
      right:
        window.innerWidth - buttonRef.current.getBoundingClientRect().right,
      marginTop: '28px',
    };
  };

  const handleKeyDown = (index: any) => (e: any) => {
    switch (e.key) {
      case ' ':
      case 'SpaceBar':
      case 'Enter':
        e.preventDefault();
        setSelectedThenCloseDropdown(index);
        break;
      default:
        break;
    }
  };

  const handleListKeyDown = (e: any) => {
    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        setIsOptionsOpen(false);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedOption((prevState) => {
          return prevState - 1 >= 0 ? prevState - 1 : optionList.length - 1;
        });
        break;
      case 'ArrowDown':
        e.preventDefault();
        setSelectedOption((prevState) => {
          return prevState == optionList.length - 1 ? 0 : prevState + 1;
        });
        break;
      default:
        break;
    }
  };

  return (
    <>
      {referral && optionList.length > 0 && (
        <div className="select-container">
          <button
            ref={ref}
            type="button"
            aria-haspopup="listbox"
            aria-expanded={isOptionsOpen}
            className={`tooltip tooltip-action button whitespace-nowrap w-full button-white-grey button-superfit text-base text-black space-x-1 max-w-1/1 ${
              isFieldEmphasized(referral) && getEmphasisStyle()
            }`}
            onClick={() => toggleOptions(ref)}
            onKeyDown={handleListKeyDown}
            data-tooltip={intl.formatMessage(messages.topicTooltip)}
          >
            <span
              className="truncate"
              style={{ width: 'calc(100% - 1.25rem)' }}
            >
              {referral.topic.name}
            </span>
            <ArrowDownIcon className="fill-grey400" />
          </button>
          <ul
            style={{ ...position, zIndex: 20, maxHeight: 240 }}
            className={`fixed overflow-y-scroll select-options shadow-blur bg-white ${
              isOptionsOpen ? 'block' : 'hidden'
            }`}
            role="listbox"
            aria-activedescendant={kebabCase(optionList[selectedOption].name)}
            tabIndex={-1}
            onKeyDown={handleListKeyDown}
            ref={listRef}
          >
            {optionList.map((option, index) => (
              <li
                id={kebabCase(option.name)}
                key={option.id}
                role="option"
                aria-selected={selectedOption == index}
                aria-disabled={!isClickable(option)}
                tabIndex={0}
                onKeyDown={handleKeyDown(index)}
                onClick={() => {
                  if (isClickable(option)) {
                    referralMutation.mutate(
                      {
                        action: 'update_topic',
                        payload: {
                          topic: option.id,
                        },
                        referral,
                      },
                      {
                        onSuccess: (data) => {
                          setReferral(data);
                          setSelectedThenCloseDropdown(index);
                        },
                      },
                    );
                  }
                }}
              >
                {option.name}
              </li>
            ))}
          </ul>

          <div
            className={`${
              isOptionsOpen ? 'fixed' : 'hidden'
            } 'bg-transparent inset-0  z-9 flex justify-center items-center`}
            style={{ margin: 0 }}
          >
            {' '}
          </div>
        </div>
      )}
    </>
  );
};
