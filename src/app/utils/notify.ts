import toast from "react-hot-toast";

export const notify = {
  success: (message: string) => toast.success(message, { duration: 2000 }),
  error: (message: string) => toast.error(message, { duration: 2000 }),
  warning: (message: string) => toast(message, { icon: "!", duration: 2000 }),
  info: (message: string) => toast(message, { icon: "i", duration: 2000 }),
};