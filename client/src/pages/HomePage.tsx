import { ChatbotWidget } from '../components/ChatbotWidget';

/**
 * HomePage
 * Main page for MRR Constituency Office platform with AI chatbot widget
 */

export const HomePage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Regular Website Content */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">MRR Constituency Office</h1>
          <p className="text-gray-600 mt-2">MP Madhavaneni Raghunandan Rao - Serving Medak Constituency</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-teal-600 to-teal-700 text-white rounded-2xl p-12 mb-12">
          <div className="max-w-3xl">
            <h2 className="text-4xl font-bold mb-4">
              Your Gateway to Constituency Services and Issue Resolution
            </h2>
            <p className="text-xl text-teal-100 mb-6">
              Report water problems, agriculture issues, electricity complaints, healthcare concerns, and more - directly to MP office
            </p>
            <button className="bg-white text-teal-700 px-8 py-3 rounded-full font-semibold hover:bg-teal-50 transition-all">
              Report Issue
            </button>
          </div>
        </section>

        {/* Content Sections */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="bg-white p-8 rounded-xl shadow-md">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">🏛️ Primary Issues</h3>
            <ul className="space-y-3 text-gray-700">
              <li>• Drinking Water & Irrigation</li>
              <li>• Agriculture & Crop Loss</li>
              <li>• Electricity & Power Issues</li>
              <li>• Healthcare & Medical Aid</li>
            </ul>
          </div>

          <div className="bg-white p-8 rounded-xl shadow-md">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">🏥 Additional Services</h3>
            <ul className="space-y-3 text-gray-700">
              <li>• Employment & MGNREGA</li>
              <li>• Housing & Welfare Schemes</li>
              <li>• Transport & Road Repair</li>
              <li>• Education & Pension Issues</li>
            </ul>
          </div>
        </div>

        {/* About Section */}
        <section className="bg-white p-12 rounded-xl shadow-md mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">About MRR Constituency</h2>
          <div className="prose prose-lg max-w-none text-gray-700">
            <p className="mb-4">
              MP Madhavaneni Raghunandan Rao represents the Medak constituency and is dedicated to 
              addressing the concerns and issues of all citizens in the region. Our office serves as 
              a direct bridge between the people and government services.
            </p>
            <p className="mb-4">
              We provide comprehensive support for constituency issues including water supply, 
              agriculture, electricity, healthcare, employment, housing, and infrastructure development. 
              Our AI-powered assistance ensures that every citizen receives prompt attention.
            </p>
            <p>
              Through our digital platform and direct engagement, we're committed to ensuring 
              transparent governance and effective resolution of citizen concerns in Medak constituency.
            </p>
          </div>
        </section>

        {/* Contact Section */}
        <section className="bg-teal-50 p-12 rounded-xl border-2 border-teal-200">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Contact MP Office</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">📞 Emergency Helpline</h4>
              <p className="text-gray-700">112 (Emergency Services)</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">📧 Email Support</h4>
              <p className="text-gray-700">office@mrrmedak.gov.in</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">📍 Report Issues</h4>
              <p className="text-gray-700">Use our chatbot to report constituency issues</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-gray-900 text-white py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p>&copy; 2024 MRR Constituency Office. All rights reserved.</p>
        </div>
      </footer>

      {/* AI Chatbot Widget - MRR Constituency Assistant */}
      <ChatbotWidget />
    </div>
  );
};

export default HomePage;
