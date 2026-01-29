import mongoose from 'mongoose';
import User from '../src/shared/models/User.model';
import Conversation from '../src/shared/models/Conversation.model';
import HandoffTicket from '../src/shared/models/HandoffTicket.model';
import config from '../src/shared/config/env.config';

/**
 * Create multiple test tickets with different priorities and statuses
 */
async function createMultipleTestTickets() {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.mongodbUri);
    console.log('✅ Connected to MongoDB');

    // Find or create test customer
    let testCustomer = await User.findOne({ email: 'customer@test.com' });
    if (!testCustomer) {
      testCustomer = await User.create({
        email: 'customer@test.com',
        firstName: 'Test',
        lastName: 'Customer',
        phoneNumber: '+1234567892',
        authProvider: 'email',
        role: 'user',
        preferredLanguage: 'en'
      });
      console.log('✅ Created test customer');
    }

    // Create multiple test conversations and tickets
    const tickets = [
      {
        reason: 'Emergency: Unable to access pension benefits',
        priority: 5,
        priorityLevel: 'Emergency',
        messages: [
          { role: 'user', content: 'I need urgent help! I cannot access my pension account and I need the money for medical treatment.' },
          { role: 'assistant', content: 'I understand this is urgent. Let me connect you with a human agent who can help you immediately.' }
        ]
      },
      {
        reason: 'High Priority: RTI application rejected',
        priority: 4,
        priorityLevel: 'High',
        messages: [
          { role: 'user', content: 'My RTI application was rejected without proper reason. I need to appeal this decision.' },
          { role: 'assistant', content: 'I can help you understand the RTI appeal process. Let me connect you with our RTI specialist.' }
        ]
      },
      {
        reason: 'Medium Priority: Birth certificate correction',
        priority: 3,
        priorityLevel: 'Medium',
        messages: [
          { role: 'user', content: 'There is a spelling mistake in my birth certificate. How can I get it corrected?' },
          { role: 'assistant', content: 'I can guide you through the birth certificate correction process. Let me get a human agent to help you.' }
        ]
      },
      {
        reason: 'Low Priority: General inquiry about voter ID',
        priority: 2,
        priorityLevel: 'Low',
        messages: [
          { role: 'user', content: 'I want to know how to apply for a voter ID card.' },
          { role: 'assistant', content: 'I can provide information about voter ID applications. Let me connect you with an agent for detailed guidance.' }
        ]
      },
      {
        reason: 'Normal: Property tax payment query',
        priority: 1,
        priorityLevel: 'Normal',
        messages: [
          { role: 'user', content: 'I want to pay my property tax online but the website is not working.' },
          { role: 'assistant', content: 'Let me help you with property tax payment options. Connecting you with a human agent.' }
        ]
      }
    ];

    console.log('🎫 Creating multiple test tickets...');

    for (let i = 0; i < tickets.length; i++) {
      const ticketData = tickets[i];
      
      // Create conversation
      const conversation = await Conversation.create({
        userId: testCustomer._id,
        messages: ticketData.messages,
        status: 'active',
        language: 'en',
        sessionId: `test_session_${Date.now()}_${i}`,
        metadata: {
          userAgent: 'Test Browser',
          ipAddress: '127.0.0.1',
          source: 'test'
        }
      });

      // Create handoff ticket
      const ticket = await HandoffTicket.create({
        userId: testCustomer._id,
        conversationId: conversation._id,
        reason: ticketData.reason,
        priority: ticketData.priority,
        priorityLevel: ticketData.priorityLevel,
        status: 'waiting',
        conversationContext: ticketData.messages,
        metadata: {
          source: 'chatbot',
          userAgent: 'Test Browser',
          ipAddress: '127.0.0.1'
        }
      });

      console.log(`✅ Created ticket ${i + 1}:`);
      console.log(`   ID: ${ticket._id}`);
      console.log(`   Priority: ${ticket.priority} (${ticket.priorityLevel})`);
      console.log(`   Reason: ${ticket.reason}`);
    }

    console.log('\n🎯 Summary:');
    console.log('✅ Created 5 test tickets with different priorities');
    console.log('✅ All tickets are in "waiting" status');
    console.log('✅ Ready for agents to accept and handle');
    
    console.log('\n🔑 Test Instructions:');
    console.log('1. Login to agent dashboard: agent@test.com / password@123');
    console.log('2. Go to Ticket Queue to see all waiting tickets');
    console.log('3. Accept any ticket to start handling it');
    console.log('4. Emergency tickets should appear at the top (highest priority)');

  } catch (error) {
    console.error('❌ Error creating test tickets:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

createMultipleTestTickets();