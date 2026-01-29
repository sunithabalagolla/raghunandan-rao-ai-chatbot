import React, { useState, useEffect } from 'react';
import { TemplateCard } from './TemplateCard';
import { TemplateEditor } from './TemplateEditor';
import { TemplateSearch } from './TemplateSearch';

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
}

interface TemplateLibraryProps {
  onTemplateSelect?: (template: Template) => void;
  isModal?: boolean;
  onClose?: () => void;
}

export const TemplateLibrary: React.FC<TemplateLibraryProps> = ({ 
  onTemplateSelect, 
  isModal = false, 
  onClose 
}) => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<Template[]>([]);
  const [showEditor, setShowEditor] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showPersonalOnly, setShowPersonalOnly] = useState(false);

  // Mock templates data
  useEffect(() => {
    const mockTemplates: Template[] = [
      {
        id: '1',
        title: 'Welcome Greeting',
        content: 'Hello {{customerName}}! Thank you for contacting us. I\'m {{agentName}} and I\'ll be happy to help you today. How can I assist you?',
        category: 'greetings',
        tags: ['welcome', 'greeting', 'introduction'],
        isPersonal: false,
        usageCount: 45,
        lastUsed: new Date(Date.now() - 2 * 60 * 60 * 1000),
        createdBy: 'System',
        createdAt: new Date('2024-01-01'),
        shortcut: '/welcome'
      },
      {
        id: '2',
        title: 'Technical Issue Investigation',
        content: 'I understand you\'re experiencing a technical issue. Let me investigate this for you. Could you please provide me with:\n\n1. What exactly happened?\n2. When did this issue start?\n3. Have you tried any troubleshooting steps?\n\nThis information will help me assist you better.',
        category: 'technical',
        tags: ['technical', 'investigation', 'troubleshooting'],
        isPersonal: false,
        usageCount: 32,
        lastUsed: new Date(Date.now() - 1 * 60 * 60 * 1000),
        createdBy: 'System',
        createdAt: new Date('2024-01-01'),
        shortcut: '/tech'
      },
      {
        id: '3',
        title: 'Billing Inquiry Response',
        content: 'Thank you for your billing inquiry. I\'ll be happy to help you with this. For security purposes, I\'ll need to verify your account information first. Could you please provide:\n\n- Your account number or email address\n- The last 4 digits of the payment method on file\n\nOnce verified, I can review your billing details.',
        category: 'billing',
        tags: ['billing', 'verification', 'security'],
        isPersonal: false,
        usageCount: 28,
        createdBy: 'System',
        createdAt: new Date('2024-01-01'),
        shortcut: '/billing'
      },
      {
        id: '4',
        title: 'My Personal Closing',
        content: 'Thank you for choosing our service, {{customerName}}! I\'m glad I could help resolve your {{issueType}} today. If you have any other questions, please don\'t hesitate to reach out. Have a wonderful day! 😊',
        category: 'closing',
        tags: ['closing', 'personal', 'friendly'],
        isPersonal: true,
        usageCount: 15,
        lastUsed: new Date(Date.now() - 30 * 60 * 1000),
        createdBy: 'Current Agent',
        createdAt: new Date('2024-02-15'),
        shortcut: '/myclose'
      },
      {
        id: '5',
        title: 'Escalation Notice',
        content: 'I understand this is a complex issue that requires additional expertise. I\'m going to escalate your case to our specialized team who will be better equipped to help you. They will contact you within {{timeframe}} with a resolution. Your case reference number is {{caseNumber}}.',
        category: 'escalation',
        tags: ['escalation', 'specialist', 'complex'],
        isPersonal: false,
        usageCount: 12,
        createdBy: 'System',
        createdAt: new Date('2024-01-01'),
        shortcut: '/escalate'
      }
    ];

    setTemplates(mockTemplates);
    setFilteredTemplates(mockTemplates);
  }, []);

  // Filter templates based on search and filters
  useEffect(() => {
    let filtered = templates;

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

    // Sort by usage count and last used
    filtered.sort((a, b) => {
      if (a.usageCount !== b.usageCount) {
        return b.usageCount - a.usageCount;
      }
      if (a.lastUsed && b.lastUsed) {
        return b.lastUsed.getTime() - a.lastUsed.getTime();
      }
      return 0;
    });

    setFilteredTemplates(filtered);
  }, [templates, searchQuery, selectedCategory, showPersonalOnly]);

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
        shortcut: templateData.shortcut
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

  const handleUseTemplate = (template: Template) => {
    // Update usage count
    setTemplates(prev => prev.map(t => 
      t.id === template.id 
        ? { ...t, usageCount: t.usageCount + 1, lastUsed: new Date() }
        : t
    ));

    if (onTemplateSelect) {
      onTemplateSelect(template);
    }

    if (isModal && onClose) {
      onClose();
    }
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
    <div className={`${isModal ? 'bg-white rounded-lg shadow-xl' : 'bg-gray-50'} h-full flex flex-col`}>
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Template Library</h2>
            <p className="text-sm text-gray-500 mt-1">
              {filteredTemplates.length} templates available
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleCreateTemplate}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Template
            </button>
            {isModal && onClose && (
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
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
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <TemplateSearch
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          categories={categories}
          showPersonalOnly={showPersonalOnly}
          onPersonalToggle={setShowPersonalOnly}
        />
      </div>

      {/* Templates Grid */}
      <div className="flex-1 overflow-y-auto p-6">
        {filteredTemplates.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📝</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
            <p className="text-gray-500 mb-4">
              {searchQuery || selectedCategory !== 'all' || showPersonalOnly
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