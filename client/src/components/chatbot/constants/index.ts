import { Droplets, Wheat, Zap, Heart } from 'lucide-react';

export const primaryActions = [
  {
    id: 'water',
    icon: Droplets,
    label: '🚰 Drinking Water',
    prompt: 'I have a drinking water problem in my village',
    color: '#0EA5E9',
    bgColor: '#E0F7FA',
    borderColor: '#81D4FA'
  },
  {
    id: 'irrigation',
    icon: Wheat,
    label: '🌾 Irrigation Water',
    prompt: 'My crops need irrigation water',
    color: '#65A30D',
    bgColor: '#F7FEE7',
    borderColor: '#BEF264'
  },
  {
    id: 'electricity',
    icon: Zap,
    label: '⚡ Electricity',
    prompt: 'We have frequent power cuts',
    color: '#F59E0B',
    bgColor: '#FFFBEB',
    borderColor: '#FDE68A'
  },
  {
    id: 'healthcare',
    icon: Heart,
    label: '🏥 Healthcare',
    prompt: 'No doctors in our hospital',
    color: '#DC2626',
    bgColor: '#FEE2E2',
    borderColor: '#FCA5A5'
  },
];

// Application flow constants
export const APPLICATION_WEBSITE_URL = 'https://raghunandanrao.in/apply';

export const applicationMessages = {
  askStatus: 'Have you already submitted an application for this issue on our website?',
  askId: 'Please provide your Application ID or Reference Number.',
  confirmId: (id: string) => `Thank you. Application ID ${id} recorded.`,
  suggestApply: `To help you better, please first submit your application on our official website: ${APPLICATION_WEBSITE_URL}`,
  whatToDo: 'What would you like to do?',
  applyFirst: `Please visit ${APPLICATION_WEBSITE_URL} to submit your application. Come back after you receive your Application ID!`,
  continueWithout: "Understood. I'll help you without an Application ID."
};
