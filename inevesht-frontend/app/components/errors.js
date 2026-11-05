"use client";

import { useEffect, useState } from "react";

// Reusable toast notification component.
// Props:
//   message  — the text to display; passing an empty string hides the toast
//   type     — "error" | "success" controls the color styling
//   onClose  — callback invoked after the exit animation completes
export default function Errors({ message, type, onClose }) {

    // Controls the exit animation class; true while the fade-out is playing
    const [isHiding, setIsHiding] = useState(false);

    useEffect(() => {
        // Do nothing if there is no active message
        if (!message) return;

        // Auto-dismiss the toast after 5 seconds
        const timer = setTimeout(() => {
            handleClose();
        }, 5000);

        // Cleanup: cancel the timer if the message changes before 5 seconds elapse
        return () => clearTimeout(timer);
    }, [message]);

    const handleClose = () => {
        // Trigger the CSS exit animation
        setIsHiding(true);

        // Wait for the exit animation (300ms) to finish before clearing the message
        // from the parent state, so the toast doesn't disappear abruptly
        setTimeout(() => {
            setIsHiding(false);
            if (onClose) onClose();
        }, 300);
    };

    // Render nothing when there is no message to show
    if (!message) return null;

    return (
        <div className="toast-container-custom">
            <div className={`minimal-toast ${type === "error" ? "error" : "success"} ${isHiding ? "hiding" : ""}`}>

                {/* Toast message text */}
                <span className="toast-text">{message}</span>

                {/* Close button: clicking it triggers the exit animation immediately */}
                <button className="toast-close" type="button" aria-label="Close" onClick={handleClose}>
                    {/* X inside a circle icon */}
                    <svg className="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="15" y1="9" x2="9" y2="15"></line>
                        <line x1="9" y1="9" x2="15" y2="15"></line>
                    </svg>
                </button>

            </div>
        </div>
    );
}