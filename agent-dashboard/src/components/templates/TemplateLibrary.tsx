import React, { useState, useEffect } from 'react';
import { TemplateCard } from './TemplateCard';
import { TemplateEditor } from './TemplateEditor';
import { TemplateSearch } from './TemplateSearch';
import { notificationService } from '../../services/notificationService';
import { apiService } from '../../services/api';

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

interface TemplateLibraryProps {
  onTemplateSelect?: (template: Template) => void;
  isModal?: boolean;
  onClose?: () => void;
  activeTicketId?: string | null;
}

export const TemplateLibrary: React.FC<TemplateLibraryProps> = ({ 
  onTemplateSelect, 
  isModal = false, 
  onClose,
  activeTicketId 
}) => {
  console.log('🎯 TemplateLibrary component mounted');
  
  const [templates, setTemplates] = useState<Template[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<Template[]>([]);
  const [showEditor, setShowEditor] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showPersonalOnly, setShowPersonalOnly] = useState(false);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // Load templates from database
  useEffect(() => {
    console.log('🔄 useEffect running - fetching templates');
    
    const fetchTemplates = async () => {
      try {
        console.log('📡 apiService:', apiService);
        console.log('📡 getTemplates function:', apiService.getTemplates);
        
        console.log('🔄 Fetching templates from API...');
        const response = await apiService.getTemplates();
        console.log('✅ Templates API response:', JSON.stringify(response, null, 2));
        console.log('✅ response.data:', response.data);
        console.log('✅ response.data.templates:', response.data.templates);

        if (response.success && response.data.templates) {
          // Transform database templates to frontend format
          const dbTemplates = response.data.templates.map((template: any) => ({
            id: template._id,
            title: template.title,
            content: template.content,
            category: template.category.toLowerCase(),
            tags: template.tags || [],
            isPersonal: !template.isShared,
            usageCount: template.usageCount || 0,
            lastUsed: template.lastUsedAt ? new Date(template.lastUsedAt) : undefined,
            createdBy: template.isShared ? 'System' : 'Personal',
            createdAt: new Date(template.createdAt),
            shortcut: template.shortcut,
            isFavorite: false // TODO: Add favorites to database model
          }));

          console.log(`✅ Loaded ${dbTemplates.length} templates from database`);
          setTemplates(dbTemplates);
          setFilteredTemplates(dbTemplates);
        } else {
          console.warn('⚠️ No templates found in API response, using fallback');
          loadFallbackTemplates();
        }
      } catch (error) {
        console.error('❌ Failed to fetch templates from API:', error);
        console.log('🔄 Loading fallback templates...');
        loadFallbackTemplates();
      }
    };

    const loadFallbackTemplates = () => {
      // Fallback templates if API fails
      const fallbackTemplates: Template[] = [
        {
          id: 'fallback-1',
          title: 'Welcome Greeting',
          content: 'Hello {{customerName}}! Thank you for contacting us. I\'m {{agentName}} and I\'ll be happy to help you today. How can I assist you?',
          category: 'greetings',
          tags: ['welcome', 'greeting', 'introduction'],
          isPersonal: false,
          usageCount: 0,
          createdBy: 'System',
          createdAt: new Date(),
          shortcut: '/welcome',
          isFavorite: true
        },
        {
          id: 'fallback-2',
          title: 'Technical Issue Investigation',
          content: 'I understand you\'re experiencing a technical issue. Let me investigate this for you. Could you please provide me with:\n\n1. What exactly happened?\n2. When did this issue start?\n3. Have you tried any troubleshooting steps?\n\nThis information will help me assist you better.',
          category: 'technical',
          tags: ['technical', 'investigation', 'troubleshooting'],
          isPersonal: false,
          usageCount: 0,
          createdBy: 'System',
          createdAt: new Date(),
          shortcut: '/tech',
          isFavorite: false
        }
      ];

      setTemplates(fallbackTemplates);
      setFilteredTemplates(fallbackTemplates);
    };

    fetchTemplates();
  }, []);

  // Filter templates based on search and filters
  useEffect(() => {
    let filtered = templates;

    // Favorites filter (applied first for priority)
    if (showFavoritesOnly) {
      filtered = filtered.filter(template => template.isFavorite);
    }

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(template => 
        template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(template => template.category === selectedCategory);
    }

    // Personal filter
    if (showPersonalOnly) {
      filtered = filtered.filter(template => template.isPersonal);
    }

    // Sort by favorites first, then usage count and last used
    filtered.sort((a, b) => {
      // Favorites first
      if (a.isFavorite && !b.isFavorite) return -1;
      if (!a.isFavorite && b.isFavorite) return 1;
      
      // Then by usage count
      if (a.usageCount !== b.usageCount) {
        return b.usageCount - a.usageCount;
      }
      
      // Finally by last used
      if (a.lastUsed && b.lastUsed) {
        return b.lastUsed.getTime() - a.lastUsed.getTime();
      }
      return 0;
    });

    setFilteredTemplates(filtered);
  }, [templates, searchQuery, selectedCategory, showPersonalOnly, showFavoritesOnly]);

  const handleCreateTemplate = () => {
    setEditingTemplate(null);
    setShowEditor(true);
  };

  const handleEditTemplate = (template: Template) => {
    setEditingTemplate(template);
    setShowEditor(true);
  };

  const handleSaveTemplate = (templateData: Partial<Template>) => {
    if (editingTemplate) {
      // Update existing template
      setTemplates(prev => prev.map(t => 
        t.id === editingTemplate.id 
          ? { ...t, ...templateData, lastUsed: new Date() }
          : t
      ));
    } else {
      // Create new template
      const newTemplate: Template = {
        id: `template-${Date.now()}`,
        title: templateData.title || '',
        content: templateData.content || '',
        category: templateData.category || 'general',
        tags: templateData.tags || [],
        isPersonal: templateData.isPersonal || true,
        usageCount: 0,
        createdBy: 'Current Agent',
        createdAt: new Date(),
        shortcut: templateData.shortcut,
        isFavorite: false
      };
      setTemplates(prev => [...prev, newTemplate]);
    }
    setShowEditor(false);
    setEditingTemplate(null);
  };

  const handleDeleteTemplate = (templateId: string) => {
    if (confirm('Are you sure you want to delete this template?')) {
      setTemplates(prev => prev.filter(t => t.id !== templateId));
    }
  };

  const handleToggleFavorite = (templateId: string) => {
    setTemplates(prev => prev.map(t => 
      t.id === templateId 
        ? { ...t, isFavorite: !t.isFavorite }
        : t
    ));
  };

  const handleCopyTemplate = async (template: Template) => {
    try {
      await navigator.clipboard.writeText(template.content);
      notificationService.showNotification({
        title: 'Template Copied',
        body: `"${template.title}" copied to clipboard`,
        priority: 'normal',
        sound: false
      });
    } catch (error) {
      console.error('Failed to copy template:', error);
      notificationService.showNotification({
        title: 'Copy Failed',
        body: 'Failed to copy template to clipboard',
        priority: 'high',
        sound: false
      });
    }
  };

  const handleUseTemplate = async (template: Template) => {
    // Check if there's an active chat
    if (!activeTicketId && !isModal) {
      notificationService.showNotification({
        title: 'No Active Chat',
        body: 'Please open a chat first to use templates',
        priority: 'high',
        sound: false
      });
      return;
    }

    // Update usage count locally for immediate UI feedback
    setTemplates(prev => prev.map(t => 
      t.id === template.id 
        ? { ...t, usageCount: t.usageCount + 1, lastUsed: new Date() }
        : t
    ));

    // Track usage in database (don't block UI on this)
    if (!template.id.startsWith('fallback-')) {
      try {
        await apiService.updateTemplateUsage(template.id);
        console.log(`✅ Template usage tracked for: ${template.title}`);
      } catch (error) {
        console.warn('⚠️ Failed to track template usage:', error);
        // Don't show error to user, this is non-critical
      }
    }

    if (onTemplateSelect) {
      onTemplateSelect(template);
    }

    if (isModal && onClose) {
      onClose();
    }

    // Show success notification
    notificationService.showNotification({
      title: 'Template Inserted',
      body: `"${template.title}" has been inserted into the chat`,
      priority: 'normal',
      sound: false
    });
  };

  const handlePreviewAndCustomize = (template: Template) => {
    // For modal usage, allow customization before sending
    if (isModal && onTemplateSelect) {
      // Create a customizable version
      const customizableTemplate = { ...template };
      onTemplateSelect(customizableTemplate);
    } else {
      handleUseTemplate(template);
    }
  };

  const categories = ['all', 'greetings', 'technical', 'billing', 'closing', 'escalation', 'general'];

  return (
    <div className={`${isModal ? 'bg-white dark:bg-gray-800 rounded-lg shadow-xl' : 'bg-gray-50 dark:bg-gray-900'} h-full flex flex-col`}>
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Template Library</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {filteredTemplates.length} templates available
              {activeTicketId && (
                <span className="ml-2 px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 text-xs rounded-full">
                  Active Chat: {activeTicketId.slice(-6)}
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleCreateTemplate}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Template
            </button>
            
            {/* Temporary seed button - remove after use */}
            <button
              onClick={async () => {
                try {
                  console.log('🌱 Seeding templates...');
                  const response = await apiService.post('/agent/templates/seed');
                  console.log('✅ Seed response:', response.data);
                  
                  if (response.data.success) {
                    notificationService.showNotification({
                      title: 'Templates Seeded',
                      body: response.data.message,
                      priority: 'normal',
                      sound: false
                    });
                    
                    // Refresh templates
                    const fetchResponse = await apiService.getTemplates();
                    if (fetchResponse.success && fetchResponse.data.templates) {
                      const dbTemplates = fetchResponse.data.templates.map((template: any) => ({
                        id: template._id,
                        title: template.title,
                        content: template.content,
                        category: template.category.toLowerCase(),
                        tags: template.tags || [],
                        isPersonal: !template.isShared,
                        usageCount: template.usageCount || 0,
                        lastUsed: template.lastUsedAt ? new Date(template.lastUsedAt) : undefined,
                        createdBy: template.isShared ? 'System' : 'Personal',
                        createdAt: new Date(template.createdAt),
                        shortcut: template.shortcut,
                        isFavorite: false
                      }));
                      setTemplates(dbTemplates);
                      setFilteredTemplates(dbTemplates);
                    }
                  } else {
                    notificationService.showNotification({
                      title: 'Templates Already Exist',
                      body: response.data.message,
                      priority: 'normal',
                      sound: false
                    });
                  }
                } catch (error: any) {
                  console.error('❌ Seed error:', error);
                  notificationService.showNotification({
                    title: 'Seed Failed',
                    body: error.response?.data?.message || 'Failed to seed templates',
                    priority: 'urgent',
                    sound: false
                  });
                }
              }}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
            >
              🌱 Seed Templates
            </button>
            
            {isModal && onClose && (
              <button
                onClick={onClose}
                className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <TemplateSearch
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          categories={categories}
          showPersonalOnly={showPersonalOnly}
          onPersonalToggle={setShowPersonalOnly}
          showFavoritesOnly={showFavoritesOnly}
          onFavoritesToggle={setShowFavoritesOnly}
        />
      </div>

      {/* Templates Grid */}
      <div className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-gray-900">
        {filteredTemplates.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 dark:text-gray-600 text-6xl mb-4">📝</div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No templates found</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {searchQuery || selectedCategory !== 'all' || showPersonalOnly || showFavoritesOnly
                ? 'Try adjusting your search or filters'
                : 'Create your first template to get started'
              }
            </p>
            <button
              onClick={handleCreateTemplate}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Template
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onUse={() => handlePreviewAndCustomize(template)}
                onEdit={() => handleEditTemplate(template)}
                onDelete={() => handleDeleteTemplate(template.id)}
                onToggleFavorite={() => handleToggleFavorite(template.id)}
                onCopy={() => handleCopyTemplate(template)}
                hasActiveChat={!!activeTicketId}
              />
            ))}
          </div>
        )}
      </div>

      {/* Template Editor Modal */}
      {showEditor && (
        <TemplateEditor
          template={editingTemplate}
          onSave={handleSaveTemplate}
          onCancel={() => {
            setShowEditor(false);
            setEditingTemplate(null);
          }}
        />
      )}
    </div>
  );
};