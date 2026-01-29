import {FileText,AlertCircle,MapPin} from 'lucide-react';

export const primaryActions = [
  { 
    id: 'track', 
    icon: FileText, 
    label: 'Track Status', 
    prompt: 'I want to track my application status', 
    color: '#3B82F6',
    bgColor: '#EFF6FF',
    borderColor: '#93C5FD'
  },
  { 
    id: 'report', 
    icon: AlertCircle, 
    label: 'Report Issue', 
    prompt: 'I need to file a report or complaint', 
    color: '#F97316',
    bgColor: '#FFF7ED',
    borderColor: '#FDBA74'
  },
  { 
    id: 'find', 
    icon: MapPin, 
    label: 'Find Center', 
    prompt: 'Help me find the nearest service center', 
    color: '#14B8A6',
    bgColor: '#F0FDFA',
    borderColor: '#5EEAD4'
  },
  { 
    id: 'emergency', 
    icon: AlertCircle, 
    label: 'Emergency Help', 
    prompt: 'I need emergency assistance', 
    color: '#DC2626',
    bgColor: '#FEE2E2',
    borderColor: '#FCA5A5'
  },
];