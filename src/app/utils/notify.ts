import toast from "react-hot-toast";

export const notify = {
  success: (message: string) => toast.success(message),
  error: (message: string) => toast.error(message, { duration: 7000 }),
  warning: (message: string) => toast(message, { icon: "!", duration: 6000 }),
  info: (message: string) => toast(message, { icon: "i" }),
};