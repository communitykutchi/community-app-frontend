import React from "react";
import { Link } from "react-router-dom";

export default function Home() {
  const quickActions = [
    {
      title: "Community Feed",
      description: "Follow posts, photos, and updates shared by members.",
      icon: "📰",
      to: "/feed",
      badge: "Social",
      badgeColor: "bg-teal-50 text-teal-700 border-teal-200",
    },
    {
      title: "Official Notices",
      description: "Mayyat announcements, Janaza timings, and Jamaat notices.",
      icon: "📢",
      to: "/notices",
      badge: "Announcements",
      badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
    },
    {
      title: "Community Polls",
      description: "Vote on active community decisions and view live results.",
      icon: "🗳️",
      to: "/polls",
      badge: "Voting",
      badgeColor: "bg-purple-50 text-purple-700 border-purple-200",
    },
    {
      title: "Jobs & Opportunities",
      description: "Explore career vacancies or post job openings.",
      icon: "💼",
      to: "/jobs",
      badge: "Careers",
      badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
    {
      title: "Friends & Members",
      description: "Search community members, add friends, and connect.",
      icon: "👥",
      to: "/friends",
      badge: "Directory",
      badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
    },
    {
      title: "Direct Messages",
      description: "Chat 1-on-1 with confirmed friends in real time.",
      icon: "💬",
      to: "/chats",
      badge: "Messaging",
      badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-200",
    },
    {
      title: "Help & Support",
      description: "Find FAQs, report issues, or contact Jamaat admins.",
      icon: "❓",
      to: "/help",
      badge: "Guidance",
      badgeColor: "bg-slate-100 text-slate-700 border-slate-200",
    },
    {
      title: "My Profile",
      description: "Update personal details, family count, and CNIC.",
      icon: "👤",
      to: "/profile",
      badge: "Account",
      badgeColor: "bg-teal-50 text-teal-700 border-teal-200",
    },
  ];

  const highlights = [
    { title: "Real-Time Updates", desc: "Instant notifications for Mayyat alerts, Janaza timings, and notices.", icon: "⚡" },
    { title: "Job & Business Network", desc: "Connect employers with job seekers inside the Kutchi community.", icon: "🤝" },
    { title: "Democratic Voting", desc: "Participate in transparent community decisions and elections.", icon: "🗳️" },
    { title: "Jamaat Direct Line", desc: "Direct support contact with Jamaat administrators and moderators.", icon: "🛡️" },
  ];

  return (
    <div className="w-full space-y-8 py-2">
      {/* Premium Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 p-8 text-white shadow-xl md:p-10 border border-slate-800">
        <div className="absolute right-0 top-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-teal-500/10 blur-3xl" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-teal-500/10 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-teal-300 border border-teal-500/30">
              <img src="/logo.png" alt="Logo" className="h-4 w-4 object-contain" />
              <span>OFFICIAL DIGITAL PORTAL</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white sm:text-4xl md:text-5xl leading-tight">
              Welcome to All Kutchi Community Hub
            </h1>
            <p className="text-sm text-slate-300 md:text-base leading-relaxed">
              An all-in-one digital portal connecting members across Pakistan and worldwide. Stay informed with official notices, Mayyat announcements, career opportunities, and direct messaging.
            </p>
            
            <div className="pt-3 flex flex-wrap gap-3">
              <Link
                to="/feed"
                className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-3 text-xs font-bold text-white shadow-lg shadow-teal-600/30 hover:bg-teal-500 transition active:scale-95"
              >
                <span>📰</span> Explore Feed
              </Link>
              <Link
                to="/notices"
                className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-5 py-3 text-xs font-bold text-white border border-white/20 hover:bg-white/20 transition active:scale-95"
              >
                <span>📢</span> View Notices & Mayyat
              </Link>
            </div>
          </div>

          <div className="hidden md:flex flex-col items-center justify-center p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md text-center max-w-xs">
            <img src="/logo.png" alt="Splash Logo" className="h-24 w-24 object-contain drop-shadow-md animate-pulse" />
            <h3 className="mt-3 text-sm font-bold text-white">All Kutchi Community</h3>
            <p className="mt-1 text-[11px] text-teal-300">Connected • Reliable • Fast</p>
          </div>
        </div>
      </div>

      {/* Quick Action Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">Portal Services & Modules</h2>
            <p className="text-xs font-semibold text-slate-500">Quickly access key sections of the community portal</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((item) => (
            <Link
              key={item.title}
              to={item.to}
              className="group flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-teal-500/50 hover:shadow-md"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-2xl transition-transform group-hover:scale-110">{item.icon}</span>
                  <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold border ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                </div>
                <h3 className="mt-3 text-sm font-extrabold text-slate-900 group-hover:text-teal-700 transition">{item.title}</h3>
                <p className="mt-1 text-xs text-slate-500 leading-relaxed">{item.description}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-teal-600 group-hover:translate-x-1 transition">
                <span>Access Module</span>
                <span>→</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Why This Space & Tip Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-extrabold text-slate-900">Why All Kutchi Community Portal?</h2>
          <p className="mt-1 text-xs text-slate-500">Built to empower our community members and streamline Jamaat communication.</p>

          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {highlights.map((h, i) => (
              <div key={i} className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                <span className="text-2xl">{h.icon}</span>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">{h.title}</h4>
                  <p className="mt-1 text-[11px] text-slate-500 leading-relaxed">{h.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Daily Tip Card */}
        <div className="rounded-3xl border border-teal-200 bg-teal-50/60 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">💡</span>
              <h3 className="text-sm font-bold text-teal-900">Jamaat Daily Tip</h3>
            </div>
            <p className="mt-3 text-xs text-teal-800 leading-relaxed font-medium">
              Keep your profile details up to date (occupations, family count, Jamaat branch). It helps Jamaat admins maintain accurate records and contact you during emergencies or event invitations.
            </p>
          </div>

          <Link
            to="/profile"
            className="mt-6 block text-center rounded-xl bg-teal-600 py-2.5 text-xs font-bold text-white shadow-md shadow-teal-600/20 hover:bg-teal-500 transition"
          >
            Update My Profile
          </Link>
        </div>
      </div>
    </div>
  );
}
