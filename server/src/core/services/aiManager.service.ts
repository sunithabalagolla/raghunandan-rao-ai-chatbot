import Groq from 'groq-sdk';
import aiService from './ai.service';
import { ChatMessage } from './ai.service';
import ragService from './rag.service';
import { IMessage } from '../../shared/models/Conversation.model';

/**
 * Circuit Breaker State
 */
interface CircuitBreakerState {
  status: 'closed' | 'open' | 'half-open';
  failureCount: number;
  lastFailureTime: number;
  nextRetryTime: number;
}

/**
 * AI Request Interface (for backward compatibility)
 */
export interface AIRequest {
  userMessage: string;
  conversationHistory: IMessage[];
  language?: string;
  context?: string;
}

/**
 * AI Manager Service
 * Manages fallback between Gemini and Groq with circuit breaker pattern
 */
class AIManagerService {
  private groqClient: Groq | null;
  private circuitBreakers: Map<string, CircuitBreakerState>;
  private readonly maxFailures = 5;
  private readonly resetTimeout = 60000; // 60 seconds

  constructor() {
    const groqApiKey = process.env.GROQ_API_KEY;
    this.groqClient = groqApiKey ? new Groq({ apiKey: groqApiKey }) : null;
    this.circuitBreakers = new Map();
    
    if (!groqApiKey) {
      console.warn('GROQ_API_KEY not found - fallback disabled');
    }
  }

  /**
   * Generate AI response with fallback support
   */
  async generateResponse(request: AIRequest): Promise<{ content: string; confidence: number; shouldHandoff: boolean; processingTime: number }> {
    const startTime = Date.now();
    
    // Try Gemini first
    try {
      return await this.tryProvider('gemini', request, 3);
    } catch (geminiError) {
      console.error('Gemini failed:', geminiError);

      // Fallback to Groq if available
      if (this.groqClient) {
        try {
          return await this.tryProvider('groq', request, 2);
        } catch (groqError) {
          console.error('Groq fallback failed:', groqError);
        }
      }

      // Both failed - return graceful error
      return {
        content: "I'm having trouble connecting right now. Please try again in a moment, or click 'Talk to Human Agent' for immediate assistance.",
        confidence: 0,
        shouldHandoff: true,
        processingTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Try a specific AI provider with retries
   */
  private async tryProvider(
    provider: 'gemini' | 'groq',
    request: AIRequest,
    maxRetries: number
  ): Promise<{ content: string; confidence: number; shouldHandoff: boolean; processingTime: number }> {
    // Check circuit breaker
    if (this.isCircuitOpen(provider)) {
      throw new Error(`Circuit breaker open for ${provider}`);
    }

    let lastError: Error | null = null;
    const startTime = Date.now();

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Get relevant context from RAG
        const ragContext = ragService.retrieveContext(request.userMessage);
        
        // Combine RAG context with conversation state context
        const fullContext = ragContext + (request.context || '');
        
        // Convert conversation history to ChatMessage format
        const conversationHistory: ChatMessage[] = request.conversationHistory.map(msg => ({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content,
        }));

        const response = provider === 'gemini' 
          ? await aiService.generateResponse(request.userMessage, fullContext, conversationHistory, request.language || 'en')
          : await aiService.generateResponse(request.userMessage, fullContext, conversationHistory, request.language || 'en');

        // Success - reset circuit breaker
        this.resetCircuitBreaker(provider);
        
        return {
          content: response.message,
          confidence: 0.8,
          shouldHandoff: false,
          processingTime: Date.now() - startTime,
        };
      } catch (error: any) {
        lastError = error;
        this.recordFailure(provider);

        // Exponential backoff: 1s, 2s, 4s
        if (attempt < maxRetries) {
          await this.sleep(Math.pow(2, attempt - 1) * 1000);
        }
      }
    }

    throw lastError || new Error(`${provider} failed after ${maxRetries} attempts`);
  }

  /**
   * Check if AI service is available
   */
  isAvailable(): boolean {
    return aiService.isAvailable();
  }

  private isCircuitOpen(provider: string): boolean {
    const breaker = this.circuitBreakers.get(provider);
    if (!breaker) return false;

    const now = Date.now();

    // Check if circuit should be reset
    if (breaker.status === 'open' && now >= breaker.nextRetryTime) {
      breaker.status = 'half-open';
      return false;
    }

    return breaker.status === 'open';
  }

  private recordFailure(provider: string): void {
    const now = Date.now();
    const breaker = this.circuitBreakers.get(provider) || {
      status: 'closed' as const,
      failureCount: 0,
      lastFailureTime: now,
      nextRetryTime: now,
    };

    breaker.failureCount++;
    breaker.lastFailureTime = now;

    // Open circuit if too many failures
    if (breaker.failureCount >= this.maxFailures) {
      breaker.status = 'open';
      breaker.nextRetryTime = now + this.resetTimeout;
      console.warn(`Circuit breaker opened for ${provider}`);
    }

    this.circuitBreakers.set(provider, breaker);
  }

  private resetCircuitBreaker(provider: string): void {
    this.circuitBreakers.set(provider, {
      status: 'closed',
      failureCount: 0,
      lastFailureTime: 0,
      nextRetryTime: 0,
    });
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export default new AIManagerService();
