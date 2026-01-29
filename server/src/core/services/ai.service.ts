import { GoogleGenerativeAI } from '@google/generative-ai';
import Groq from 'groq-sdk';

/**
 * AI Service - LLM Integration
 * Handles AI responses using Gemini (primary) and Groq (fallback)
 */

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AIResponse {
  message: string;
  model: string;
  timestamp: Date;
}

class AIService {
  private gemini: GoogleGenerativeAI | null = null;
  private groq: Groq | null = null;
  private geminiModel: any = null;

  constructor() {
    this.initializeServices();
  }

  private initializeServices() {
    try {
      // Initialize Gemini
      if (process.env.GEMINI_API_KEY) {
        this.gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        this.geminiModel = this.gemini.getGenerativeModel({ model: 'gemini-1.5-pro' });
        console.log('✅ Gemini AI initialized');
      }

      // Initialize Groq (fallback)
      if (process.env.GROQ_API_KEY) {
        this.groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
        console.log('✅ Groq AI initialized');
      }

      if (!this.gemini && !this.groq) {
        console.warn('⚠️  No AI service configured. Please add GEMINI_API_KEY or GROQ_API_KEY to .env');
      }
    } catch (error) {
      console.error('❌ Error initializing AI services:', error);
    }
  }

  /**
   * Generate AI response using Gemini (primary) or Groq (fallback)
   */
  async generateResponse(
    userMessage: string,
    context: string,
    conversationHistory: ChatMessage[] = [],
    language: string = 'en'
  ): Promise<AIResponse> {
    try {
      // Try Gemini first
      if (this.geminiModel) {
        return await this.generateGeminiResponse(userMessage, context, conversationHistory, language);
      }

      // Fallback to Groq
      if (this.groq) {
        return await this.generateGroqResponse(userMessage, context, conversationHistory, language);
      }

      throw new Error('No AI service available');
    } catch (error: any) {
      console.error('❌ AI generation error:', error.message);
      
      // Try fallback if primary fails
      if (this.geminiModel && this.groq) {
        try {
          console.log('🔄 Falling back to Groq...');
          return await this.generateGroqResponse(userMessage, context, conversationHistory, language);
        } catch (fallbackError) {
          console.error('❌ Fallback also failed:', fallbackError);
        }
      }

      throw new Error('Failed to generate AI response');
    }
  }

  /**
   * Generate response using Google Gemini
   */
  private async generateGeminiResponse(
    userMessage: string,
    context: string,
    conversationHistory: ChatMessage[],
    language: string = 'en'
  ): Promise<AIResponse> {
    const systemPrompt = this.buildSystemPrompt(context, language);
    
    // Build conversation history
    const historyText = conversationHistory
      .slice(-6) // Last 3 exchanges
      .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
      .join('\n');

    const fullPrompt = `${systemPrompt}

${historyText ? `Previous conversation:\n${historyText}\n` : ''}
User: ${userMessage}

Assistant:`;

    const result = await this.geminiModel.generateContent(fullPrompt);
    const response = result.response;
    
    // Check if response was blocked by safety filters
    if (!response || response.promptFeedback?.blockReason) {
      throw new Error(`Gemini response blocked: ${response.promptFeedback?.blockReason || 'Unknown reason'}`);
    }

    const text = response.text();
    
    if (!text || text.trim().length === 0) {
      throw new Error('Gemini returned empty response');
    }

    return {
      message: text.trim(),
      model: 'gemini-1.5-pro',
      timestamp: new Date(),
    };
  }

  /**
   * Generate response using Groq
   */
  private async generateGroqResponse(
    userMessage: string,
    context: string,
    conversationHistory: ChatMessage[],
    language: string = 'en'
  ): Promise<AIResponse> {
    const systemPrompt = this.buildSystemPrompt(context, language);

    const messages: any[] = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.slice(-6).map(msg => ({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content,
      })),
      { role: 'user', content: userMessage },
    ];

    const completion = await this.groq!.chat.completions.create({
      messages,
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 1024,
    });

    const responseText = completion.choices[0]?.message?.content || 'I apologize, but I could not generate a response.';

    return {
      message: responseText.trim(),
      model: 'llama-3.3-70b',
      timestamp: new Date(),
    };
  }

  /**
   * Build system prompt with context and language
   */
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
- Use emojis sparingly (📋 for lists, ✅ for confirmations, 🚨 for emergencies)
- Use bullet points for multiple items
- Bold important information
- End with a question or call-to-action when appropriate
- Keep responses focused and actionable

REMEMBER: Respond ONLY in ${language === 'te' ? 'Telugu (తెలుగు)' : language === 'hi' ? 'Hindi (హిందీ)' : 'English'}, no matter what language the user uses!`;
  }

  /**
   * Check if AI service is available
   */
  isAvailable(): boolean {
    return !!(this.geminiModel || this.groq);
  }
}

export default new AIService();
