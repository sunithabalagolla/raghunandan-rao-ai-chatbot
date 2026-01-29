import type { Message as MessageType } from "./chatbot.types";

interface MessageProps {
    message: MessageType
}

/**
 * Parse simple markdown to HTML for chat messages
 * Supports: **bold**, *italic*, bullet points, line breaks
 */
const parseMarkdown = (text: string): string => {
    let html = text
        // Escape HTML to prevent XSS
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        // Bold: **text** or __text__
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/__(.+?)__/g, '<strong>$1</strong>')
        // Italic: *text* or _text_ (but not inside words)
        .replace(/(?<!\w)\*([^*]+)\*(?!\w)/g, '<em>$1</em>')
        // Bullet points: * item or - item at start of line
        .replace(/^[\*\-]\s+(.+)$/gm, '<li>$1</li>')
        // Numbered lists: 1. item
        .replace(/^\d+\.\s+(.+)$/gm, '<li>$1</li>')
        // Line breaks
        .replace(/\n/g, '<br/>');
    
    // Wrap consecutive <li> items in <ul>
    html = html.replace(/(<li>.*?<\/li>)(<br\/>)?/g, '$1');
    html = html.replace(/(<li>.*?<\/li>)+/g, '<ul class="chat-list">$&</ul>');
    
    return html;
};

export const Message = ({ message }: MessageProps) => {
    const isBot = message.sender === 'bot';
    
    return (
        <div
            key={message.id}
            className={`flex gap-3 mb-4 ${message.sender === 'user' ? 'flex-row-reverse' : ''}`}
        >
            <div className={`flex-1 ${message.sender === 'user' ? 'flex justify-end' : ''}`}>
                <div
                    style={{
                        display: 'inline-block',
                        borderRadius: '16px',
                        padding: '12px 16px',
                        maxWidth: '85%',
                        backgroundColor: message.sender === 'user' ? '#3B82F6' : '#FFFFFF',
                        color: message.sender === 'user' ? '#FFFFFF' : '#1F2937',
                        boxShadow: message.sender === 'user' ? 'none' : '0 1px 3px rgba(0,0,0,0.1)'
                    }}
                >
                    {isBot ? (
                        <div 
                            style={{ fontSize: '14px', lineHeight: '1.6', margin: 0 }}
                            dangerouslySetInnerHTML={{ __html: parseMarkdown(message.text) }}
                        />
                    ) : (
                        <p style={{ fontSize: '14px', lineHeight: '1.5', margin: 0 }}>{message.text}</p>
                    )}
                </div>
            </div>
            
            {/* Styles for chat list */}
            <style>{`
                .chat-list {
                    margin: 8px 0;
                    padding-left: 0;
                    list-style: none;
                }
                .chat-list li {
                    position: relative;
                    padding-left: 20px;
                    margin-bottom: 6px;
                    line-height: 1.5;
                }
                .chat-list li::before {
                    content: "•";
                    position: absolute;
                    left: 6px;
                    color: #3B82F6;
                    font-weight: bold;
                }
                .chat-list li:last-child {
                    margin-bottom: 0;
                }
            `}</style>
        </div>
    )
}
