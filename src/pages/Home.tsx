import React from "react";
import { Link } from "react-router-dom";

export default function Home() {
  const quickActions = [
    {
      title: "Direct Chat & Messages",
      description: "Chat 1-on-1 with confirmed friends in real time.",
      icon: "💬",
      to: "/chats",
      badge: "⚡ Live Chat",
      gradient: "from-teal-700 via-teal-800 to-slate-900 shadow-teal-800/30 border-teal-500/40",
      badgeBg: "bg-emerald-500/20 text-emerald-300 border-emerald-400/30",
      btnBg: "bg-emerald-500 hover:bg-emerald-400 text-slate-950",
      btnText: "💬 Click to Chat",
      subText: "Real-Time",
      pulseColor: "bg-emerald-400",
    },
    {
      title: "Community Feed",
      description: "Follow posts, photos, and updates shared by members.",
      icon: "📰",
      to: "/feed",
      badge: "📰 Social Feed",
      gradient: "from-slate-900 via-teal-950 to-slate-950 shadow-teal-900/30 border-teal-500/30",
      badgeBg: "bg-teal-500/20 text-teal-300 border-teal-400/30",
      btnBg: "bg-teal-500 hover:bg-teal-400 text-slate-950",
      btnText: "📰 Open Feed",
      subText: "Updates",
      pulseColor: "bg-teal-400",
    },
    {
      title: "Official Notices",
      description: "Mayyat announcements, Janaza timings, and Jamaat notices.",
      icon: "📢",
      to: "/notices",
      badge: "📢 Important",
      gradient: "from-amber-950 via-slate-900 to-amber-900 shadow-amber-900/30 border-amber-500/30",
      badgeBg: "bg-amber-500/20 text-amber-300 border-amber-400/30",
      btnBg: "bg-amber-500 hover:bg-amber-400 text-slate-950",
      btnText: "📢 View Notices",
      subText: "Jamaat",
      pulseColor: "bg-amber-400",
    },
    {
      title: "Community Polls",
      description: "Vote on active community decisions and view live results.",
      icon: "🗳️",
      to: "/polls",
      badge: "🗳️ Active Vote",
      gradient: "from-purple-950 via-slate-900 to-indigo-950 shadow-purple-900/30 border-purple-500/30",
      badgeBg: "bg-purple-500/20 text-purple-300 border-purple-400/30",
      btnBg: "bg-purple-500 hover:bg-purple-400 text-slate-950",
      btnText: "🗳️ Vote Now",
      subText: "Live Results",
      pulseColor: "bg-purple-400",
    },
    {
      title: "Local Workers (کاریگر)",
      description: "Find local Electricians, Plumbers, Mistri, Painters & Mechanics in your area.",
      icon: "🛠️",
      to: "/workers",
      badge: "🛠️ Local Workers",
      gradient: "from-emerald-950 via-slate-900 to-teal-950 shadow-emerald-900/30 border-emerald-500/30",
      badgeBg: "bg-emerald-500/20 text-emerald-300 border-emerald-400/30",
      btnBg: "bg-emerald-500 hover:bg-emerald-400 text-slate-950",
      btnText: "🛠️ Find Workers",
      subText: "Workers",
      pulseColor: "bg-emerald-400",
    },
    {
      title: "Friends & Members",
      description: "Search community members, add friends, and connect.",
      icon: "👥",
      to: "/friends",
      badge: "👥 Directory",
      gradient: "from-blue-950 via-slate-900 to-indigo-950 shadow-blue-900/30 border-blue-500/30",
      badgeBg: "bg-blue-500/20 text-blue-300 border-blue-400/30",
      btnBg: "bg-blue-500 hover:bg-blue-400 text-slate-950",
      btnText: "👥 Find Friends",
      subText: "Members",
      pulseColor: "bg-blue-400",
    },
    {
      title: "Help & Support",
      description: "Find FAQs, report issues, or contact Jamaat admins.",
      icon: "❓",
      to: "/help",
      badge: "❓ Help Desk",
      gradient: "from-slate-900 via-slate-950 to-slate-900 shadow-slate-900/40 border-slate-700/50",
      badgeBg: "bg-slate-500/20 text-slate-300 border-slate-400/30",
      btnBg: "bg-slate-200 hover:bg-white text-slate-950",
      btnText: "❓ Get Support",
      subText: "Guidance",
      pulseColor: "",
    },
    {
      title: "My Profile",
      description: "Update personal details, family count, and CNIC.",
      icon: "👤",
      to: "/profile",
      badge: "👤 Account",
      gradient: "from-teal-950 via-slate-900 to-emerald-950 shadow-teal-900/30 border-teal-500/30",
      badgeBg: "bg-teal-500/20 text-teal-300 border-teal-400/30",
      btnBg: "bg-teal-500 hover:bg-teal-400 text-slate-950",
      btnText: "👤 Open Profile",
      subText: "Settings",
      pulseColor: "",
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
              key={item.to}
              to={item.to}
              className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl bg-gradient-to-br ${item.gradient} p-5 text-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl border`}
            >
              <div className="absolute -right-6 -bottom-6 h-28 w-28 rounded-full bg-white/10 blur-xl group-hover:scale-150 transition-transform duration-500" />

              <div>
                <div className="flex items-center justify-between">
                  <div className="relative flex items-center justify-center h-10 w-10 rounded-xl bg-white/15 backdrop-blur-md border border-white/20 text-2xl shadow-inner group-hover:scale-110 transition-transform">
                    {item.icon}
                    {item.pulseColor && (
                      <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${item.pulseColor} opacity-75`}></span>
                        <span className={`relative inline-flex rounded-full h-3 w-3 ${item.pulseColor}`}></span>
                      </span>
                    )}
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-black border uppercase tracking-wider ${item.badgeBg}`}>
                    {item.badge}
                  </span>
                </div>

                <h3 className="mt-4 text-base font-black text-white group-hover:text-teal-200 transition">
                  {item.title}
                </h3>
                <p className="mt-1 text-xs text-slate-200 leading-relaxed font-medium">
                  {item.description}
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-white/15 flex items-center justify-between text-xs font-black text-white">
                <span className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-extrabold shadow-md transition group-hover:scale-105 ${item.btnBg}`}>
                  <span>{item.btnText}</span>
                  <span>→</span>
                </span>
                <span className="text-xs text-slate-300 font-bold opacity-90">{item.subText}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Why This Space & Tip Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Why Community Card */}
        <div className="lg:col-span-2 relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 p-6 sm:p-8 text-white shadow-xl">
          <div className="absolute -top-12 -right-12 h-48 w-48 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full bg-teal-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-teal-300 border border-teal-500/30 mb-2">
              <span>🛡️ COMMUNITY GUIDANCE</span>
            </div>
            <h2 className="text-xl font-black text-white">Why All Kutchi Community Portal?</h2>
            <p className="mt-1 text-xs text-slate-300 font-medium">Built to empower our community members and streamline Jamaat communication.</p>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {highlights.map((h, i) => (
                <div key={i} className="group flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md hover:bg-white/10 hover:border-teal-500/40 transition-all duration-200">
                  <div className="h-10 w-10 shrink-0 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-xl shadow-inner group-hover:scale-110 transition-transform">
                    {h.icon}
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white group-hover:text-teal-300 transition">{h.title}</h4>
                    <p className="mt-1 text-[11px] text-slate-300 leading-relaxed font-medium">{h.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Daily Tip Card */}
        <div className="relative overflow-hidden rounded-3xl border border-teal-500/40 bg-gradient-to-br from-teal-900 via-emerald-950 to-slate-950 p-6 sm:p-8 text-white shadow-xl flex flex-col justify-between">
          <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-emerald-500/15 blur-2xl pointer-events-none" />

          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div className="h-10 w-10 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-2xl shadow-inner">
                💡
              </div>
              <span className="rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 text-[10px] font-black uppercase tracking-wider px-3 py-1">
                Daily Tip
              </span>
            </div>

            <h3 className="mt-4 text-base font-black text-white">Jamaat Daily Tip</h3>
            <p className="mt-2 text-xs text-slate-200 leading-relaxed font-medium">
              Keep your profile details up to date (occupations, family count, Jamaat branch). It helps Jamaat admins maintain accurate records and contact you during emergencies or event invitations.
            </p>
          </div>

          <Link
            to="/profile"
            className="relative z-10 mt-6 block text-center rounded-xl bg-emerald-500 hover:bg-emerald-400 py-3 text-xs font-black text-slate-950 shadow-lg shadow-emerald-500/20 transition active:scale-95"
          >
            <span>👤 Update My Profile</span>
            <span className="ml-1">→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
