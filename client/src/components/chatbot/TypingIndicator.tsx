


export const TypingIndicator = () => {
    return (
        <div className="flex gap-3 mb-4">
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '12px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
            </div>
        </div>
    );
};

