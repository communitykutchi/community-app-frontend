import React from "react";
import { Link } from "react-router-dom";
import SEO from "../components/SEO";

export default function Home() {
  const quickActions = [
    {
      title: "Direct Chat & Messages",
      description: "Chat 1-on-1 with confirmed friends in real time.",
      icon: "💬",
      to: "/chats",
      badge: "⚡ Live Chat",
      badgeBg: "bg-emerald-100/90 text-emerald-950 border border-emerald-300/80 font-black",
      iconBg: "bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-xs",
      btnBg: "bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-800 text-white shadow-md shadow-emerald-600/25",
      btnText: "💬 Click to Chat",
      subText: "Real-Time",
      pulseColor: "bg-emerald-500",
      subTextBg: "bg-emerald-50 text-emerald-800 border border-emerald-200/80",
    },
    {
      title: "Community Feed",
      description: "Follow posts, photos, and updates shared by members.",
      icon: "📰",
      to: "/feed",
      badge: "📰 Social Feed",
      badgeBg: "bg-blue-100/90 text-blue-950 border border-blue-300/80 font-black",
      iconBg: "bg-blue-50 text-blue-700 border border-blue-200/80 shadow-xs",
      btnBg: "bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white shadow-md shadow-blue-600/25",
      btnText: "📰 Open Feed",
      subText: "Updates",
      pulseColor: "bg-blue-500",
      subTextBg: "bg-blue-50 text-blue-800 border border-blue-200/80",
    },
    {
      title: "Official Notices",
      description: "Mayyat announcements, Janaza timings, and Jamaat notices.",
      icon: "📢",
      to: "/notices",
      badge: "📢 Important",
      badgeBg: "bg-amber-100/90 text-amber-950 border border-amber-300/80 font-black",
      iconBg: "bg-amber-50 text-amber-700 border border-amber-200/80 shadow-xs",
      btnBg: "bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 hover:from-amber-700 hover:to-orange-800 text-white shadow-md shadow-amber-600/25",
      btnText: "📢 View Notices",
      subText: "Jamaat",
      pulseColor: "bg-amber-500",
      subTextBg: "bg-amber-50 text-amber-900 border border-amber-200/80",
    },
    {
      title: "Community Polls",
      description: "Vote on active community decisions and view live results.",
      icon: "🗳️",
      to: "/polls",
      badge: "🗳️ Active Vote",
      badgeBg: "bg-purple-100/90 text-purple-950 border border-purple-300/80 font-black",
      iconBg: "bg-purple-50 text-purple-700 border border-purple-200/80 shadow-xs",
      btnBg: "bg-gradient-to-r from-purple-600 via-violet-600 to-purple-700 hover:from-purple-700 hover:to-violet-800 text-white shadow-md shadow-purple-600/25",
      btnText: "🗳️ Vote Now",
      subText: "Live Results",
      pulseColor: "bg-purple-500",
      subTextBg: "bg-purple-50 text-purple-900 border border-purple-200/80",
    },
    {
      title: "Local Workers (کاریگر)",
      description: "Find local Electricians, Plumbers, Mistri, Painters & Mechanics in your area.",
      icon: "🛠️",
      to: "/workers",
      badge: "🛠️ Local Workers",
      badgeBg: "bg-teal-100/90 text-teal-950 border border-teal-300/80 font-black",
      iconBg: "bg-teal-50 text-teal-700 border border-teal-200/80 shadow-xs",
      btnBg: "bg-gradient-to-r from-teal-600 via-cyan-700 to-teal-700 hover:from-teal-700 hover:to-cyan-800 text-white shadow-md shadow-teal-600/25",
      btnText: "🛠️ Find Workers",
      subText: "Workers",
      pulseColor: "bg-teal-500",
      subTextBg: "bg-teal-50 text-teal-900 border border-teal-200/80",
    },
    {
      title: "Friends & Members",
      description: "Search community members, add friends, and connect.",
      icon: "👥",
      to: "/friends",
      badge: "👥 Directory",
      badgeBg: "bg-sky-100/90 text-sky-950 border border-sky-300/80 font-black",
      iconBg: "bg-sky-50 text-sky-700 border border-sky-200/80 shadow-xs",
      btnBg: "bg-gradient-to-r from-sky-600 via-blue-700 to-sky-700 hover:from-sky-700 hover:to-blue-800 text-white shadow-md shadow-sky-600/25",
      btnText: "👥 Find Friends",
      subText: "Members",
      pulseColor: "bg-sky-500",
      subTextBg: "bg-sky-50 text-sky-900 border border-sky-200/80",
    },
    {
      title: "Help & Support",
      description: "Find FAQs, report issues, or contact Jamaat admins.",
      icon: "❓",
      to: "/help",
      badge: "❓ Help Desk",
      badgeBg: "bg-rose-100/90 text-rose-950 border border-rose-300/80 font-black",
      iconBg: "bg-rose-50 text-rose-700 border border-rose-200/80 shadow-xs",
      btnBg: "bg-gradient-to-r from-rose-600 via-pink-600 to-rose-700 hover:from-rose-700 hover:to-pink-800 text-white shadow-md shadow-rose-600/25",
      btnText: "❓ Get Support",
      subText: "Guidance",
      pulseColor: "",
      subTextBg: "bg-rose-50 text-rose-900 border border-rose-200/80",
    },
    {
      title: "My Profile",
      description: "Update personal details, family count, and CNIC.",
      icon: "👤",
      to: "/profile",
      badge: "👤 Account",
      badgeBg: "bg-indigo-100/90 text-indigo-950 border border-indigo-300/80 font-black",
      iconBg: "bg-indigo-50 text-indigo-700 border border-indigo-200/80 shadow-xs",
      btnBg: "bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-700 hover:from-indigo-700 hover:to-violet-800 text-white shadow-md shadow-indigo-600/25",
      btnText: "👤 Open Profile",
      subText: "Settings",
      pulseColor: "",
      subTextBg: "bg-indigo-50 text-indigo-900 border border-indigo-200/80",
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
      <SEO pageKey="home" />
      {/* Premium Hero Banner */}
      <div className="page-hero-banner relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-600 via-emerald-600 to-teal-700 via-teal-950 to-slate-900 p-6 sm:p-8 text-white shadow-xl md:p-10 border border-slate-200">
        <div className="absolute right-0 top-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-teal-500/10 blur-3xl" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8 text-left">
          <div className="space-y-3 max-w-2xl mx-0 flex flex-col items-start">
            <div className="inline-flex items-center gap-2 rounded-full bg-teal-500/10 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-teal-300 border border-teal-500/30">
              <img src="/logo.png" alt="Logo" className="h-4 w-4 object-contain" />
              <span>OFFICIAL DIGITAL PORTAL</span>
            </div>
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-white leading-tight">
              Welcome to All Kutchi Community Hub
            </h1>
            <p className="text-xs sm:text-sm text-teal-100/90 md:text-base leading-relaxed">
              An all-in-one digital portal connecting members across Pakistan and worldwide. Stay informed with official notices, Mayyat announcements, career opportunities, and direct messaging.
            </p>
            
            <div className="pt-2 flex flex-col items-start gap-2 w-full">
              <Link
                to="/feed"
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs px-3.5 py-2 shadow-md shadow-teal-900/40 border border-teal-400/30 transition-all duration-200 hover:scale-[1.02] active:scale-95 whitespace-nowrap"
              >
                <span>📰</span>
                <span>Explore Feed</span>
              </Link>
              <Link
                to="/notices"
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-900 font-bold text-xs px-3.5 py-2 shadow-sm border border-slate-200 transition-all duration-200 hover:scale-[1.02] active:scale-95 whitespace-nowrap"
              >
                <span>📢</span>
                <span>View Notices & Mayyat</span>
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

      {/* Quick Action Grid - Portal Services & Modules */}
      <div>
        <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between text-center sm:text-left mb-4 gap-2">
          <div className="flex flex-col items-center sm:items-start">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 text-teal-800 border border-teal-200 text-xs font-extrabold uppercase tracking-wider mb-1">
              <span>⚡ Core Services</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Portal Services & Modules
            </h2>
            <p className="text-xs font-bold text-slate-600">
              Quickly access key sections of the community portal
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((item) => (
            <div
              key={item.to}
              className="group relative flex flex-col justify-between overflow-hidden rounded-2xl bg-white border border-slate-200/90 p-5 shadow-sm hover:shadow-xl hover:border-slate-300 hover:-translate-y-1.5 transition-all duration-300"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className={`relative flex items-center justify-center h-10 w-10 rounded-xl text-xl shadow-xs group-hover:scale-110 transition-transform ${item.iconBg}`}>
                    {item.icon}
                    {item.pulseColor && (
                      <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${item.pulseColor} opacity-75`}></span>
                        <span className={`relative inline-flex rounded-full h-3 w-3 ${item.pulseColor}`}></span>
                      </span>
                    )}
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-[10px] uppercase tracking-wider ${item.badgeBg}`}>
                    {item.badge}
                  </span>
                </div>

                <h3 className="mt-4 text-base font-extrabold text-slate-900 leading-snug">
                  {item.title}
                </h3>
                <p className="mt-1.5 text-xs text-slate-600 leading-relaxed font-medium">
                  {item.description}
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                <Link
                  to={item.to}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-extrabold transition group-hover:scale-105 active:scale-95 ${item.btnBg}`}
                >
                  <span>{item.btnText}</span>
                  <span className="transition-transform group-hover:translate-x-0.5">→</span>
                </Link>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${item.subTextBg}`}>
                  {item.subText}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Why This Space & Tip Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Why Community Card */}
        <div className="lg:col-span-2 relative overflow-hidden rounded-3xl border border-teal-200 bg-white p-6 sm:p-8 text-slate-900 shadow-xl">
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full bg-teal-50 px-3.5 py-1 text-[10px] font-black uppercase tracking-wider text-teal-700 border border-teal-200 mb-2">
              <span>🛡️ COMMUNITY GUIDANCE</span>
            </div>
            <h2 className="text-xl font-black text-slate-900">Why All Kutchi Community Portal?</h2>
            <p className="mt-1 text-xs text-slate-600 font-medium">Built to empower our community members and streamline Jamaat communication.</p>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {highlights.map((h, i) => (
                <div key={i} className="group flex items-start gap-3.5 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 hover:bg-teal-50/60 hover:border-teal-300 transition-all duration-200">
                  <div className="h-10 w-10 shrink-0 rounded-xl bg-teal-100 text-teal-700 border border-teal-200 flex items-center justify-center text-xl shadow-xs group-hover:scale-110 transition-transform">
                    {h.icon}
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900 group-hover:text-teal-700 transition">{h.title}</h4>
                    <p className="mt-1 text-[11px] text-slate-600 leading-relaxed font-medium">{h.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Daily Tip Card */}
        <div className="relative overflow-hidden rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100/60 p-6 sm:p-8 text-slate-900 shadow-xl flex flex-col justify-between">
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div className="h-10 w-10 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center text-2xl shadow-xs">
                💡
              </div>
              <span className="rounded-full bg-amber-100 text-amber-800 border border-amber-300 text-[10px] font-black uppercase tracking-wider px-3 py-1">
                Daily Tip
              </span>
            </div>

            <h3 className="mt-4 text-base font-black text-slate-900">Jamaat Daily Tip</h3>
            <p className="mt-2 text-xs text-slate-700 leading-relaxed font-medium">
              Keep your profile details up to date (occupations, family count, Jamaat branch). It helps Jamaat admins maintain accurate records and contact you during emergencies or event invitations.
            </p>
          </div>

          <Link
            to="/profile"
            className="relative z-10 mt-6 block text-center rounded-xl bg-amber-500 hover:bg-amber-600 py-3 text-xs font-black text-white shadow-md shadow-amber-500/25 transition active:scale-95"
          >
            <span>👤 Update My Profile</span>
            <span className="ml-1">→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
