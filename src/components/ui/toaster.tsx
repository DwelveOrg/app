"use client";

import { ToastContainer, Slide } from "react-toastify";

export default function Toaster() {
    return (
        <ToastContainer
            position="top-right"
            autoClose={4000}
            limit={3}
            newestOnTop
            transition={Slide}
            theme="light"
            hideProgressBar={false}
            closeOnClick
            pauseOnHover
            pauseOnFocusLoss
            draggable
        />
    );
}
