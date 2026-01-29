import mongoose from 'mongoose';
import HandoffTicket from '../src/shared/models/HandoffTicket.model';
import Conversation from '../src/shared/models/Conversation.model';
import User from '../src/shared/models/User.model';
import config from '../src/shared/config/env.config';

const createTestTicket = async (): Promise<void> => {
  try {
    console.log('🎫 Creating test handoff ticket...');

    // Find or create a test user (customer)
    let customer = await User.findOne({ email: 'customer@test.com' });
    if (!customer) {
      customer = await User.create({
        email: 'customer@test.com',
        passwordHash: 'password123',
        firstName: 'Test',
        lastName: 'Customer',
        authProvider: 'email',
        role: 'user',
      });
      console.log('✅ Test customer created');
    }

    // Create a test conversation
    const conversation = await Conversation.create({
      userId: customer._id,
      title: 'RTI Application Status Help',
      messages: [
        {
          role: 'user',
          content: 'I need help with my RTI application status',
          timestamp: new Date(),
        },
        {
          role: 'ai',
          content: 'I can help you with that. Let me connect you to a human agent.',
          timestamp: new Date(),
        },
        {
          role: 'user',
          content: 'Just transfer me to an agent immediately',
          timestamp: new Date(),
        }
      ],
    });

    console.log('✅ Test conversation created:', conversation._id);

    // Create handoff ticket
    const ticket = await HandoffTicket.create({
      userId: customer._id,
      conversationId: conversation._id,
      reason: 'User requested human assistance for RTI application status',
      conversationContext: conversation.messages,
      status: 'waiting',
      priority: 1,
      slaData: {
        responseDeadline: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes from now
        resolutionDeadline: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
      },
    });

    console.log('✅ Test handoff ticket created!');
    console.log('   Ticket ID:', ticket._id);
    console.log('   Customer:', customer.firstName, customer.lastName);
    console.log('   Reason:', ticket.reason);
    console.log('   Status:', ticket.status);
    console.log('   Priority:', ticket.priority);

    console.log('\n🎯 Next Steps:');
    console.log('1. Login to agent dashboard as agent@test.com');
    console.log('2. Check Ticket Queue - the ticket should appear there');
    console.log('3. Accept the ticket to start chatting with the customer');

  } catch (error) {
    console.error('❌ Error creating test ticket:', error);
  }
};

const main = async () => {
  try {
    console.log('🚀 Connecting to MongoDB...');
    await mongoose.connect(config.mongodbUri);
    console.log('✅ Connected to MongoDB');

    await createTestTicket();

  } catch (error) {
    console.error('❌ Connection error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
};

main();