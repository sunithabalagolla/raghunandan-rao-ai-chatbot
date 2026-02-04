require('dotenv').config();
const mongoose = require('mongoose');
const CannedResponse = require('../dist/shared/models/CannedResponse.model').default;

// Connect to MongoDB
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ppc-chatbot';
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Sample templates to seed
const sampleTemplates = [
  {
    title: 'Welcome Greeting',
    content: 'Hello {{customerName}}! Thank you for contacting us. I\'m {{agentName}} and I\'ll be happy to help you today. How can I assist you?',
    category: 'Greeting',
    language: 'en',
    isShared: true,
    tags: ['welcome', 'greeting', 'introduction'],
    isActive: true,
    usageCount: 0
  },
  {
    title: 'Technical Issue Investigation',
    content: 'I understand you\'re experiencing a technical issue. Let me investigate this for you. Could you please provide me with:\n\n1. What exactly happened?\n2. When did this issue start?\n3. Have you tried any troubleshooting steps?\n\nThis information will help me assist you better.',
    category: 'General',
    language: 'en',
    isShared: true,
    tags: ['technical', 'investigation', 'troubleshooting'],
    isActive: true,
    usageCount: 0
  },
  {
    title: 'Billing Inquiry Response',
    content: 'Thank you for your billing inquiry. I\'ll be happy to help you with this. For security purposes, I\'ll need to verify your account information first. Could you please provide:\n\n- Your account number or email address\n- The last 4 digits of the payment method on file\n\nOnce verified, I can review your billing details.',
    category: 'General',
    language: 'en',
    isShared: true,
    tags: ['billing', 'verification', 'security'],
    isActive: true,
    usageCount: 0
  },
  {
    title: 'Closing Message',
    content: 'Thank you for choosing our service, {{customerName}}! I\'m glad I could help resolve your {{issueType}} today. If you have any other questions, please don\'t hesitate to reach out. Have a wonderful day! 😊',
    category: 'Closing',
    language: 'en',
    isShared: true,
    tags: ['closing', 'friendly', 'resolution'],
    isActive: true,
    usageCount: 0
  },
  {
    title: 'Escalation Notice',
    content: 'I understand this is a complex issue that requires additional expertise. I\'m going to escalate your case to our specialized team who will be better equipped to help you. They will contact you within {{timeframe}} with a resolution. Your case reference number is {{caseNumber}}.',
    category: 'General',
    language: 'en',
    isShared: true,
    tags: ['escalation', 'specialist', 'complex'],
    isActive: true,
    usageCount: 0
  },
  {
    title: 'Please Hold Message',
    content: 'Thank you for your patience, {{customerName}}. I\'m currently looking into this for you. Please give me a moment to review your account and find the best solution.',
    category: 'General',
    language: 'en',
    isShared: true,
    tags: ['hold', 'patience', 'investigation'],
    isActive: true,
    usageCount: 0
  }
];

// Seed templates
const seedTemplates = async () => {
  try {
    // Clear existing templates (optional)
    await CannedResponse.deleteMany({});
    console.log('🗑️ Cleared existing templates');

    // Create a dummy user ID for createdBy field
    const dummyUserId = new mongoose.Types.ObjectId();

    // Add createdBy to all templates
    const templatesWithCreator = sampleTemplates.map(template => ({
      ...template,
      createdBy: dummyUserId
    }));

    // Insert sample templates
    const result = await CannedResponse.insertMany(templatesWithCreator);
    console.log(`✅ Seeded ${result.length} templates successfully`);

    // Display created templates
    result.forEach(template => {
      console.log(`📝 Created: ${template.title} (${template.category})`);
    });

  } catch (error) {
    console.error('❌ Error seeding templates:', error);
  }
};

// Main execution
const main = async () => {
  await connectDB();
  await seedTemplates();
  await mongoose.connection.close();
  console.log('✅ Database connection closed');
  process.exit(0);
};

main();