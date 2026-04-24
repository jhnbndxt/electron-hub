import { Mail, Phone, MapPin, Clock, Sparkles, MessageCircle } from "lucide-react";
import { useState } from "react";

export function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    alert("Thank you for your message. We will get back to you soon!");
    setFormData({ name: "", email: "", subject: "", message: "" });
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div>
      {/* Hero Section with Gradient */}
      <section
        className="relative text-white py-32 overflow-hidden"
        style={{ 
          background: "linear-gradient(135deg, #1E3A8A 0%, #1e40af 50%, #2563eb 100%)"
        }}
      >
        {/* Decorative Elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-6 border border-white/20">
            <MessageCircle className="w-4 h-4 text-yellow-300" />
            <span className="text-sm font-medium">We're Here to Help</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight">
            Contact Us
          </h1>
          <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto font-light">
            Get in touch with us for any inquiries or assistance
          </p>
        </div>
      </section>

      {/* Contact Content */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Information */}
            <div>
              <h2 className="text-4xl font-bold mb-6" style={{ color: "#1E3A8A" }}>
                Get In Touch
              </h2>
              <p className="text-lg text-gray-600 mb-10 leading-relaxed">
                Have questions about enrollment, our programs, or the assessment system?
                We're here to help. Reach out to us through any of the following channels:
              </p>

              <div className="space-y-6">
                {/* Address */}
                <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors">
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 shadow-md"
                    style={{ backgroundColor: "#1E3A8A" }}
                  >
                    <MapPin className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold mb-2" style={{ color: "#1F2937" }}>
                      Address
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      596 McArthur Highway, Malanday, Valenzuela City, 1444, Metro Manila
                    </p>
                  </div>
                </div>

                {/* Phone */}
                <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors">
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 shadow-md"
                    style={{ backgroundColor: "#1E3A8A" }}
                  >
                    <Phone className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold mb-2" style={{ color: "#1F2937" }}>
                      Phone
                    </h3>
                    <a 
                      href="tel:09230889162" 
                      className="text-gray-600 hover:text-blue-600 transition-colors text-lg"
                    >
                      09230889162
                    </a>
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors">
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 shadow-md"
                    style={{ backgroundColor: "#1E3A8A" }}
                  >
                    <Mail className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold mb-2" style={{ color: "#1F2937" }}>
                      Email
                    </h3>
                    <a 
                      href="mailto:electroncollege2002@electroncollege.edu.ph" 
                      className="text-gray-600 hover:text-blue-600 transition-colors"
                    >
                      electroncollege2002@electroncollege.edu.ph
                    </a>
                  </div>
                </div>

                {/* Office Hours */}
                <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors">
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 shadow-md"
                    style={{ backgroundColor: "#B91C1C" }}
                  >
                    <Clock className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold mb-2" style={{ color: "#1F2937" }}>
                      Office Hours
                    </h3>
                    <p className="text-gray-600">Monday - Friday: 8:00 AM - 5:00 PM</p>
                    <p className="text-gray-600">Saturday: 8:00 AM - 12:00 PM</p>
                    <p className="text-gray-600">Sunday: Closed</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="bg-gradient-to-br from-gray-50 to-blue-50 p-10 rounded-2xl shadow-xl">
              <h2 className="text-3xl font-bold mb-6" style={{ color: "#1E3A8A" }}>
                Send Us a Message
              </h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label
                    htmlFor="name"
                    className="block mb-2 font-semibold"
                    style={{ color: "#1F2937" }}
                  >
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors bg-white"
                  />
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="block mb-2 font-semibold"
                    style={{ color: "#1F2937" }}
                  >
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors bg-white"
                  />
                </div>

                <div>
                  <label
                    htmlFor="subject"
                    className="block mb-2 font-semibold"
                    style={{ color: "#1F2937" }}
                  >
                    Subject *
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors bg-white"
                  />
                </div>

                <div>
                  <label
                    htmlFor="message"
                    className="block mb-2 font-semibold"
                    style={{ color: "#1F2937" }}
                  >
                    Message *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={5}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors bg-white"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full px-6 py-4 text-white font-semibold text-lg rounded-lg transition-all shadow-lg hover:shadow-xl hover:transform hover:-translate-y-0.5"
                  style={{ backgroundColor: "#B91C1C" }}
                >
                  Send Message
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section className="py-16" style={{ backgroundColor: "var(--electron-light-gray)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl mb-8 text-center" style={{ color: "var(--electron-blue)" }}>
            Find Us
          </h2>
          <div className="bg-white rounded-lg shadow-lg overflow-hidden" style={{ height: "450px" }}>
            <iframe
              src="https://www.google.com/maps?q=PX85%2BJ2%20Valenzuela%2C%20Metro%20Manila&output=embed"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Electron College Location - PX85+J2 Valenzuela, Metro Manila"
            />
          </div>
          <div className="mt-6 text-center">
            <p className="text-gray-600" style={{ fontSize: "14px" }}>
              <strong>PX85+J2 Valenzuela, Metro Manila</strong>
            </p>
            <p className="text-gray-500 text-sm mt-2">
              Located in Valenzuela, Metro Manila
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}