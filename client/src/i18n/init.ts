// i18n initialization
import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: {
    translation: {
      chatbot: {
        header: { title: "PPC Assistant", subtitle: "How can I help?", back: "Back to menu" },
        welcome: { greeting: "Hi! I'm your PPC Assistant", description: "I can help with RTI applications, complaints, and more." },
        initialMessage: "Hello! Welcome to Public Participation Center. I'm your PPC Civic Assistant.",
        actions: { track: "Track Status", report: "Report Issue", find: "Find Center", emergency: "Emergency Help" },
        prompts: { track: "I want to track my application status", report: "I need to file a report or complaint", find: "Help me find the nearest service center", emergency: "I need emergency assistance" },
        footer: { help: "Help", services: "All Services" },
        input: { placeholder: "Type your message...", send: "Send" },
        rateLimit: { message: "Please wait before sending more messages", wait: "Please wait {{seconds}} seconds before sending more messages." },
        services: {
          title: "All Services",
          legal: { title: "Legal & Justice", description: "RTI, corruption reporting, legal cases", prompt: "Tell me about legal and justice services" },
          emergency: { title: "Emergency Support", description: "Crisis help, healthcare, mental health", prompt: "I need emergency support services" },
          citizen: { title: "Citizen Services", description: "Documents, welfare, applications", prompt: "Tell me about citizen services" },
          education: { title: "Education & Training", description: "Digital literacy, awareness programs", prompt: "Tell me about education and training programs" },
          women: { title: "Women & Youth", description: "Empowerment, leadership, skills", prompt: "Tell me about women and youth empowerment programs" },
          volunteer: { title: "Volunteer & Donate", description: "Join as volunteer, make donations", prompt: "How can I volunteer or donate?" },
          community: { title: "Community", description: "Events, workshops, partnerships", prompt: "Tell me about community events and programs" }
        },
        help: {
          title: "Help",
          gettingStarted: { title: "Getting Started", description: "How to use chatbot, what can I ask", prompt: "How do I use this chatbot? What can I ask you?" },
          usingServices: { title: "Using Services", description: "Track status, file complaint, find center", prompt: "How do I track my application status or file a complaint?" },
          languages: { title: "Languages", description: "Switch languages, change settings", prompt: "How do I change the language settings?" },
          contactSupport: { title: "Contact Support", description: "Call us, email, chat with agent", prompt: "How can I contact support or talk to a human agent?" },
          feedback: { title: "Give Feedback", description: "Report problem, suggest improvement", prompt: "I want to give feedback or report a problem" }
        }
      }
    }
  },
  te: {
    translation: {
      chatbot: {
        header: { title: "PPC సహాయకుడు", subtitle: "నేను ఎలా సహాయం చేయగలను?", back: "మెనూకు తిరిగి వెళ్ళండి" },
        welcome: { greeting: "హాయ్! నేను మీ PPC సహాయకుడిని", description: "నేను RTI దరఖాస్తులు, ఫిర్యాదులు మరియు మరిన్నింటితో సహాయం చేయగలను." },
        initialMessage: "నమస్కారం! పబ్లిక్ పార్టిసిపేషన్ సెంటర్‌కు స్వాగతం.",
        actions: { track: "స్థితిని ట్రాక్ చేయండి", report: "సమస్యను నివేదించండి", find: "కేంద్రాన్ని కనుగొనండి", emergency: "అత్యవసర సహాయం" },
        prompts: { track: "నా దరఖాస్తు స్థితిని ట్రాక్ చేయాలనుకుంటున్నాను", report: "నేను నివేదిక లేదా ఫిర్యాదు దాఖలు చేయాలి", find: "సమీప సేవా కేంద్రాన్ని కనుగొనడంలో నాకు సహాయం చేయండి", emergency: "నాకు అత్యవసర సహాయం కావాలి" },
        footer: { help: "సహాయం", services: "అన్ని సేవలు" },
        input: { placeholder: "మీ సందేశాన్ని టైప్ చేయండి...", send: "పంపండి" },
        rateLimit: { message: "మరిన్ని సందేశాలు పంపే ముందు దయచేసి వేచి ఉండండి", wait: "మరిన్ని సందేశాలు పంపే ముందు దయచేసి {{seconds}} సెకన్లు వేచి ఉండండి." },
        services: {
          title: "అన్ని సేవలు",
          legal: { title: "న్యాయ & న్యాయం", description: "RTI, అవినీతి నివేదిక, న్యాయ కేసులు", prompt: "న్యాయ మరియు న్యాయ సేవల గురించి చెప్పండి" },
          emergency: { title: "అత్యవసర సహాయం", description: "సంక్షోభ సహాయం, ఆరోగ్య సంరక్షణ, మానసిక ఆరోగ్యం", prompt: "నాకు అత్యవసర సహాయ సేవలు కావాలి" },
          citizen: { title: "పౌర సేవలు", description: "పత్రాలు, సంక్షేమం, దరఖాస్తులు", prompt: "పౌర సేవల గురించి చెప్పండి" },
          education: { title: "విద్య & శిక్షణ", description: "డిజిటల్ అక్షరాస్యత, అవగాహన కార్యక్రమాలు", prompt: "విద్య మరియు శిక్షణ కార్యక్రమాల గురించి చెప్పండి" },
          women: { title: "మహిళలు & యువత", description: "సాధికారత, నాయకత్వం, నైపుణ్యాలు", prompt: "మహిళలు మరియు యువత సాధికారత కార్యక్రమాల గురించి చెప్పండి" },
          volunteer: { title: "వాలంటీర్ & దానం", description: "వాలంటీర్‌గా చేరండి, విరాళాలు ఇవ్వండి", prompt: "నేను వాలంటీర్ లేదా దానం ఎలా చేయగలను?" },
          community: { title: "సమాజం", description: "ఈవెంట్‌లు, వర్క్‌షాప్‌లు, భాగస్వామ్యాలు", prompt: "సమాజ ఈవెంట్‌లు మరియు కార్యక్రమాల గురించి చెప్పండి" }
        },
        help: {
          title: "సహాయం",
          gettingStarted: { title: "ప్రారంభించడం", description: "చాట్‌బాట్ ఎలా వాడాలి, నేను ఏమి అడగగలను", prompt: "ఈ చాట్‌బాట్‌ను ఎలా వాడాలి? నేను మిమ్మల్ని ఏమి అడగగలను?" },
          usingServices: { title: "సేవలు వాడటం", description: "స్థితి ట్రాక్ చేయండి, ఫిర్యాదు చేయండి, కేంద్రం కనుగొనండి", prompt: "నా దరఖాస్తు స్థితిని ఎలా ట్రాక్ చేయాలి లేదా ఫిర్యాదు ఎలా చేయాలి?" },
          languages: { title: "భాషలు", description: "భాషలు మార్చండి, సెట్టింగ్‌లు మార్చండి", prompt: "భాష సెట్టింగ్‌లను ఎలా మార్చాలి?" },
          contactSupport: { title: "సపోర్ట్ సంప్రదించండి", description: "కాల్ చేయండి, ఇమెయిల్, ఏజెంట్‌తో చాట్", prompt: "సపోర్ట్‌ను ఎలా సంప్రదించాలి లేదా మానవ ఏజెంట్‌తో ఎలా మాట్లాడాలి?" },
          feedback: { title: "ఫీడ్‌బ్యాక్ ఇవ్వండి", description: "సమస్య నివేదించండి, మెరుగుదల సూచించండి", prompt: "నేను ఫీడ్‌బ్యాక్ ఇవ్వాలనుకుంటున్నాను లేదా సమస్య నివేదించాలనుకుంటున్నాను" }
        }
      }
    }
  },
  hi: {
    translation: {
      chatbot: {
        header: { title: "PPC सहायक", subtitle: "मैं कैसे मदद कर सकता हूँ?", back: "मेनू पर वापस जाएं" },
        welcome: { greeting: "नमस्ते! मैं आपका PPC सहायक हूँ", description: "मैं RTI आवेदन, शिकायतें और अधिक में मदद कर सकता हूँ।" },
        initialMessage: "नमस्ते! पब्लिक पार्टिसिपेशन सेंटर में आपका स्वागत है।",
        actions: { track: "स्थिति ट्रैक करें", report: "समस्या रिपोर्ट करें", find: "केंद्र खोजें", emergency: "आपातकालीन सहायता" },
        prompts: { track: "मैं अपने आवेदन की स्थिति ट्रैक करना चाहता हूँ", report: "मुझे रिपोर्ट या शिकायत दर्ज करनी है", find: "निकटतम सेवा केंद्र खोजने में मेरी मदद करें", emergency: "मुझे आपातकालीन सहायता चाहिए" },
        footer: { help: "मदद", services: "सभी सेवाएं" },
        input: { placeholder: "अपना संदेश टाइप करें...", send: "भेजें" },
        rateLimit: { message: "अधिक संदेश भेजने से पहले कृपया प्रतीक्षा करें", wait: "अधिक संदेश भेजने से पहले कृपया {{seconds}} सेकंड प्रतीक्षा करें।" },
        services: {
          title: "सभी सेवाएं",
          legal: { title: "कानूनी और न्याय", description: "RTI, भ्रष्टाचार रिपोर्टिंग, कानूनी मामले", prompt: "कानूनी और न्याय सेवाओं के बारे में बताएं" },
          emergency: { title: "आपातकालीन सहायता", description: "संकट सहायता, स्वास्थ्य सेवा, मानसिक स्वास्थ्य", prompt: "मुझे आपातकालीन सहायता सेवाएं चाहिए" },
          citizen: { title: "नागरिक सेवाएं", description: "दस्तावेज़, कल्याण, आवेदन", prompt: "नागरिक सेवाओं के बारे में बताएं" },
          education: { title: "शिक्षा और प्रशिक्षण", description: "डिजिटल साक्षरता, जागरूकता कार्यक्रम", prompt: "शिक्षा और प्रशिक्षण कार्यक्रमों के बारे में बताएं" },
          women: { title: "महिला और युवा", description: "सशक्तिकरण, नेतृत्व, कौशल", prompt: "महिला और युवा सशक्तिकरण कार्यक्रमों के बारे में बताएं" },
          volunteer: { title: "स्वयंसेवक और दान", description: "स्वयंसेवक बनें, दान करें", prompt: "मैं स्वयंसेवक या दान कैसे कर सकता हूँ?" },
          community: { title: "समुदाय", description: "कार्यक्रम, कार्यशालाएं, साझेदारी", prompt: "समुदाय कार्यक्रमों के बारे में बताएं" }
        },
        help: {
          title: "मदद",
          gettingStarted: { title: "शुरू करना", description: "चैटबॉट कैसे उपयोग करें, मैं क्या पूछ सकता हूँ", prompt: "मैं इस चैटबॉट का उपयोग कैसे करूं? मैं आपसे क्या पूछ सकता हूँ?" },
          usingServices: { title: "सेवाओं का उपयोग", description: "स्थिति ट्रैक करें, शिकायत दर्ज करें, केंद्र खोजें", prompt: "मैं अपने आवेदन की स्थिति कैसे ट्रैक करूं या शिकायत कैसे दर्ज करूं?" },
          languages: { title: "भाषाएं", description: "भाषा बदलें, सेटिंग्स बदलें", prompt: "मैं भाषा सेटिंग्स कैसे बदलूं?" },
          contactSupport: { title: "सहायता से संपर्क", description: "कॉल करें, ईमेल, एजेंट से चैट", prompt: "मैं सहायता से कैसे संपर्क करूं या मानव एजेंट से कैसे बात करूं?" },
          feedback: { title: "फीडबैक दें", description: "समस्या रिपोर्ट करें, सुधार सुझाएं", prompt: "मैं फीडबैक देना चाहता हूँ या समस्या रिपोर्ट करना चाहता हूँ" }
        }
      }
    }
  }
};

i18next
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    supportedLngs: ['en', 'te', 'hi'],
    initImmediate: false,
    detection: { order: ['localStorage', 'navigator'], caches: ['localStorage'] },
    interpolation: { escapeValue: false },
    react: { useSuspense: false }
  });

export default i18next;
