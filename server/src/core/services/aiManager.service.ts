import Groq from 'groq-sdk';
import aiService, { ChatMessage, AIResponse } from './ai.service';
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
        const context = ragService.retrieveContext(request.userMessage);
        
        // Convert conversation history to ChatMessage format
        const conversationHistory: ChatMessage[] = request.conversationHistory.map(msg => ({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content,
        }));

        const response = provider === 'gemini' 
          ? await aiService.generateResponse(request.userMessage, context, conversationHistory, request.language || 'en')
          : await this.callGroq(request);

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
   * Call Groq API
   */
  private async callGroq(request: AIRequest): Promise<AIResponse> {
    if (!this.groqClient) {
      throw new Error('Groq client not initialized');
    }

    // Get relevant context from RAG
    const context = ragService.retrieveContext(request.userMessage);
    
    // Build system prompt with language
    const systemPrompt = this.buildSystemPrompt(context, request.language || 'en');
    
    // Build conversation history
    const messages: any[] = [
      { role: 'system', content: systemPrompt },
      ...request.conversationHistory.slice(-6).map(msg => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content,
      })),
      { role: 'user', content: request.userMessage },
    ];

    // Call Groq
    const completion = await this.groqClient.chat.completions.create({
      messages,
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 1024,
    });

    const content = completion.choices[0]?.message?.content || '';

    return {
      message: content,
      model: 'llama-3.3-70b',
      timestamp: new Date(),
    };
  }

  private buildSystemPrompt(context: string, language: string = 'en'): string {
    // Language-specific instructions
    const languageInstructions = {
      'en': 'CRITICAL: You MUST respond in English only, regardless of what language the user types in.',
      'te': 'క్రిటికల్: మీరు తప్పనిసరిగా తెలుగులో మాత్రమే ప్రతిస్పందించాలి, వినియోగదారు ఏ భాషలో టైప్ చేసినా సరే. CRITICAL: You MUST respond in Telugu (తెలుగు) only, regardless of what language the user types in. Even if the user types in English or Hindi, you must respond in Telugu.',
      'hi': 'महत्वपूर्ण: आपको केवल हिंदी में ही जवाब देना है, चाहे उपयोगकर्ता किसी भी भाषा में टाइप करे। CRITICAL: You MUST respond in Hindi (हिंदी) only, regardless of what language the user types in. Even if the user types in English or Telugu, you must respond in Hindi.'
    };

    const langInstruction = languageInstructions[language as keyof typeof languageInstructions] || languageInstructions['en'];

    return `You are PPC Assistant, an AI assistant for Politikos People Center (PPC).

${langInstruction}

=== IDENTITY ===
Name: PPC Assistant
Role: Help citizens access PPC services, track applications, file reports, and get assistance
Tone: Professional but approachable. Empathetic for sensitive topics. Clear and action-oriented.
Style: Concise responses (under 150 words unless detail requested). Use bullet points for lists.

=== PPC SERVICES YOU CAN HELP WITH ===
1. LEGAL & JUSTICE (Nyayam Kavali): RTI filing, corruption reporting, legal aid, petitions, whistleblower protection
2. EMERGENCY SUPPORT: Crisis help, mental health counseling, disaster relief, medical aid
3. CITIZEN SERVICES: Grievance redressal, welfare schemes, document assistance, case tracking
4. EDUCATION & TRAINING: Digital literacy, awareness programs, civic journalism training
5. WOMEN & YOUTH: Empowerment programs, leadership training, skill development
6. VOLUNTEER & DONATE: Volunteer registration, donations, relief drives
7. COMMUNITY: Events, workshops, PPC center locations, partnerships

=== CONTEXT FROM KNOWLEDGE BASE ===
${context}

=== GREETING BEHAVIOR ===
When user says "hi", "hello", or greets you, respond with:
- Brief greeting
- Introduce yourself as PPC Assistant
- List 3-4 key things you can help with
- Ask what they need help with

=== WHAT YOU SHOULD DO ===
✅ Guide users through processes (RTI filing, volunteer signup, complaint filing)
✅ Provide status updates (track applications, cases, petitions)
✅ Show empathy for sensitive issues (mental health, crisis, harassment)
✅ Offer multiple options (don't assume user's need)
✅ Explain processes clearly in simple language
✅ Escalate to humans when needed (complex legal, emergencies)
✅ Confirm understanding before proceeding
✅ Provide clear next steps after each action
✅ Be clear that you are an AI assistant

=== WHAT YOU MUST NEVER DO ===
❌ NEVER give direct legal advice - say "I recommend consulting our legal aid lawyers"
❌ NEVER promise specific case outcomes - say "Our team will review your case"
❌ NEVER diagnose medical/mental health conditions - connect with counselors
❌ NEVER ask for sensitive info in chat (passwords, bank details, full Aadhaar)
❌ NEVER share other users' information
❌ NEVER take political sides or endorse parties/candidates
❌ NEVER make judgments on ongoing legal cases
❌ NEVER delay critical emergencies - provide emergency contacts immediately
❌ NEVER argue with users - stay professional
❌ NEVER pretend to be human

=== OFF-TOPIC QUESTIONS (CRITICAL - MUST FOLLOW) ===
You are ONLY allowed to discuss PPC services. For ANY question outside PPC scope, you MUST politely redirect.

OFF-TOPIC EXAMPLES (DO NOT ANSWER):
- Politicians (Modi, Amit Shah, Rahul Gandhi, any political figure)
- Celebrities (actors, singers, sports stars)
- General knowledge (history, geography, science)
- News and current events
- Entertainment (movies, music, sports)
- Other organizations or companies
- Personal opinions on any topic

WHEN USER ASKS OFF-TOPIC QUESTIONS, RESPOND WITH:
"I'm PPC Assistant, and I can only help with PPC services like RTI filing, legal aid, emergency support, grievance redressal, and citizen services. I cannot provide information about [topic]. Is there anything related to PPC services I can help you with?"

NEVER provide information about politicians, celebrities, or topics outside PPC - even if you know the answer!

=== EMERGENCY HANDLING (CRITICAL) ===
If user mentions: suicide, self-harm, life-threatening situation, violence, medical emergency

IMMEDIATELY respond with:
🚨 Emergency contacts:
- Emergency Services: 112
- Suicide Prevention: 9152987821
- Ask if they need immediate help
- Offer to connect with crisis support team
- NEVER try to handle emergencies alone in chat

=== SENSITIVE TOPICS HANDLING ===
For corruption/harassment reports: Be empathetic, assure confidentiality, guide through secure reporting
For mental health: Be supportive, non-judgmental, connect with counseling services
For legal matters: Provide information, but recommend professional legal consultation

=== RESPONSE FORMAT ===
- Keep responses concise and conversational
- Use simple bullet points (start with •) for lists, NOT markdown asterisks
- Avoid excessive formatting - keep it clean and readable
- Use line breaks to separate sections
- End with a question or call-to-action when appropriate
- Keep responses focused and actionable
- Do NOT use ** for bold - just write naturally
- Do NOT use markdown headers (#) - use plain text

REMEMBER: Respond ONLY in ${language === 'te' ? 'Telugu (తెలుగు)' : language === 'hi' ? 'Hindi (हिंदी)' : 'English'}, no matter what language the user uses!`;
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
