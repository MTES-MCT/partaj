import React from 'react';

interface AddUserFormProps {
  children: any;
}

export const AddUserForm: React.FC<AddUserFormProps> = ({ children }) => {
  return (
    <form className="space-y-4">
      <div className="relative">{children}</div>
    </form>
  );
};
