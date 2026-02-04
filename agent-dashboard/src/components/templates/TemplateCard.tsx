import React from 'react';

interface Template {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  isPersonal: boolean;
  usageCount: number;
  lastUsed?: Date;
  createdBy: string;
  createdAt: Date;
  shortcut?: string;
  isFavorite?: boolean;
}

interface TemplateCardProps {
  template: Template;
  onUse: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggleFavorite: () => void;
  onCopy: () => void;
  hasActiveChat: boolean;
}

export const TemplateCard: React.FC<TemplateCardProps> = ({ 
  template, 
  onUse, 
  onEdit, 
  onDelete,
  onToggleFavorite,
  onCopy,
  hasActiveChat
}) => {
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'greetings':
        return 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300';
      case 'technical':
        return 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300';
      case 'billing':
        return 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300';
      case 'closing':
        return 'bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300';
      case 'escalation':
        return 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300';
    }
  };

  const formatLastUsed = (date?: Date) => {
    if (!date) return 'Never used';
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else {
      return `${diffDays}d ago`;
    }
  };

  const truncateContent = (content: string, maxLength: number = 120) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-all duration-200 ${template.isFavorite ? 'ring-2 ring-yellow-200 dark:ring-yellow-600' : ''}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
              {template.title}
            </h3>
            {template.isFavorite && (
              <span className="text-yellow-500" title="Favorite template">
                ⭐
              </span>
            )}
            {template.isPersonal && (
              <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 text-xs rounded-full">
                Personal
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(template.category)}`}>
              {template.category}
            </span>
            {template.shortcut && (
              <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded font-mono">
                {template.shortcut}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-1 ml-2">
          <button
            onClick={onToggleFavorite}
            className={`p-1 rounded ${template.isFavorite ? 'text-yellow-500 hover:text-yellow-600' : 'text-gray-400 dark:text-gray-500 hover:text-yellow-500'}`}
            title={template.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <svg className="w-4 h-4" fill={template.isFavorite ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </button>

          <button
            onClick={onCopy}
            className="p-1 text-gray-400 dark:text-gray-500 hover:text-green-600 dark:hover:text-green-400 rounded"
            title="Copy to clipboard"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>

          <button
            onClick={onEdit}
            className="p-1 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 rounded"
            title="Edit template"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          
          {template.isPersonal && (
            <button
              onClick={onDelete}
              className="p-1 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 rounded"
              title="Delete template"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Content Preview */}
      <div className="mb-4">
        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
          {truncateContent(template.content)}
        </p>
      </div>

      {/* Tags */}
      {template.tags.length > 0 && (
        <div className="mb-4">
          <div className="flex flex-wrap gap-1">
            {template.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded"
              >
                #{tag}
              </span>
            ))}
            {template.tags.length > 3 && (
              <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded">
                +{template.tags.length - 3}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
        <div className="text-xs text-gray-500 dark:text-gray-400">
          <div>Used {template.usageCount} times</div>
          <div>{formatLastUsed(template.lastUsed)}</div>
        </div>

        <div className="flex items-center space-x-2">
          {!hasActiveChat && (
            <div className="text-xs text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 px-2 py-1 rounded">
              No active chat
            </div>
          )}
          <button
            onClick={onUse}
            disabled={!hasActiveChat}
            className={`px-4 py-2 text-sm rounded-lg transition-colors ${
              hasActiveChat 
                ? 'bg-blue-600 text-white hover:bg-blue-700' 
                : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
            }`}
            title={hasActiveChat ? 'Insert into active chat' : 'Open a chat first to use templates'}
          >
            {hasActiveChat ? 'Use Template' : 'No Active Chat'}
          </button>
        </div>
      </div>
    </div>
  );
};