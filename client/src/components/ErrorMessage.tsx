interface ErrorMessageProps {
  message: string;
  onClose?: () => void;
}

export const ErrorMessage = ({ message, onClose }: ErrorMessageProps) => {
  if (!message) return null;

  return (
    <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md flex justify-between items-center">
      <span>{message}</span>
      {onClose && (
        <button
          onClick={onClose}
          className="text-red-600 hover:text-red-800 font-bold"
        >
          ×
        </button>
      )}
    </div>
  );
};
