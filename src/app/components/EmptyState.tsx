import { FileQuestion, Users, CreditCard, FileText, Activity } from "lucide-react";

interface EmptyStateProps {
  type?: "applications" | "students" | "payments" | "reports" | "activity";
  title?: string;
  message?: string;
}

export function EmptyState({ 
  type = "activity", 
  title,
  message 
}: EmptyStateProps) {
  
  const getIcon = () => {
    switch (type) {
      case "applications":
        return <FileQuestion className="w-16 h-16 text-gray-300" />;
      case "students":
        return <Users className="w-16 h-16 text-gray-300" />;
      case "payments":
        return <CreditCard className="w-16 h-16 text-gray-300" />;
      case "reports":
        return <FileText className="w-16 h-16 text-gray-300" />;
      case "activity":
      default:
        return <Activity className="w-16 h-16 text-gray-300" />;
    }
  };

  const getDefaultTitle = () => {
    switch (type) {
      case "applications":
        return "No Applications Yet";
      case "students":
        return "No Students Enrolled";
      case "payments":
        return "No Payment Records";
      case "reports":
        return "No Reports Available";
      case "activity":
      default:
        return "No Activity Yet";
    }
  };

  const getDefaultMessage = () => {
    return "No data available yet. Records will appear once students begin using the system.";
  };

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="bg-gray-50 rounded-full p-6 mb-4">
        {getIcon()}
      </div>
      <h3 className="text-xl font-semibold text-gray-700 mb-2">
        {title || getDefaultTitle()}
      </h3>
      <p className="text-gray-500 text-center max-w-md">
        {message || getDefaultMessage()}
      </p>
    </div>
  );
}
