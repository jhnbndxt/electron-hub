import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { GraduationCap, Lightbulb, Trophy, Zap, Quote, Sparkles } from "lucide-react";
import campusPreview from "../../assets/electron_malanday_campus.jpg";

export function About() {
  return (
    <div>
      {/* Hero Section with Gradient Background */}
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

        {/* Hero Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-6 border border-white/20">
            <Sparkles className="w-4 h-4 text-yellow-300" />
            <span className="text-sm font-medium">Excellence Since 2002</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight">
            About Electron College
          </h1>
          <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto font-light">
            Shaping Tomorrow's Leaders Today
          </p>
        </div>
      </section>

      {/* Mission Section - 2x2 Grid with Icons */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: "#1E3A8A" }}>
              Our Mission
            </h2>
            <p className="text-xl text-gray-600">
              Four Pillars of Excellence
            </p>
            <div className="w-24 h-1 mx-auto mt-4 rounded-full" style={{ backgroundColor: "#B91C1C" }}></div>
          </div>

          {/* 2x2 Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {/* Mission 1 */}
            <div className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-2xl transition-all duration-300 border-t-4 hover:transform hover:-translate-y-1" style={{ borderColor: "#1E3A8A" }}>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-16 h-16 rounded-full flex items-center justify-center shadow-md" style={{ backgroundColor: "#1E3A8A" }}>
                  <GraduationCap className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-3" style={{ color: "#1E3A8A" }}>
                    Quality & Comprehensive Academic Learning
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    To provide students with quality and comprehensive academic learning to become globally competitive and acclaimed professionals.
                  </p>
                </div>
              </div>
            </div>

            {/* Mission 2 */}
            <div className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-2xl transition-all duration-300 border-t-4 hover:transform hover:-translate-y-1" style={{ borderColor: "#B91C1C" }}>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-16 h-16 rounded-full flex items-center justify-center shadow-md" style={{ backgroundColor: "#B91C1C" }}>
                  <Lightbulb className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-3" style={{ color: "#B91C1C" }}>
                    TECH-VOC Experts & Entrepreneurs
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    To prepare them to become highly specialized TECH-VOC experts ready to conquer the challenges of innovation in the industry and community as a worker and as an entrepreneur.
                  </p>
                </div>
              </div>
            </div>

            {/* Mission 3 */}
            <div className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-2xl transition-all duration-300 border-t-4 hover:transform hover:-translate-y-1" style={{ borderColor: "#1E3A8A" }}>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-16 h-16 rounded-full flex items-center justify-center shadow-md" style={{ backgroundColor: "#1E3A8A" }}>
                  <Trophy className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-3" style={{ color: "#1E3A8A" }}>
                    E-Games & Sports Excellence
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    To produce eminent personalities in the field of e-games, mental and physical sports.
                  </p>
                </div>
              </div>
            </div>

            {/* Mission 4 */}
            <div className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-2xl transition-all duration-300 border-t-4 hover:transform hover:-translate-y-1" style={{ borderColor: "#B91C1C" }}>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-16 h-16 rounded-full flex items-center justify-center shadow-md" style={{ backgroundColor: "#B91C1C" }}>
                  <Zap className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-3" style={{ color: "#B91C1C" }}>
                    Emerging Technologies & Advancement
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    To equip students with emerging technologies coupled with guiding principles to attain highest degree of technological advancement.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Vision Section - Large Centered Quote Style */}
      <section className="py-20" style={{ backgroundColor: "#F8FAFC" }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-6" style={{ backgroundColor: "#1E3A8A" }}>
              <Quote className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-12" style={{ color: "#1E3A8A" }}>
              Our Vision
            </h2>
          </div>

          {/* Vision Statement in Quote Style */}
          <blockquote className="relative">
            <div className="absolute top-0 left-0 transform -translate-x-4 -translate-y-4">
              <Quote className="w-16 h-16 text-blue-100" />
            </div>
            <p className="text-2xl md:text-3xl leading-relaxed text-center text-gray-700 italic font-light px-8 md:px-16 relative z-10">
              "In the years to come, all Electron College graduates will be universally recognized as renowned Filipinos carrying the pride as excellent in academics, expert in technical-vocational skills, champion in e-games, as well as in mental and physical sports and highly abreast in technological advancements."
            </p>
            <div className="absolute bottom-0 right-0 transform translate-x-4 translate-y-4">
              <Quote className="w-16 h-16 text-blue-100 rotate-180" />
            </div>
          </blockquote>
        </div>
      </section>

      {/* History Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: "#1E3A8A" }}>
              Our History: Electron Malanday
            </h2>
            <div className="w-24 h-1 mx-auto rounded-full" style={{ backgroundColor: "#B91C1C" }}></div>
          </div>

          {/* Image First - Full Width */}
          <div className="relative max-w-4xl mx-auto mb-12">
            <div className="absolute inset-0 rounded-2xl transform translate-x-4 translate-y-4" style={{ backgroundColor: "#1E3A8A", opacity: 0.1 }}></div>
            <ImageWithFallback
              src={campusPreview}
              alt="Electron College Malanday Building"
              className="relative z-10 rounded-2xl shadow-2xl w-full h-[500px] object-cover"
            />
            
            {/* Badge Overlay */}
            <div className="absolute bottom-8 right-8 z-20 bg-white rounded-xl shadow-lg p-4 border-l-4" style={{ borderColor: "#B91C1C" }}>
              <p className="text-sm font-semibold text-gray-600 mb-1">Since</p>
              <p className="text-3xl font-bold" style={{ color: "#1E3A8A" }}>2002</p>
            </div>
          </div>

          {/* Story Text Below - Full Width */}
          <div className="max-w-6xl mx-auto space-y-6">
            <p className="text-lg text-gray-700 leading-relaxed">
              Electron College of Technical Education was established in 2002 by Dr. Dominador "Dennis" Solis and Dr. Lea Galicia-Solis, the co-founders of the institution. What started as a small 28-square-meter repair shop, Electron Electronic Center (EEC), quickly evolved into a premier technical training institution. The institution was formally registered as Electron Technical Training Center and later became Electron College of Technical Education in 2010.
            </p>
            
            <p className="text-lg text-gray-700 leading-relaxed">
              From its humble beginnings, Electron College has expanded its programs to offer a wide array of technical and degree courses. The institution takes pride in its hands-on approach to education, ensuring that students receive real-world training under expert supervision.
            </p>
            
            <p className="text-lg text-gray-700 leading-relaxed">
              The vision for Electron College started with a strong belief in providing accessible, quality technical education to Filipinos. Dr. Dennis Solis, with his deep expertise in electronics and engineering, recognized the gap in practical skills training in the country.
            </p>

            <p className="text-lg text-gray-700 leading-relaxed">
              Through sheer determination, the school grew from a small repair center into a full-fledged technical training institution. Over the years, it has evolved into a multi-campus college known for producing highly skilled graduates who excel in various industries, both locally and internationally.
            </p>

            <p className="text-lg text-gray-700 leading-relaxed">
              The expansion and success of Electron College would not have been possible without the dedication and leadership of Dr. Dennis Solis and Dr. Lea Galicia-Solis. As visionary educators and entrepreneurs, they played crucial roles in the institution's growth.
            </p>

            <p className="text-lg text-gray-700 leading-relaxed">
              Dr. Dennis focused on technical innovation and curriculum development, ensuring that the programs remained relevant to industry needs.
            </p>

            <p className="text-lg text-gray-700 leading-relaxed">
              Meanwhile, Dr. Lea worked tirelessly behind the scenes—handling operations, student affairs, and business expansions that have strengthened Electron College's foundation. Their combined perseverance, from managing administrative functions to ensuring student welfare, has greatly contributed to the school's transformation into a thriving educational institution.
            </p>

            <p className="text-lg text-gray-700 leading-relaxed">
              Today, Electron College remains committed to innovation, continuously enhancing its curriculum, modernizing facilities, and strengthening industry partnerships to ensure that students receive the best possible education and career opportunities.
            </p>

            {/* Decorative Element */}
            <div className="flex items-center gap-4 pt-6">
              <div className="w-12 h-1 rounded-full" style={{ backgroundColor: "#1E3A8A" }}></div>
              <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                Established in Malanday, Valenzuela
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-16" style={{ backgroundColor: "#1E3A8A" }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Join the Electron College Family
          </h2>
          <p className="text-xl text-blue-100 mb-8 leading-relaxed">
            Be part of a community that values excellence, innovation, and holistic development. 
            Start your journey with us today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/enrollment-info"
              className="px-8 py-4 rounded-lg font-semibold text-lg transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              style={{ backgroundColor: "#B91C1C", color: "white" }}
            >
              Learn About Enrollment
            </a>
            <a
              href="/contact"
              className="px-8 py-4 bg-white rounded-lg font-semibold text-lg transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 border-2 border-white"
              style={{ color: "#1E3A8A" }}
            >
              Contact Us
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}