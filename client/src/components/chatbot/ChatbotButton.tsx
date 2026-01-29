interface ChatbotButtonProps {
  onClick: () => void;
}

export const ChatbotButton = ({ onClick }: ChatbotButtonProps) => {
  return (
    <button
      onClick={onClick}
      className="chatbot-floating-button"
    >
      <svg style={{ width: '28px', height: '28px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
      </svg>
    </button>
  );
};
