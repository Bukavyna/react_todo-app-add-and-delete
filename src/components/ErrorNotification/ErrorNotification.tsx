import React from 'react';

interface ErrorNotificationProps {
  error: string | null;
  onClose: () => void;
}

export const ErrorNotification: React.FC<ErrorNotificationProps> = ({
  error,
  onClose,
}) => {
  {
    /*DON'T use conditional rendering to hide the notification*/
  }

  {
    /* Add the 'hidden' class to hide the message smoothly */
  }

  if (!error) {
    return null;
  }

  return (
    <div
      data-cy="ErrorNotification"
      className={`notification is-danger is-light has-text-weight-normal ${error ? '' : 'hidden'}`}
    >
      {error}
      <button
        data-cy="HideErrorButton"
        type="button"
        className="delete"
        onClick={() => onClose()}
      />
    </div>
  );
};
