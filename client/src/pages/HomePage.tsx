import { ChatbotWidget } from '../components/ChatbotWidget';

/**
 * HomePage
 * Main page for Public Participation Center platform with AI chatbot widget
 */

export const HomePage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Regular Website Content */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Public Participation Center</h1>
          <p className="text-gray-600 mt-2">Empowering Citizens Through Civic Services</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-teal-600 to-teal-700 text-white rounded-2xl p-12 mb-12">
          <div className="max-w-3xl">
            <h2 className="text-4xl font-bold mb-4">
              Your Gateway to Government Services and Civic Participation
            </h2>
            <p className="text-xl text-teal-100 mb-6">
              Access RTI services, file complaints, get legal aid, emergency assistance, healthcare support, and more - all in one place
            </p>
            <button className="bg-white text-teal-700 px-8 py-3 rounded-full font-semibold hover:bg-teal-50 transition-all">
              Explore Services
            </button>
          </div>
        </section>

        {/* Content Sections */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="bg-white p-8 rounded-xl shadow-md">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">🏛️ Core Services</h3>
            <ul className="space-y-3 text-gray-700">
              <li>• RTI Filing & Tracking</li>
              <li>• Complaint Registration & Resolution</li>
              <li>• Free Legal Aid & Representation</li>
              <li>• 24/7 Emergency Assistance</li>
            </ul>
          </div>

          <div className="bg-white p-8 rounded-xl shadow-md">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">🏥 Support Services</h3>
            <ul className="space-y-3 text-gray-700">
              <li>• Healthcare & Medical Aid</li>
              <li>• PPC Center Locations</li>
              <li>• Civic Education & Awareness</li>
              <li>• Government Scheme Assistance</li>
            </ul>
          </div>
        </div>

        {/* About Section */}
        <section className="bg-white p-12 rounded-xl shadow-md mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">About PPC</h2>
          <div className="prose prose-lg max-w-none text-gray-700">
            <p className="mb-4">
              Public Participation Centers (PPC) are dedicated platforms designed to bridge the gap
              between citizens and government services. Our mission is to make civic participation
              accessible, transparent, and efficient for everyone.
            </p>
            <p className="mb-4">
              We provide comprehensive support for RTI applications, complaint resolution, legal aid,
              emergency assistance, and healthcare services. Our trained staff and AI-powered
              assistance ensure that every citizen receives the help they need.
            </p>
            <p>
              Through our network of centers and digital platforms, we're committed to empowering
              citizens with the tools and knowledge needed for active civic participation and
              accessing their fundamental rights.
            </p>
          </div>
        </section>

        {/* Contact Section */}
        <section className="bg-teal-50 p-12 rounded-xl border-2 border-teal-200">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Contact PPC</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">📞 Emergency Helpline</h4>
              <p className="text-gray-700">1800-PPC-HELP (1800-772-4357)</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">📧 Email Support</h4>
              <p className="text-gray-700">support@ppc.gov.in</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">📍 Find Centers</h4>
              <p className="text-gray-700">Use our chatbot to locate nearest PPC center</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-gray-900 text-white py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p>&copy; 2024 Public Participation Center. All rights reserved.</p>
        </div>
      </footer>

      {/* AI Chatbot Widget - PPC Civic Assistant */}
      <ChatbotWidget />
    </div>
  );
};

export default HomePage;
