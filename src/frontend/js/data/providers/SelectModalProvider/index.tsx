import React, {
  createContext,
  ReactNode,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useClickOutside } from '../../../utils/useClickOutside';
import { SelectOption } from '../../../components/select/SelectableList';

export const SelectModalContext = createContext<{
  ref: any;
  selectableListRef: any;
  onSelectedItemChange: Function;
  handleListKeyDown: React.KeyboardEventHandler<HTMLDivElement>;
  onItemHover: Function;
  onSelect: Function;
  selectedOption: { index: number; action: string };
  options: Array<SelectOption>;
}>({
  ref: null,
  selectableListRef: null,
  onSelectedItemChange: () => {},
  handleListKeyDown: () => {},
  onItemHover: () => {},
  onSelect: () => {},
  selectedOption: { index: 0, action: 'Auto' },
  options: [],
});

export const SelectModalProvider = ({
  children,
  closeModal,
  onSelect,
  currentOptions,
}: {
  children: ReactNode;
  closeModal: Function;
  onSelect: Function;
  currentOptions: Array<SelectOption>;
}) => {
  const { ref } = useClickOutside({
    onClick: () => {
      closeModal();
    },
  });

  const selectableListRef = useRef<HTMLDivElement>(null);

  const [options, setOptions] = useState<Array<SelectOption>>(currentOptions);
  const [selectedOption, setSelectedOption] = useState<{
    index: number;
    action: string;
  }>({
    index: 0,
    action: 'AUTO',
  });

  const handleListKeyDown = (e: any) => {
    switch (e.key) {
      case 'Enter':
        e.preventDefault();
        onSelect(options[selectedOption.index].id);
        closeModal();

        break;
      case 'ArrowUp':
        e.preventDefault();
        options.length > 0 &&
          setSelectedOption((prevState: any) => {
            return {
              index:
                prevState.index - 1 >= 0
                  ? prevState.index - 1
                  : options.length - 1,
              action: 'ArrowUp',
            };
          });
        break;
      case 'ArrowDown':
        e.preventDefault();
        options.length > 0 &&
          setSelectedOption((prevState) => {
            return {
              index:
                prevState.index == options.length - 1 ? 0 : prevState.index + 1,
              action: 'ArrowDown',
            };
          });
        break;
      case 'Esc':
      case 'Escape':
      case 27:
        e.preventDefault();
        closeModal();
        break;
      default:
        break;
    }
  };

  const getOptionIndex = (currentOption: SelectOption) => {
    return options.findIndex((option) => option.id === currentOption.id);
  };

  const onItemHover = (option: SelectOption) => {
    setSelectedOption({
      index: getOptionIndex(option),
      action: 'Hover',
    });
  };

  useEffect(() => {
    if (options.length > 0) {
      setSelectedOption({
        index: 0,
        action: 'ArrowUp',
      });
    }
  }, [options]);

  const onSelectedItemChange = (selectedItemRef: any) => {
    const modalHeight = selectableListRef.current?.offsetHeight ?? 0;
    const itemTop = selectedItemRef.current.offsetTop;
    const itemHeight = selectedItemRef.current.offsetHeight;
    const modalScroll = selectableListRef.current?.scrollTop ?? 0;

    if (itemTop < modalScroll) {
      selectableListRef.current?.scrollTo(0, itemTop);
    } else if (itemTop + itemHeight - modalScroll > modalHeight) {
      const scrollDown = itemTop + itemHeight - modalHeight;
      selectableListRef.current?.scrollTo(0, scrollDown);
    }
  };

  useEffect(() => {
    if (options.length > 0) {
      setSelectedOption({
        index: 0,
        action: 'ArrowUp',
      });
    }
  }, [options]);

  const { Provider } = SelectModalContext;

  return (
    <Provider
      value={{
        ref,
        selectableListRef,
        onSelectedItemChange,
        handleListKeyDown,
        onItemHover,
        onSelect,
        selectedOption,
        options,
      }}
    >
      {children}
    </Provider>
  );
};
