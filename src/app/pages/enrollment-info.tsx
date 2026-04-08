import { Link } from "react-router";
import { CheckCircle, FileText, Upload, Send } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";

const requirements = [
  "Completed Assessment Form (via Electron Hub)",
  "Form 138 (Report Card) - Original and Photocopy",
  "Birth Certificate (PSA Copy)",
  "2x2 ID Photos (3 copies)",
  "Good Moral Certificate from previous school",
  "Certificate of Completion (Junior High School)",
];

const enrollmentSteps = [
  {
    step: 1,
    title: "Create Account",
    description: "Register or login to Electron Hub portal",
    icon: FileText,
  },
  {
    step: 2,
    title: "Complete Assessment",
    description: "Take the AI-assisted strand assessment",
    icon: CheckCircle,
  },
  {
    step: 3,
    title: "Submit Requirements",
    description: "Upload required documents online",
    icon: Upload,
  },
  {
    step: 4,
    title: "Final Submission",
    description: "Review and submit enrollment application",
    icon: Send,
  },
];

export function EnrollmentInfoPage() {
  return (
    <div>
      {/* Header */}
      <section className="bg-[#1E3A8A] text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-5xl mb-4">Enrollment Information</h1>
          <p className="text-xl text-blue-100">
            Your guide to enrolling at Electron College
          </p>
        </div>
      </section>

      {/* Introduction */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="text-4xl mb-6 text-[#1E3A8A]">
              Welcome to Online Enrollment
            </h2>
            <p className="text-lg text-gray-700 mb-6">
              Electron Hub makes the enrollment process simple and convenient.
              Complete your enrollment from the comfort of your home by
              following our streamlined online process.
            </p>
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
              <p className="text-lg mb-4">
                <strong className="text-[#B91C1C]">Enrollment Period:</strong>
              </p>
              <p className="text-gray-700">
                March 1 - May 31, 2026 for Academic Year 2026-2027
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Enrollment Process */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl mb-4 text-[#1E3A8A]">
              Enrollment Process
            </h2>
            <p className="text-lg text-gray-600">
              Four simple steps to complete your enrollment
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {enrollmentSteps.map((item) => {
              const Icon = item.icon;
              return (
                <Card
                  key={item.step}
                  className="p-6 border-2 border-gray-200 hover:border-[#1E3A8A] transition-colors"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-[#B91C1C] text-white w-10 h-10 rounded-full flex items-center justify-center">
                      {item.step}
                    </div>
                    <Icon className="h-6 w-6 text-[#1E3A8A]" />
                  </div>
                  <h3 className="text-xl mb-2">{item.title}</h3>
                  <p className="text-gray-600">{item.description}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Requirements */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl mb-4 text-[#1E3A8A]">
              Enrollment Requirements
            </h2>
            <p className="text-lg text-gray-600">
              Prepare these documents before starting your enrollment
            </p>
          </div>

          <div className="max-w-3xl mx-auto">
            <Card className="p-8 border-2 border-gray-200">
              <ul className="space-y-4">
                {requirements.map((requirement, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-[#1E3A8A] flex-shrink-0 mt-1" />
                    <span className="text-lg text-gray-700">{requirement}</span>
                  </li>
                ))}
              </ul>
            </Card>

            <div className="mt-8 bg-red-50 border-2 border-red-200 rounded-lg p-6">
              <h3 className="text-xl mb-3 text-[#B91C1C]">
                Important Note
              </h3>
              <p className="text-gray-700">
                All documents must be scanned and uploaded in PDF or JPG format.
                File size should not exceed 5MB per document. Original documents
                must be presented during the verification process.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl mb-4 text-[#1E3A8A]">
            Ready to Begin Your Enrollment?
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Choose your path: Create an account to get started or login if you
            already have an account.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/login">
              <Button
                size="lg"
                className="border-2 border-[#1E3A8A] text-[#1E3A8A] bg-white hover:bg-gray-50 w-full sm:w-auto"
              >
                Login to Continue
              </Button>
            </Link>
            <Link to="/dashboard/enrollment">
              <Button
                size="lg"
                className="bg-[#B91C1C] hover:bg-[#991B1B] w-full sm:w-auto"
              >
                Proceed to Enrollment Form
              </Button>
            </Link>
          </div>

          <p className="text-sm text-gray-500 mt-6">
            Note: You must be logged in to access the enrollment form
          </p>
        </div>
      </section>

      {/* Contact Support */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-[#1E3A8A] text-white rounded-lg p-8 text-center">
            <h2 className="text-3xl mb-4">Need Assistance?</h2>
            <p className="text-lg text-blue-100 mb-6">
              Our admissions team is here to help you with any questions about
              the enrollment process.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/contact">
                <Button
                  size="lg"
                  className="bg-white text-[#1E3A8A] hover:bg-gray-100"
                >
                  Contact Us
                </Button>
              </Link>
              <Button
                size="lg"
                variant="outline"
                className="bg-transparent border-2 border-white text-white hover:bg-white/10"
              >
                Chat with Assistant
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}