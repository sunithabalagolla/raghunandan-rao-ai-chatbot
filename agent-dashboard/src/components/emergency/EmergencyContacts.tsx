import React, { useState, useEffect } from 'react';
import { emergencyService } from '../../services/emergencyService';
import type { EmergencyContact } from '../../services/emergencyService';

const EmergencyContacts: React.FC = () => {
  const [contacts, setContacts] = useState<Record<string, EmergencyContact>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    try {
      setLoading(true);
      const contactsData = await emergencyService.getEmergencyContacts();
      setContacts(contactsData);
    } catch (err) {
      setError('Failed to load emergency contacts');
      console.error('Error loading emergency contacts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCall = (phone: string) => {
    window.open(`tel:${phone}`, '_self');
  };

  const handleEmail = (email: string) => {
    window.open(`mailto:${email}`, '_blank');
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center text-red-600">
          <span className="text-2xl mb-2 block">⚠️</span>
          <p>{error}</p>
          <button
            onClick={loadContacts}
            className="mt-2 text-blue-600 hover:text-blue-800 underline"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <span className="text-2xl">🚨</span>
          <h2 className="text-xl font-semibold text-gray-900">
            Emergency Contacts
          </h2>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          Quick access to emergency support contacts
        </p>
      </div>

      <div className="p-6">
        <div className="grid gap-4">
          {Object.entries(contacts).map(([key, contact]) => (
            <div
              key={key}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">
                    {contact.name}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    {contact.department}
                  </p>
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2 text-sm">
                      <span>📞</span>
                      <span className="text-gray-700">{contact.phone}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <span>📧</span>
                      <span className="text-gray-700">{contact.email}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col space-y-2 ml-4">
                  <button
                    onClick={() => handleCall(contact.phone)}
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                  >
                    📞 Call
                  </button>
                  <button
                    onClick={() => handleEmail(contact.email)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                  >
                    📧 Email
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {Object.keys(contacts).length === 0 && (
          <div className="text-center text-gray-500 py-8">
            <span className="text-4xl mb-2 block">📞</span>
            <p>No emergency contacts available</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmergencyContacts;