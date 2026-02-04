import React from 'react';

interface TemplateSearchProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  categories: string[];
  showPersonalOnly: boolean;
  onPersonalToggle: (showPersonal: boolean) => void;
  showFavoritesOnly: boolean;
  onFavoritesToggle: (showFavorites: boolean) => void;
}

export const TemplateSearch: React.FC<TemplateSearchProps> = ({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  categories,
  showPersonalOnly,
  onPersonalToggle,
  showFavoritesOnly,
  onFavoritesToggle
}) => {
  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Search templates by title, content, or tags..."
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Category Filter */}
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700">Category:</label>
          <select
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {categories.map(category => (
              <option key={category} value={category}>
                {category === 'all' ? 'All Categories' : category.charAt(0).toUpperCase() + category.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* Favorites Filter */}
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="favoritesOnly"
            checked={showFavoritesOnly}
            onChange={(e) => onFavoritesToggle(e.target.checked)}
            className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded"
          />
          <label htmlFor="favoritesOnly" className="text-sm text-gray-700 flex items-center">
            <span className="mr-1">⭐</span>
            Favorites only
          </label>
        </div>

        {/* Personal Filter */}
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="personalOnly"
            checked={showPersonalOnly}
            onChange={(e) => onPersonalToggle(e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="personalOnly" className="text-sm text-gray-700">
            Personal templates only
          </label>
        </div>

        {/* Clear Filters */}
        {(searchQuery || selectedCategory !== 'all' || showPersonalOnly || showFavoritesOnly) && (
          <button
            onClick={() => {
              onSearchChange('');
              onCategoryChange('all');
              onPersonalToggle(false);
              onFavoritesToggle(false);
            }}
            className="text-sm text-blue-600 hover:text-blue-800 underline"
          >
            Clear all filters
          </button>
        )}
      </div>

      {/* Quick Filter Buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onFavoritesToggle(!showFavoritesOnly)}
          className={`px-3 py-1 text-sm rounded-full transition-colors ${
            showFavoritesOnly 
              ? 'bg-yellow-100 text-yellow-800 border border-yellow-300' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          ⭐ Favorites
        </button>
        
        <button
          onClick={() => onCategoryChange(selectedCategory === 'greetings' ? 'all' : 'greetings')}
          className={`px-3 py-1 text-sm rounded-full transition-colors ${
            selectedCategory === 'greetings' 
              ? 'bg-green-100 text-green-800 border border-green-300' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          👋 Greetings
        </button>
        
        <button
          onClick={() => onCategoryChange(selectedCategory === 'technical' ? 'all' : 'technical')}
          className={`px-3 py-1 text-sm rounded-full transition-colors ${
            selectedCategory === 'technical' 
              ? 'bg-blue-100 text-blue-800 border border-blue-300' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          🔧 Technical
        </button>
        
        <button
          onClick={() => onCategoryChange(selectedCategory === 'closing' ? 'all' : 'closing')}
          className={`px-3 py-1 text-sm rounded-full transition-colors ${
            selectedCategory === 'closing' 
              ? 'bg-purple-100 text-purple-800 border border-purple-300' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          👋 Closing
        </button>
      </div>
    </div>
  );
};