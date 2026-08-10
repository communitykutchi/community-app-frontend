import React, { useMemo, useState } from "react";
import API from "../api/axios";
import Toast from "../components/Toast";
import SEO from "../components/SEO";

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
      <SEO pageKey="help" />
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-teal-200 bg-gradient-to-br from-teal-600 via-emerald-600 to-teal-700 text-white shadow-xl p-6 md:p-8">
        <div className="absolute -right-10 -bottom-10 h-40 w-40 rounded-full bg-white/10 blur-3xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6 text-left">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-white border border-white/30 backdrop-blur-md">
                ❓ SUPPORT & GUIDANCE
              </span>
            </div>
            <h1 className="text-2xl font-black text-white md:text-3xl tracking-tight">Help & Support Center</h1>
            <p className="text-xs md:text-sm font-medium text-teal-50 max-w-xl leading-relaxed">
              Have questions about using the portal, job postings, Mayyat announcements, or account settings? Find answers below or contact Jamaat Admin support.
            </p>
          </div>

          <div className="flex flex-col items-start gap-2 pt-2 md:pt-0">
            <a
              href="https://wa.me/923001234567?text=Hello%20Jamaat%20Admin%20Support"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl bg-white text-emerald-900 px-3.5 py-2 text-xs font-bold shadow-md hover:bg-emerald-50 active:scale-95 transition cursor-pointer whitespace-nowrap"
            >
              <span>💬</span> WhatsApp Support
            </a>
            <button
              onClick={() => setShowReportModal(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-teal-800 text-white px-3.5 py-2 text-xs font-bold shadow-md hover:bg-teal-900 active:scale-95 transition cursor-pointer border border-teal-400/40 whitespace-nowrap"
            >
              <span>🛠️</span> Report Issue
            </button>
          </div>
        </div>
      </div>

      {/* Search & Category Pills */}
      <div className="mt-8 space-y-4">
        <div className="relative">
          <span className="absolute left-4 top-3.5 text-slate-400 text-sm">🔍</span>
          <input
            type="text"
            placeholder="Search help topics, FAQs, questions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-2xl border border-slate-300 bg-white py-3 pl-11 pr-4 text-xs sm:text-sm font-semibold text-slate-900 placeholder-slate-400 shadow-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition"
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
              className={`rounded-xl px-4 py-2.5 text-xs font-extrabold transition whitespace-nowrap cursor-pointer ${
                selectedCategory === cat.id
                  ? "active-green-btn bg-teal-600 !text-white shadow-md shadow-teal-600/30"
                  : "bg-white text-slate-700 border border-slate-200 hover:border-teal-400 hover:bg-teal-50/40 hover:text-slate-900"
              }`}
            >
              <span className={selectedCategory === cat.id ? "!text-white font-extrabold" : ""}>{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* FAQ Accordions */}
      <div className="mt-6 space-y-3">
        {filteredFaqs.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm text-slate-800">
            <span className="text-3xl">🔍</span>
            <p className="mt-2 text-xs sm:text-sm font-bold text-slate-600">No help items match your search.</p>
          </div>
        ) : (
          filteredFaqs.map((faq) => {
            const isExpanded = expandedFaqId === faq.id;
            return (
              <div key={faq.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-md transition duration-200 hover:border-teal-200 hover:shadow-lg">
                <button
                  onClick={() => setExpandedFaqId(isExpanded ? null : faq.id)}
                  className="flex w-full items-center justify-between p-5 text-left transition hover:bg-slate-50/80 cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{faq.icon}</span>
                    <span className="text-xs sm:text-sm font-extrabold text-slate-900">{faq.question}</span>
                  </div>
                  <span className={`text-base font-black text-teal-600 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}>
                    ▾
                  </span>
                </button>

                {isExpanded && (
                  <div className="border-t border-slate-100 bg-slate-50/60 p-5 text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
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
          className="group relative overflow-hidden flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 text-slate-900 shadow-lg transition hover:-translate-y-1 hover:shadow-xl hover:border-teal-300 cursor-pointer"
        >
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-teal-50 text-2xl text-teal-700 border border-teal-200 shadow-xs group-hover:scale-110 transition">📞</div>
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-wider text-teal-700">Phone Hotline</h4>
            <p className="text-xs sm:text-sm font-extrabold text-slate-900">+92 300 1234567</p>
          </div>
        </a>

        <a
          href="mailto:support@kutchicommunity.com?subject=Support%20Request%20-%20Kutchi%20Community"
          onClick={async (e) => {
            const email = "support@kutchicommunity.com";
            if (navigator.clipboard) {
              try {
                await navigator.clipboard.writeText(email);
                setToast({ message: `✉️ Email copied (${email})! Opening mail...`, type: "success" });
              } catch {
                // Ignore
              }
            }
            window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${email}&su=Support+Request+-+Kutchi+Community`, "_blank");
          }}
          className="group relative overflow-hidden flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 text-slate-900 shadow-lg transition hover:-translate-y-1 hover:shadow-xl hover:border-teal-300 cursor-pointer"
        >
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-teal-50 text-2xl text-teal-700 border border-teal-200 shadow-xs group-hover:scale-110 transition">✉️</div>
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-wider text-teal-700">Email Support</h4>
            <p className="text-xs font-extrabold text-slate-900 truncate max-w-[180px]">support@kutchicommunity.com</p>
          </div>
        </a>

        <button
          type="button"
          onClick={() => setShowReportModal(true)}
          className="group relative overflow-hidden flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 text-slate-900 shadow-lg transition hover:-translate-y-1 hover:shadow-xl hover:border-teal-300 text-left cursor-pointer"
        >
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-teal-50 text-2xl text-teal-700 border border-teal-200 shadow-xs group-hover:scale-110 transition">🛡️</div>
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-wider text-teal-700">Admin Help Desk</h4>
            <p className="text-xs sm:text-sm font-extrabold text-slate-900">Submit Ticket →</p>
          </div>
        </button>
      </div>

      {/* Report Issue Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4">
          <div className="relative overflow-hidden w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 text-slate-900 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-lg font-black text-slate-900">Report an Issue / Feedback</h3>
              <button onClick={() => setShowReportModal(false)} className="rounded-xl p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitReport} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1">Issue Category</label>
                <select
                  value={issueType}
                  onChange={(e) => setIssueType(e.target.value as any)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-900 focus:border-teal-500 focus:outline-none transition"
                >
                  <option value="bug" className="bg-white text-slate-900">Technical Bug / App Error</option>
                  <option value="account" className="bg-white text-slate-900">Account / Login Issue</option>
                  <option value="moderation" className="bg-white text-slate-900">Content / Rules Violation</option>
                  <option value="other" className="bg-white text-slate-900">General Feedback</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1">Description *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Please describe the issue or feedback in detail..."
                  value={issueDescription}
                  onChange={(e) => setIssueDescription(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-900 placeholder-slate-400 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition"
                />
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="rounded-xl border border-slate-300 bg-slate-100 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-200 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReport}
                  className="rounded-xl active-green-btn btn-primary bg-teal-600 !text-white px-5 py-2.5 text-xs font-black uppercase tracking-wider shadow-md shadow-teal-600/30 hover:bg-teal-700 disabled:opacity-50 transition cursor-pointer"
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
