const modalHeights = {
  priority: 206,
  role: 250,
  subscription: 291,
};

export const getModalPosition = (
  buttonRef: any,
  modalType: 'role' | 'subscription' | 'priority',
) => {
  const modalHeight = modalHeights[modalType];
  const remainingBottomSpace =
    window.innerHeight - buttonRef.current.getBoundingClientRect().top;
  if (remainingBottomSpace < modalHeight) {
    return {
      marginTop:
        buttonRef.current.getBoundingClientRect().top - modalHeight + 'px',
      marginRight:
        window.innerWidth -
        buttonRef.current.getBoundingClientRect().right +
        'px',
    };
  }
  return {
    marginTop: buttonRef.current.getBoundingClientRect().top + 36 + 'px',
    marginRight:
      window.innerWidth -
      buttonRef.current.getBoundingClientRect().right +
      'px',
  };
};
