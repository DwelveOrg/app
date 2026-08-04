"use client";

import { useTheme } from "next-themes";
import { ToastContainer, Slide } from "react-toastify";

export default function Toaster() {
  const { resolvedTheme } = useTheme();

  return (
    <ToastContainer
      position="top-right"
      autoClose={4000}
      limit={3}
      newestOnTop
      transition={Slide}
      // toast.css overrides every colour we care about, but react-toastify's own
      // --toastify-* variables (progress rail track, dismiss affordances) follow
      // this prop — pinning it to "light" left those on the light set in dark mode.
      theme={resolvedTheme === "dark" ? "dark" : "light"}
      hideProgressBar={false}
      closeOnClick
      pauseOnHover
      pauseOnFocusLoss
      draggable
    />
  );
}
