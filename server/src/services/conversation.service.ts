import Conversation, { IConversation, IMessage } from '../shared/models/Conversation.model';
import { Types } from 'mongoose';

/**
 * Conversation Service
 * Handles conversation management operations
 */

export class ConversationService {
  /**
   * Create a new conversation
   */
  async createConversation(userId: string, title?: string): Promise<IConversation> {
    const conversation = await Conversation.create({
      userId: new Types.ObjectId(userId),
      title: title || 'New Conversation',
      messages: [],
      status: 'active',
    });

    return conversation;
  }

  /**
   * Get all conversations for a user
   */
  async getUserConversations(
    userId: string,
    status?: 'active' | 'archived'
  ): Promise<IConversation[]> {
    const query: any = { userId: new Types.ObjectId(userId) };
    if (status) {
      query.status = status;
    }

    const conversations = await Conversation.find(query)
      .sort({ updatedAt: -1 })
      .select('title status createdAt updatedAt messages')
      .lean();

    return conversations;
  }

  /**
   * Get a single conversation by ID
   */
  async getConversationById(
    conversationId: string,
    userId: string
  ): Promise<IConversation | null> {
    const conversation = await Conversation.findOne({
      _id: new Types.ObjectId(conversationId),
      userId: new Types.ObjectId(userId),
    }).lean();

    return conversation;
  }

  /**
   * Add a message to a conversation
   */
  async addMessage(
    conversationId: string,
    message: IMessage
  ): Promise<IConversation | null> {
    const conversation = await Conversation.findByIdAndUpdate(
      conversationId,
      {
        $push: { messages: message },
        $set: { updatedAt: new Date() },
      },
      { new: true }
    );

    return conversation;
  }

  /**
   * Update conversation title
   */
  async updateTitle(
    conversationId: string,
    userId: string,
    title: string
  ): Promise<IConversation | null> {
    const conversation = await Conversation.findOneAndUpdate(
      {
        _id: new Types.ObjectId(conversationId),
        userId: new Types.ObjectId(userId),
      },
      { $set: { title } },
      { new: true }
    );

    return conversation;
  }

  /**
   * Archive a conversation
   */
  async archiveConversation(
    conversationId: string,
    userId: string
  ): Promise<IConversation | null> {
    const conversation = await Conversation.findOneAndUpdate(
      {
        _id: new Types.ObjectId(conversationId),
        userId: new Types.ObjectId(userId),
      },
      { $set: { status: 'archived' } },
      { new: true }
    );

    return conversation;
  }

  /**
   * Delete a conversation
   */
  async deleteConversation(conversationId: string, userId: string): Promise<boolean> {
    const result = await Conversation.deleteOne({
      _id: new Types.ObjectId(conversationId),
      userId: new Types.ObjectId(userId),
    });

    return result.deletedCount > 0;
  }

  /**
   * Get conversation context (last N messages)
   */
  async getConversationContext(
    conversationId: string,
    limit: number = 10
  ): Promise<IMessage[]> {
    const conversation = await Conversation.findById(conversationId)
      .select('messages')
      .lean();

    if (!conversation) {
      return [];
    }

    // Get last N messages
    return conversation.messages.slice(-limit);
  }

  /**
   * Search conversations by text
   */
  async searchConversations(userId: string, searchText: string): Promise<IConversation[]> {
    const conversations = await Conversation.find({
      userId: new Types.ObjectId(userId),
      $text: { $search: searchText },
    })
      .sort({ score: { $meta: 'textScore' } })
      .limit(20)
      .lean();

    return conversations;
  }
}

export default new ConversationService();
