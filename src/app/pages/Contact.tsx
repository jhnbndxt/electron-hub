import { Mail, Phone, MapPin, Clock, Sparkles, MessageCircle } from "lucide-react";
import { useState } from "react";
import { notify } from "../utils/notify";

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
    notify.success("Thank you for your message. We will get back to you soon!");
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
    <div className="w-full overflow-x-hidden">
      {/* Hero Section with Gradient */}
      <section
        className="relative overflow-hidden py-16 text-white sm:py-24 lg:py-32"
        style={{ 
          background: "linear-gradient(135deg, #1E3A8A 0%, #1e40af 50%, #2563eb 100%)"
        }}
      >
        {/* Decorative Elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 backdrop-blur-sm sm:mb-6">
            <MessageCircle className="w-4 h-4 text-yellow-300" />
            <span className="text-sm font-medium">We're Here to Help</span>
          </div>
          
          <h1 className="mb-4 text-4xl font-bold tracking-tight sm:mb-6 sm:text-5xl md:text-7xl">
            Contact Us
          </h1>
          <p className="mx-auto max-w-3xl text-base font-light leading-relaxed text-blue-100 sm:text-xl md:text-2xl">
            Get in touch with us for any inquiries or assistance
          </p>
        </div>
      </section>

      {/* Contact Content */}
      <section className="bg-white py-10 sm:py-14 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid min-w-0 grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
            {/* Contact Information */}
            <div className="min-w-0">
              <h2 className="mb-4 text-3xl font-bold sm:mb-6 sm:text-4xl" style={{ color: "#1E3A8A" }}>
                Get In Touch
              </h2>
              <p className="mb-6 text-base leading-relaxed text-gray-600 sm:mb-10 sm:text-lg">
                Have questions about enrollment, our programs, or the assessment system?
                We're here to help. Reach out to us through any of the following channels:
              </p>

              <div className="space-y-3 sm:space-y-6">
                {/* Address */}
                <div className="flex min-w-0 items-start gap-3 rounded-xl p-3 transition-colors hover:bg-gray-50 sm:gap-4 sm:p-4">
                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full shadow-md sm:h-14 sm:w-14"
                    style={{ backgroundColor: "#1E3A8A" }}
                  >
                    <MapPin className="h-5 w-5 text-white sm:h-7 sm:w-7" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold mb-2" style={{ color: "#1F2937" }}>
                      Address
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      596 McArthur Highway, Malanday, Valenzuela City, 1444, Metro Manila
                    </p>
                  </div>
                </div>

                {/* Phone */}
                <div className="flex min-w-0 items-start gap-3 rounded-xl p-3 transition-colors hover:bg-gray-50 sm:gap-4 sm:p-4">
                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full shadow-md sm:h-14 sm:w-14"
                    style={{ backgroundColor: "#1E3A8A" }}
                  >
                    <Phone className="h-5 w-5 text-white sm:h-7 sm:w-7" />
                  </div>
                  <div className="min-w-0 flex-1">
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
                <div className="flex min-w-0 items-start gap-3 rounded-xl p-3 transition-colors hover:bg-gray-50 sm:gap-4 sm:p-4">
                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full shadow-md sm:h-14 sm:w-14"
                    style={{ backgroundColor: "#1E3A8A" }}
                  >
                    <Mail className="h-5 w-5 text-white sm:h-7 sm:w-7" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold mb-2" style={{ color: "#1F2937" }}>
                      Email
                    </h3>
                    <a 
                      href="mailto:electroncollege2002@electroncollege.edu.ph" 
                      className="break-all text-gray-600 transition-colors hover:text-blue-600"
                    >
                      electroncollege2002@electroncollege.edu.ph
                    </a>
                  </div>
                </div>

                {/* Office Hours */}
                <div className="flex min-w-0 items-start gap-3 rounded-xl p-3 transition-colors hover:bg-gray-50 sm:gap-4 sm:p-4">
                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full shadow-md sm:h-14 sm:w-14"
                    style={{ backgroundColor: "#B91C1C" }}
                  >
                    <Clock className="h-5 w-5 text-white sm:h-7 sm:w-7" />
                  </div>
                  <div className="min-w-0 flex-1">
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
            <div className="min-w-0 rounded-2xl bg-gradient-to-br from-gray-50 to-blue-50 p-5 shadow-xl sm:p-8 lg:p-10">
              <h2 className="mb-5 text-2xl font-bold sm:mb-6 sm:text-3xl" style={{ color: "#1E3A8A" }}>
                Send Us a Message
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
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
      <section className="py-10 sm:py-16" style={{ backgroundColor: "var(--electron-light-gray)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="mb-6 text-center text-2xl sm:mb-8 sm:text-3xl" style={{ color: "var(--electron-blue)" }}>
            Find Us
          </h2>
          <div className="h-[280px] overflow-hidden rounded-lg bg-white shadow-lg sm:h-[380px] lg:h-[450px]">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3858.929256610402!2d120.9550477758758!3d14.71659157422483!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3397b39615a3724f%3A0x4489491a2e00c9a6!2sElectron%20College!5e0!3m2!1sen!2sph!4v1777181635629!5m2!1sen!2sph"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Electron College Location - Valenzuela City"
            />
          </div>
          <div className="mt-6 text-center">
            <p className="text-gray-600" style={{ fontSize: "14px" }}>
              <strong>596 McArthur Highway, Malanday, Valenzuela City, 1444, Metro Manila</strong>
            </p>
            <p className="text-gray-500 text-sm mt-2">
              Located in Malanday, Valenzuela City - Easily accessible via McArthur Highway
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}