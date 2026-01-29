/**
 * RAG Service - Retrieval-Augmented Generation
 * Manages knowledge base and retrieves relevant context for AI responses
 * Implements Requirements 31.1-31.10, 33.2, 33.3
 */

interface KnowledgeEntry {
  id: string;
  category: string;
  title: string;
  content: string;
  keywords: string[];
}

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

class RAGService {
  private knowledgeBase: KnowledgeEntry[] = [];

  constructor() {
    this.initializeKnowledgeBase();
  }

  /**
   * Initialize knowledge base with information about PPC (Politikos People Center)
   */
  private initializeKnowledgeBase() {
    this.knowledgeBase = [
      {
        id: '1',
        category: 'about',
        title: 'About PPC',
        content: `Politikos People Center (PPC) is a comprehensive citizen service platform that empowers people to access government services, seek justice, participate in civic activities, and get support for various needs.

PPC is organized into 7 main service categories:

1. LEGAL & JUSTICE (Nyayam Kavali):
   - RTI Filing & Tracking
   - Power Misuse & Corruption Reporting
   - Legal Aid & Representation
   - Whistleblower Protection
   - Petition & RTI Dashboard
   - Bias & Fact Verification

2. EMERGENCY & CITIZEN SUPPORT:
   - Emergency Assistance Program
   - Mental Health Support & Counselling
   - Crisis & Disaster Relief
   - Healthcare & Medical Aid
   - Food, Shelter & Clothing Drives

3. CITIZEN SERVICES:
   - Livelihood & Social Welfare Entitlements
   - Citizen Requests Resolution & Appeals
   - Grievance Redressal Mechanism
   - Case Documentation & Tracking

4. EDUCATION & AWARENESS:
   - Digital Literacy Workshops
   - Awareness Programs
   - Civic Journalism & Training
   - Legal Literacy & Rights Education

5. WOMEN & YOUTH EMPOWERMENT:
   - Youth Leadership Circles
   - Women Empowerment Initiatives
   - Skills & Competency Training
   - Health & Wellness Programs

6. VOLUNTEER & DONATE:
   - Become a Volunteer
   - Donations & Relief Drive Support
   - Donor Participation Portal
   - Fund Raising & Crowd Funding

7. COMMUNITY & PARTNERSHIPS:
   - Community Leadership Circles
   - Event Sponsorship Opportunities
   - Social Development Partnerships
   - PPC Centers Near You

PPC is available to all citizens through this AI assistant, website, mobile app, and physical PPC centers.`,
        keywords: ['about', 'ppc', 'what is', 'politikos', 'people center', 'mission', 'introduction', 'services', 'help', 'nyayam kavali'],
      },
      {
        id: '2',
        category: 'legal',
        title: 'Legal & Justice Services (Nyayam Kavali)',
        content: `PPC's Legal & Justice Services (Nyayam Kavali) help citizens fight for their rights and seek justice:

RTI FILING & TRACKING:
- File Right to Information (RTI) applications online
- Track your RTI application status in real-time
- Get help drafting RTI requests

CORRUPTION & POWER MISUSE REPORTING:
- Report corruption anonymously
- Track investigation status
- Whistleblower protection channel for safe reporting

LEGAL AID & REPRESENTATION:
- Free legal consultation at Legal & Justice Clinics
- Connect with lawyers for representation
- Case documentation and tracking

PETITION SERVICES:
- Sign or start public petitions (Petition Waves)
- Track petition progress and supporter count
- Petition & RTI Dashboard for real-time updates

BIAS & FACT VERIFICATION:
- Submit claims for fact-checking
- Track verification status and results

SANGHA COUNCILS:
- Participate in community governance
- Track council meetings and decisions

To use these services, you can file a complaint, track your case, or ask me for help with any legal matter.`,
        keywords: ['legal', 'justice', 'rti', 'corruption', 'complaint', 'petition', 'lawyer', 'case', 'nyayam kavali', 'whistleblower', 'rights'],
      },
      {
        id: '3',
        category: 'emergency',
        title: 'Emergency & Citizen Support Services',
        content: `PPC provides emergency assistance and citizen support services:

EMERGENCY ASSISTANCE PROGRAM:
- 24/7 emergency helpline
- Immediate crisis response
- Emergency contact directory

MENTAL HEALTH SUPPORT:
- Book counseling appointments
- Access mental health resources
- Confidential support sessions

CRISIS & DISASTER RELIEF:
- Active relief efforts during disasters
- Volunteer coordination
- Real-time updates during emergencies

HEALTHCARE & MEDICAL AID:
- Medical aid assistance requests
- Healthcare resource connections
- Health consultation bookings

FOOD, SHELTER & CLOTHING DRIVES:
- Ongoing donation drives
- Distribution center locations
- How to donate or receive help

CITIZEN SERVICES:
- Livelihood & Social Welfare Entitlements
- Grievance Redressal Mechanism
- Citizen Requests Resolution & Appeals
- Case Documentation & Tracking

For emergencies, say "I need emergency help" or "emergency assistance" and I'll guide you immediately.`,
        keywords: ['emergency', 'help', 'crisis', 'mental health', 'counseling', 'medical', 'healthcare', 'disaster', 'relief', 'food', 'shelter', 'urgent'],
      },
      {
        id: '4',
        category: 'contact',
        title: 'Contact PPC',
        content: `You can reach Politikos People Center (PPC) through multiple channels:

PPC CENTERS:
- Find the nearest PPC center using "PPC Center Near Me"
- Visit during operating hours for in-person assistance
- Use AI-powered Civic Assistant Kiosks at centers

ONLINE:
- Use this AI chatbot assistant 24/7
- Submit requests through the PPC website
- Use the Community Mobile App

CONTACT DIRECTORY:
- Department-wise email directory
- Staff contact list by department
- Feedback form for suggestions

OPERATING HOURS:
- Monday to Saturday: 9:00 AM - 6:00 PM
- Sunday: Closed
- Emergency services available 24/7

To find the nearest PPC center, say "Find PPC center near me" or "PPC locations".`,
        keywords: ['contact', 'reach', 'connect', 'email', 'phone', 'office', 'address', 'location', 'center', 'hours', 'timing'],
      },
      {
        id: '5',
        category: 'education',
        title: 'Education, Training & Empowerment Programs',
        content: `PPC offers various education, training, and empowerment programs:

DIGITAL LITERACY:
- Digital Literacy Workshops
- Learn to use computers, internet, and digital services
- Free training sessions at PPC centers

AWARENESS PROGRAMS:
- Citizen Rights Awareness Promotion
- Legal Literacy & Rights Education
- Public Campaigns and Awareness Videos

CIVIC JOURNALISM & TRAINING:
- Training for citizen journalists
- Media skills development
- Transparency via Media Reports

WOMEN EMPOWERMENT:
- Women Empowerment Initiatives
- Leadership training programs
- Skills & Competency Training
- Health & Wellness Programs

YOUTH DEVELOPMENT:
- Youth Leadership Circles
- Career and Employment Guidance
- Skill Development Workshops
- Entrepreneurship Support (Loka)

To enroll in any program, say "I want to join [program name]" or ask about specific training.`,
        keywords: ['education', 'training', 'workshop', 'literacy', 'awareness', 'women', 'youth', 'empowerment', 'skills', 'career', 'leadership'],
      },
      {
        id: '6',
        category: 'howto',
        title: 'How to Use PPC Chatbot',
        content: `Here's how to use the PPC AI Assistant:

QUICK ACTIONS (Click buttons or type):
- "Track Status" - Check your application/case status
- "Report Issue" - File a complaint or report a problem
- "Find Center" - Locate nearest PPC center
- "Emergency Help" - Get immediate emergency assistance

WHAT YOU CAN ASK ME:
- "What is PPC?" - Learn about our services
- "How to file RTI?" - Get help with RTI applications
- "I need legal help" - Connect with legal services
- "Find volunteer opportunities" - Join as a volunteer
- "I want to donate" - Make a contribution
- "Track my application" - Check case status

SERVICES I CAN HELP WITH:
- Legal & Justice (RTI, complaints, petitions)
- Emergency Support (crisis help, mental health)
- Citizen Services (documents, welfare schemes)
- Education & Training programs
- Volunteer & Donation opportunities

TIPS FOR BETTER RESULTS:
- Be specific about what you need
- Mention service names if you know them
- Ask follow-up questions for more details

CHANGE LANGUAGE:
- Click the language button to switch between English, Telugu, and Hindi

Need help? Just type your question or say "Help" anytime!`,
        keywords: ['how to', 'use', 'help', 'guide', 'chatbot', 'assistant', 'track', 'status', 'language', 'tips'],
      },
    ];

    console.log(`✅ Knowledge base initialized with ${this.knowledgeBase.length} entries [v3-fixed]`);
  }

  /**
   * Retrieve relevant context based on user query and conversation history
   */
  retrieveContext(query: string, conversationHistory: ChatMessage[] = []): string {
    const queryLower = query.toLowerCase();
    const conversationContext = this.extractConversationContext(conversationHistory);
    const enhancedQuery = conversationContext ? `${conversationContext} ${queryLower}` : queryLower;
    
    const relevantEntries: Array<{ entry: KnowledgeEntry; score: number }> = [];

    for (const entry of this.knowledgeBase) {
      if (!entry || !entry.keywords) continue;
      
      let score = 0;
      for (const keyword of entry.keywords) {
        if (enhancedQuery.includes(keyword)) score += 2;
      }
      if (enhancedQuery.includes(entry.title.toLowerCase())) score += 3;
      if (enhancedQuery.includes(entry.category)) score += 1;
      if (this.hasContextualReference(query)) score += 1;
      if (score > 0) relevantEntries.push({ entry, score });
    }

    relevantEntries.sort((a, b) => b.score - a.score);

    if (relevantEntries.length === 0) {
      const generalInfo = this.knowledgeBase.filter(e => e.category === 'about' || e.category === 'howto');
      return generalInfo.map(e => e.content).join('\n\n');
    }

    return relevantEntries.slice(0, 3).map(({ entry }) => entry.content).join('\n\n');
  }

  private extractConversationContext(conversationHistory: ChatMessage[]): string {
    if (conversationHistory.length === 0) return '';
    return conversationHistory.filter(msg => msg.role === 'user').slice(-3).map(msg => msg.content.toLowerCase()).join(' ');
  }

  private hasContextualReference(query: string): boolean {
    const contextualPhrases = ['tell me more', 'more about', 'what about that', 'that one', 'the second', 'the first', 'the last', 'you mentioned', 'earlier you said', 'go back to', 'continue', 'and what about', 'also'];
    return contextualPhrases.some(phrase => query.toLowerCase().includes(phrase));
  }

  addKnowledge(entry: Omit<KnowledgeEntry, 'id'>): void {
    const newEntry: KnowledgeEntry = { ...entry, id: Date.now().toString() };
    this.knowledgeBase.push(newEntry);
    console.log(`✅ Added new knowledge entry: ${newEntry.title}`);
  }

  getCategories(): string[] {
    return [...new Set(this.knowledgeBase.map(e => e.category))];
  }

  search(query: string): KnowledgeEntry[] {
    const queryLower = query.toLowerCase();
    return this.knowledgeBase.filter(entry =>
      entry.title.toLowerCase().includes(queryLower) ||
      entry.content.toLowerCase().includes(queryLower) ||
      entry.keywords.some(k => k.includes(queryLower))
    );
  }
}

export default new RAGService();
