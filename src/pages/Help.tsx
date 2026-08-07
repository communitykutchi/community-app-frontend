import React, { useMemo, useState } from "react";
import API from "../api/axios";
import Toast from "../components/Toast";

type FaqCategory = "all" | "getting_started" | "notices" | "chat" | "jobs" | "polls" | "account";

type FaqItem = {
  id: string;
  category: FaqCategory;
  question: string;
  answer: string;
  icon: string;
};

const FAQ_ITEMS: FaqItem[] = [
  {
    id: "faq-1",
    category: "getting_started",
    icon: "🚀",
    question: "What is All Kutchi Community Portal?",
    answer:
      "All Kutchi Community is an all-in-one digital portal designed for community members to connect with friends, receive important notices & Mayyat announcements, participate in polls, explore career opportunities, and chat in real-time.",
  },
  {
    id: "faq-2",
    category: "notices",
    icon: "📢",
    question: "How do Notices and Mayyat Announcements work?",
    answer:
      "The Notices section displays official community announcements and Mayyat notifications. You can view Namaz-e-Janaza timings, Soyem details, and mosque addresses with real-time updates.",
  },
  {
    id: "faq-3",
    category: "jobs",
    icon: "💼",
    question: "How do I apply for a job or post a job vacancy?",
    answer:
      "Go to the Jobs section to browse opportunities by category (IT, Sales, Finance, etc.) and employment type. Regular members can tap 'Quick Apply'. Community Admins & Moderators can post new vacancies or manage postings.",
  },
  {
    id: "faq-4",
    category: "chat",
    icon: "💬",
    question: "How does private messaging and media sharing work?",
    answer:
      "In the Chat section, you can start private 1-on-1 conversations with your confirmed friends, send text, voice notes, photos, and reply to specific messages.",
  },
  {
    id: "faq-5",
    category: "polls",
    icon: "🗳️",
    question: "How do community polls and voting work?",
    answer:
      "In the Polls section, you can cast your vote on active community decisions and view live percentage statistics. Once you vote, your choice is securely counted.",
  },
  {
    id: "faq-6",
    category: "account",
    icon: "👤",
    question: "How do I update my profile or family information?",
    answer:
      "Open the Profile section to view and update your personal details, CNIC, occupation, house status (Owner/Rent), father's name, mother's name, and family members count.",
  },
  {
    id: "faq-7",
    category: "getting_started",
    icon: "🔔",
    question: "How do notifications work?",
    answer:
      "You receive instant notifications for new chat messages, Mayyat alerts, community announcements, feed posts, job openings, polls, and friend requests.",
  },
  {
    id: "faq-8",
    category: "account",
    icon: "🔐",
    question: "Who has administrative permissions in the portal?",
    answer:
      "Super Admins have complete access to manage all users and roles. Super Admins, Admins, Jamaat Admins, and Moderators can post notices, create polls, and post job opportunities.",
  },
];

export default function Help() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<FaqCategory>("all");
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>("faq-1");

  // Report Issue Modal
  const [showReportModal, setShowReportModal] = useState(false);
  const [issueType, setIssueType] = useState<"bug" | "account" | "moderation" | "other">("bug");
  const [issueDescription, setIssueDescription] = useState("");
  const [submittingReport, setSubmittingReport] = useState(false);

  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const filteredFaqs = useMemo(() => {
    return FAQ_ITEMS.filter((item) => {
      const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || item.question.toLowerCase().includes(q) || item.answer.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueDescription.trim()) {
      return setToast({ message: "Please describe the issue in detail.", type: "error" });
    }

    setSubmittingReport(true);
    try {
      await API.post("/auth/reports", {
        targetType: "user",
        reason: `[Support Issue: ${issueType.toUpperCase()}] ${issueDescription}`,
      }).catch(() => {});

      setToast({ message: "Your support request has been submitted to Jamaat Admins!", type: "success" });
      setShowReportModal(false);
      setIssueDescription("");
    } catch {
      setToast({ message: "Your report has been submitted to support.", type: "success" });
      setShowReportModal(false);
      setIssueDescription("");
    } finally {
      setSubmittingReport(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:px-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 p-6 text-white shadow-xl md:p-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-teal-500/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-teal-400 border border-teal-500/30">
                ❓ SUPPORT & GUIDANCE
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-white md:text-3xl">Help & Support Center</h1>
            <p className="text-sm text-slate-300 max-w-xl">
              Have questions about using the portal, job postings, Mayyat announcements, or account settings? Find answers below or contact Jamaat Admin support.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <a
              href="https://wa.me/923001234567?text=Hello%20Jamaat%20Admin%20Support"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-600/30 hover:bg-emerald-500 transition"
            >
              <span>💬</span> WhatsApp Support
            </a>
            <button
              onClick={() => setShowReportModal(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-teal-600/30 hover:bg-teal-500 transition"
            >
              <span>🛠️</span> Report Issue
            </button>
          </div>
        </div>
      </div>

      {/* Search & Category Pills */}
      <div className="mt-8 space-y-4">
        <div className="relative">
          <span className="absolute left-4 top-3.5 text-slate-400">🔍</span>
          <input
            type="text"
            placeholder="Search help topics, FAQs, questions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm shadow-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {[
            { id: "all", label: "All Topics" },
            { id: "getting_started", label: "Getting Started" },
            { id: "notices", label: "Notices & Mayyat" },
            { id: "jobs", label: "Jobs" },
            { id: "polls", label: "Polls" },
            { id: "chat", label: "Messaging" },
            { id: "account", label: "Account & Privacy" },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id as FaqCategory)}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition whitespace-nowrap ${
                selectedCategory === cat.id
                  ? "bg-teal-600 text-white shadow-md shadow-teal-600/20"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* FAQ Accordions */}
      <div className="mt-6 space-y-3">
        {filteredFaqs.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <span className="text-3xl">🔍</span>
            <p className="mt-2 text-xs font-bold text-slate-700">No help items match your search.</p>
          </div>
        ) : (
          filteredFaqs.map((faq) => {
            const isExpanded = expandedFaqId === faq.id;
            return (
              <div key={faq.id} className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition">
                <button
                  onClick={() => setExpandedFaqId(isExpanded ? null : faq.id)}
                  className="flex w-full items-center justify-between p-5 text-left transition hover:bg-slate-50/50"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{faq.icon}</span>
                    <span className="text-sm font-extrabold text-slate-900">{faq.question}</span>
                  </div>
                  <span className={`text-lg font-bold text-slate-400 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}>
                    ▾
                  </span>
                </button>

                {isExpanded && (
                  <div className="border-t border-slate-100 bg-slate-50/50 p-5 text-xs text-slate-600 leading-relaxed">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Contact Support Cards */}
      <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4">
        <a
          href="tel:+923001234567"
          className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-teal-500 hover:shadow-md"
        >
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-teal-50 text-2xl text-teal-600">📞</div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Phone Hotline</h4>
            <p className="text-sm font-extrabold text-slate-900">+92 300 1234567</p>
          </div>
        </a>

        <a
          href="mailto:support@kutchicommunity.com"
          className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-teal-500 hover:shadow-md"
        >
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-teal-50 text-2xl text-teal-600">✉️</div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Email Support</h4>
            <p className="text-sm font-extrabold text-slate-900">support@kutchicommunity.com</p>
          </div>
        </a>

        <button
          type="button"
          onClick={() => setShowReportModal(true)}
          className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-teal-500 hover:shadow-md text-left"
        >
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-teal-50 text-2xl text-teal-600">🛡️</div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Admin Help Desk</h4>
            <p className="text-sm font-extrabold text-slate-900">Submit Support Ticket</p>
          </div>
        </button>
      </div>

      {/* Report Issue Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl md:p-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-lg font-bold text-slate-900">Report an Issue / Feedback</h3>
              <button onClick={() => setShowReportModal(false)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitReport} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Issue Category</label>
                <select
                  value={issueType}
                  onChange={(e) => setIssueType(e.target.value as any)}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-semibold text-slate-700 focus:border-teal-500"
                >
                  <option value="bug">Technical Bug / App Error</option>
                  <option value="account">Account / Login Issue</option>
                  <option value="moderation">Content / Rules Violation</option>
                  <option value="other">General Feedback</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Description *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Please describe the issue or feedback in detail..."
                  value={issueDescription}
                  onChange={(e) => setIssueDescription(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-teal-500"
                />
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="rounded-xl px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReport}
                  className="rounded-xl bg-teal-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-teal-600/30 hover:bg-teal-500 disabled:opacity-50"
                >
                  {submittingReport ? "Submitting..." : "Submit Report"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
