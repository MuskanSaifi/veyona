"use client";
import Image from "next/image";

import { useState, useEffect, useRef } from "react";
import { FaTimes, FaPaperPlane, FaCheckCircle, FaUser } from "react-icons/fa";
import toast from "react-hot-toast";
import styles from "./chatbot.module.css";

const CHATBOT_QUESTIONS = [
  {
    id: 1,
    question: "What services are you interested in?",
    options: [
      "Hair Services",
      "Facial & Skincare",
      "Nail Services",
      "Waxing & Threading",
      "Makeup Services",
      "Tattoo",
      "Other",
    ],
  },
  {
    id: 2,
    question: "When would you like to book?",
    options: [
      "Today",
      "This Week",
      "This Month",
      "Not Sure Yet",
    ],
  },
  {
    id: 3,
    question: "What is your preferred time?",
    options: [
      "Morning (9 AM - 12 PM)",
      "Afternoon (12 PM - 5 PM)",
      "Evening (5 PM - 8 PM)",
      "Any Time",
    ],
  },
  {
    id: 4,
    question: "How did you hear about us?",
    options: [
      "Social Media",
      "Friend/Family Referral",
      "Google Search",
      "Walk-in",
      "Other",
    ],
  },
];

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [messages, setMessages] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Initial greeting
      setMessages([
        {
          type: "bot",
          text: "Hey, how can I help you? 😊",
        },
        {
          type: "bot",
          text: CHATBOT_QUESTIONS[0].question,
        },
      ]);
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleAnswer = (questionId, answer) => {
    const question = CHATBOT_QUESTIONS.find((q) => q.id === questionId);
    
    // Add user's answer to messages
    setMessages((prev) => [
      ...prev,
      { type: "user", text: answer },
    ]);

    // Save answer
    setAnswers({
      ...answers,
      [questionId]: {
        question: question.question,
        answer: answer,
      },
    });

    // Add bot's next question or move to form
    if (currentStep < CHATBOT_QUESTIONS.length - 1) {
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            type: "bot",
            text: CHATBOT_QUESTIONS[currentStep + 1].question,
          },
        ]);
        setCurrentStep(currentStep + 1);
      }, 500);
    } else {
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            type: "bot",
            text: "Great! Now I need some contact information to get back to you. Please fill in the details below.",
          },
        ]);
        setShowForm(true);
      }, 500);
    }
  };

  const handleBack = () => {
    if (showForm) {
      setShowForm(false);
      setCurrentStep(CHATBOT_QUESTIONS.length - 1);
      setMessages((prev) => prev.slice(0, -1));
    } else if (currentStep > 0) {
      // Remove last user message and bot message
      setMessages((prev) => prev.slice(0, -2));
      setCurrentStep(currentStep - 1);
      // Remove last answer
      const newAnswers = { ...answers };
      delete newAnswers[CHATBOT_QUESTIONS[currentStep].id];
      setAnswers(newAnswers);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email) {
      toast.error("Please fill in name and email");
      return;
    }

    setSubmitting(true);

    try {
      const selectedQuestions = Object.values(answers);
      
      const res = await fetch("/api/chatbot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          selectedQuestions,
          message: formData.message,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to submit");
      }

      setMessages((prev) => [
        ...prev,
        {
          type: "bot",
          text: "Thank you! We've received your information and will contact you soon. Have a great day! 😊",
        },
      ]);
      
      setSubmitted(true);
      
      // Reset after 3 seconds
      setTimeout(() => {
        setIsOpen(false);
        handleReset();
      }, 3000);
    } catch (error) {
      console.error("Error submitting chatbot form:", error);
      toast.error(error.message || "Failed to submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setCurrentStep(0);
    setAnswers({});
    setShowForm(false);
    setFormData({ name: "", email: "", phone: "", message: "" });
    setSubmitted(false);
    setMessages([]);
  };

  if (!isOpen) {
    return (
      <button
        className={styles.chatbotButton}
        onClick={() => setIsOpen(true)}
        aria-label="Open chatbot"
      >
        <Image
          src="/images/chatbot.jpeg"
          alt="Chatbot"
          width={40}
          height={40}
          className={styles.chatbotIcon}
        />
      </button>
    );
  }

  return (
    <div className={styles.chatbotContainer}>
      <div className={styles.chatbotHeader}>
        <div className={styles.chatbotHeaderContent}>
        <Image
  src="/images/chatbot.jpeg"
  alt="Chatbot"
  width={40}
  height={40}
  className={styles.headerImage}
/>

          <div>
            <h3 className={styles.chatbotTitle}>VEYONA Online</h3>
            <p className={styles.chatbotSubtitle}>We're here to help</p>
          </div>
        </div>
        <button
          className={styles.closeButton}
          onClick={() => {
            setIsOpen(false);
            handleReset();
          }}
          aria-label="Close chatbot"
        >
          <FaTimes />
        </button>
      </div>

      <div className={styles.chatbotContent}>
        {!showForm && !submitted && (
          <div className={styles.messagesContainer}>
            {messages.map((message, index) => (
              <div
                key={index}
                className={`${styles.message} ${
                  message.type === "user" ? styles.userMessage : styles.botMessage
                }`}
              >
               {message.type === "bot" && (
  <div className={styles.botAvatar}>
    <Image
      src="/images/chatbot.jpeg"
      alt="Chatbot"
      width={30}
      height={30}
      className={styles.botAvatarImage}
    />
  </div>
)}
                <div className={styles.messageBubble}>
                  <p>{message.text}</p>
                </div>
                {message.type === "user" && (
                  <div className={styles.userAvatar}>
                    <FaUser />
                  </div>
                )}
              </div>
            ))}
            
            {currentStep < CHATBOT_QUESTIONS.length && (
              <div className={styles.optionsContainer}>
                {CHATBOT_QUESTIONS[currentStep].options.map((option, index) => (
                  <button
                    key={index}
                    className={styles.optionButton}
                    onClick={() =>
                      handleAnswer(CHATBOT_QUESTIONS[currentStep].id, option)
                    }
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}

            {currentStep > 0 && !showForm && (
              <button onClick={handleBack} className={styles.backButton}>
                ← Back
              </button>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}

        {showForm && !submitted && (
          <form onSubmit={handleSubmit} className={styles.chatbotForm}>
            <div className={styles.formHeader}>
              <h3>Contact Information</h3>
              <p>Please provide your details so we can get back to you</p>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="name">Name *</label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
                placeholder="Enter your name"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="email">Email *</label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
                placeholder="Enter your email"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="phone">Phone</label>
              <input
                type="tel"
                id="phone"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                placeholder="Enter your phone number"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="message">Additional Message (Optional)</label>
              <textarea
                id="message"
                value={formData.message}
                onChange={(e) =>
                  setFormData({ ...formData, message: e.target.value })
                }
                rows={3}
                placeholder="Any additional information..."
              />
            </div>

            <div className={styles.formActions}>
              <button
                type="button"
                onClick={handleBack}
                className={styles.backButton}
              >
                Back
              </button>
              <button
                type="submit"
                className={styles.submitButton}
                disabled={submitting}
              >
                {submitting ? "Submitting..." : "Submit"}
                <FaPaperPlane />
              </button>
            </div>
          </form>
        )}

        {submitted && (
          <div className={styles.successMessage}>
            <FaCheckCircle className={styles.successIcon} />
            <h3>Thank You!</h3>
            <p>We've received your information and will contact you soon.</p>
          </div>
        )}
      </div>
    </div>
  );
}
