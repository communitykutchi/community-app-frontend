import React, { useEffect, useState } from "react";
import API from "../api/axios";
import Loader from "../components/Loader";
import Toast from "../components/Toast";
import UserAvatar from "../components/UserAvatar";

export type JobCategory =
  | "Software & IT"
  | "Accounts & Finance"
  | "Sales & Marketing"
  | "Management"
  | "Engineering"
  | "Medical & Healthcare"
  | "Teaching & Education"
  | "Other";

export type JobType = "Full-time" | "Part-time" | "Remote" | "Contract" | "Internship";

export interface JobItem {
  _id: string;
  title: string;
  company: string;
  category: JobCategory;
  jobType: JobType;
  location: string;
  salary?: string;
  description: string;
  requirements?: string[];
  contactEmail?: string;
  contactPhone?: string;
  postedBy?: {
    _id: string;
    fullName?: string;
    profilePhotoUrl?: string;
  };
  createdAt: string;
}

const CATEGORIES: Array<"All" | JobCategory> = [
  "All",
  "Software & IT",
  "Accounts & Finance",
  "Sales & Marketing",
  "Management",
  "Engineering",
  "Medical & Healthcare",
  "Teaching & Education",
  "Other",
];

const JOB_TYPES: Array<"All" | JobType> = ["All", "Full-time", "Part-time", "Remote", "Contract", "Internship"];

export default function Jobs() {
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>("member");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedType, setSelectedType] = useState<string>("All");
  const [viewFilter, setViewFilter] = useState<"all" | "saved" | "applied">("all");

  // Local storage tracking for applied & saved jobs
  const [appliedJobIds, setAppliedJobIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("community_jobs_applied") || "[]");
    } catch {
      return [];
    }
  });

  const [savedJobIds, setSavedJobIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("community_jobs_saved") || "[]");
    } catch {
      return [];
    }
  });

  // Selected Job Details Modal
  const [selectedJob, setSelectedJob] = useState<JobItem | null>(null);

  // Post Job Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [category, setCategory] = useState<JobCategory>("Software & IT");
  const [jobType, setJobType] = useState<JobType>("Full-time");
  const [location, setLocation] = useState("");
  const [salary, setSalary] = useState("");
  const [description, setDescription] = useState("");
  const [requirementsText, setRequirementsText] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchJobs();
    fetchUserRole();
  }, []);

  const fetchUserRole = async () => {
    try {
      const res = await API.get<{ user?: { role?: string } }>("/auth/me");
      if (res.data?.user?.role) {
        setUserRole(res.data.user.role);
      }
    } catch {
      // Ignore
    }
  };

  const fetchJobs = async () => {
    try {
      const res = await API.get<{ success?: boolean; jobs?: JobItem[] }>("/jobs/all");
      if (res.data?.jobs && Array.isArray(res.data.jobs)) {
        setJobs(res.data.jobs);
      } else {
        setJobs([]);
      }
    } catch {
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleSaveJob = (jobId: string) => {
    let nextSaved = [...savedJobIds];
    if (nextSaved.includes(jobId)) {
      nextSaved = nextSaved.filter((id) => id !== jobId);
      setToast({ message: "Job removed from saved items.", type: "success" });
    } else {
      nextSaved.push(jobId);
      setToast({ message: "Job saved to your bookmarks!", type: "success" });
    }
    setSavedJobIds(nextSaved);
    localStorage.setItem("community_jobs_saved", JSON.stringify(nextSaved));
  };

  const toggleApplyJob = (jobId: string) => {
    let nextApplied = [...appliedJobIds];
    if (nextApplied.includes(jobId)) {
      nextApplied = nextApplied.filter((id) => id !== jobId);
      setToast({ message: "Application withdrawn.", type: "success" });
    } else {
      nextApplied.push(jobId);
      setToast({ message: "Application submitted successfully!", type: "success" });
    }
    setAppliedJobIds(nextApplied);
    localStorage.setItem("community_jobs_applied", JSON.stringify(nextApplied));
  };

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !company.trim() || !location.trim() || !description.trim()) {
      return setToast({ message: "Please fill in all required fields.", type: "error" });
    }

    setSubmitting(true);
    try {
      const reqArray = requirementsText.split("\n").map((r) => r.trim()).filter(Boolean);
      const res = await API.post<{ success: boolean; job: JobItem }>("/jobs/create", {
        title,
        company,
        category,
        jobType,
        location,
        salary,
        description,
        requirements: reqArray,
        contactEmail,
        contactPhone,
      });

      if (res.data?.success) {
        setToast({ message: "Job opportunity posted successfully!", type: "success" });
        setShowCreateModal(false);
        setTitle("");
        setCompany("");
        setLocation("");
        setSalary("");
        setDescription("");
        setRequirementsText("");
        setContactEmail("");
        setContactPhone("");
        fetchJobs();
      }
    } catch (err: any) {
      setToast({ message: err.response?.data?.message || "Failed to post job.", type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    if (!window.confirm("Are you sure you want to delete this job vacancy?")) return;
    try {
      const res = await API.delete<{ success: boolean }>(`/jobs/${jobId}`);
      if (res.data?.success) {
        setToast({ message: "Job deleted successfully.", type: "success" });
        setJobs((prev) => prev.filter((j) => j._id !== jobId));
        if (selectedJob?._id === jobId) setSelectedJob(null);
      }
    } catch (err: any) {
      setToast({ message: err.response?.data?.message || "Failed to delete job.", type: "error" });
    }
  };

  const isManager = ["super_admin", "admin", "jamaat_admin", "moderator"].includes((userRole || "").toLowerCase());

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      !searchQuery ||
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.location.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === "All" || job.category === selectedCategory;
    const matchesType = selectedType === "All" || job.jobType === selectedType;

    let matchesView = true;
    if (viewFilter === "saved") matchesView = savedJobIds.includes(job._id);
    if (viewFilter === "applied") matchesView = appliedJobIds.includes(job._id);

    return matchesSearch && matchesCategory && matchesType && matchesView;
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:px-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Hero Header Card */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 p-6 text-white shadow-xl md:p-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-teal-500/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-teal-400 border border-teal-500/30">
                💼 CAREER PORTAL
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-white md:text-3xl">Jobs & Employment Hub</h1>
            <p className="text-sm text-slate-300 max-w-xl">
              Explore verified job vacancies within the Kutchi community, connect directly with employers, or post new opportunities.
            </p>
          </div>

          {isManager && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-teal-600/30 hover:bg-teal-500 transition active:scale-95"
            >
              <span>💼</span> Post Job Vacancy
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="mt-8 space-y-4">
        {/* Search Input */}
        <div className="relative">
          <span className="absolute left-4 top-3.5 text-slate-400">🔍</span>
          <input
            type="text"
            placeholder="Search job title, company, or city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm shadow-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
          />
        </div>

        {/* View Filters (All / Saved / Applied) */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 border-b border-slate-200 w-full pb-2 overflow-x-auto scrollbar-none">
            <button
              onClick={() => setViewFilter("all")}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
                viewFilter === "all" ? "bg-slate-900 text-white" : "bg-white text-slate-600 hover:bg-slate-100"
              }`}
            >
              All Jobs ({jobs.length})
            </button>
            <button
              onClick={() => setViewFilter("saved")}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
                viewFilter === "saved" ? "bg-slate-900 text-white" : "bg-white text-slate-600 hover:bg-slate-100"
              }`}
            >
              Bookmark Saved ({savedJobIds.length})
            </button>
            <button
              onClick={() => setViewFilter("applied")}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
                viewFilter === "applied" ? "bg-slate-900 text-white" : "bg-white text-slate-600 hover:bg-slate-100"
              }`}
            >
              My Applications ({appliedJobIds.length})
            </button>
          </div>
        </div>

        {/* Categories & Job Type Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-xl px-3.5 py-2 text-xs font-bold transition whitespace-nowrap ${
                selectedCategory === cat
                  ? "bg-teal-600 text-white shadow-md shadow-teal-600/20"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Jobs Grid */}
      {loading ? (
        <div className="py-20 flex justify-center">
          <Loader />
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <span className="text-4xl">💼</span>
          <h3 className="mt-4 text-lg font-bold text-slate-900">No Job Openings Found</h3>
          <p className="mt-1 text-xs text-slate-500">Try clearing filters or search queries to see available positions.</p>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredJobs.map((job) => {
            const isApplied = appliedJobIds.includes(job._id);
            const isSaved = savedJobIds.includes(job._id);

            return (
              <div
                key={job._id}
                className="flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:shadow-md"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="inline-block rounded-md bg-teal-50 px-2.5 py-1 text-[11px] font-bold text-teal-700">
                        {job.category}
                      </span>
                      <h3 className="mt-2 text-base font-extrabold text-slate-900">{job.title}</h3>
                      <p className="text-xs font-semibold text-slate-600">{job.company}</p>
                    </div>

                    <button
                      onClick={() => toggleSaveJob(job._id)}
                      className={`rounded-lg p-2 text-lg transition ${isSaved ? "text-amber-500" : "text-slate-300 hover:text-amber-500"}`}
                      title={isSaved ? "Remove Bookmark" : "Save Job"}
                    >
                      {isSaved ? "★" : "☆"}
                    </button>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-slate-700">📍 {job.location}</span>
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-slate-700">⏳ {job.jobType}</span>
                    {job.salary && <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-emerald-700 font-bold">💰 {job.salary}</span>}
                  </div>

                  <p className="mt-3 line-clamp-3 text-xs text-slate-600 leading-relaxed">{job.description}</p>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-3 gap-2">
                  <button
                    onClick={() => setSelectedJob(job)}
                    className="rounded-xl border border-slate-300 px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                  >
                    View Details
                  </button>

                  <div className="flex items-center gap-2">
                    {isManager && (
                      <button
                        onClick={() => handleDeleteJob(job._id)}
                        className="rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-100"
                        title="Delete Job"
                      >
                        🗑️
                      </button>
                    )}

                    <button
                      onClick={() => toggleApplyJob(job._id)}
                      className={`rounded-xl px-4 py-2 text-xs font-bold text-white transition ${
                        isApplied ? "bg-slate-700 hover:bg-slate-800" : "bg-teal-600 hover:bg-teal-500 shadow-md shadow-teal-600/20"
                      }`}
                    >
                      {isApplied ? "✓ Applied" : "Quick Apply"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Selected Job Details Modal */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl md:p-8">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="rounded-md bg-teal-50 px-2.5 py-1 text-xs font-bold text-teal-700">{selectedJob.category}</span>
                <h2 className="mt-2 text-xl font-extrabold text-slate-900">{selectedJob.title}</h2>
                <p className="text-xs font-bold text-slate-600">{selectedJob.company}</p>
              </div>
              <button onClick={() => setSelectedJob(null)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs text-slate-700">
              <div className="flex flex-wrap gap-2 font-semibold">
                <span className="rounded-lg bg-slate-100 px-3 py-1 text-slate-800">📍 Location: {selectedJob.location}</span>
                <span className="rounded-lg bg-slate-100 px-3 py-1 text-slate-800">⏳ Employment: {selectedJob.jobType}</span>
                {selectedJob.salary && <span className="rounded-lg bg-emerald-50 px-3 py-1 text-emerald-800 font-bold">💰 Salary: {selectedJob.salary}</span>}
              </div>

              <div>
                <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider">Job Description</h4>
                <p className="mt-1 leading-relaxed whitespace-pre-line">{selectedJob.description}</p>
              </div>

              {selectedJob.requirements && selectedJob.requirements.length > 0 && (
                <div>
                  <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider">Requirements</h4>
                  <ul className="mt-1 list-disc pl-4 space-y-1">
                    {selectedJob.requirements.map((req, i) => (
                      <li key={i}>{req}</li>
                    ))}
                  </ul>
                </div>
              )}

              {(selectedJob.contactEmail || selectedJob.contactPhone) && (
                <div className="rounded-2xl bg-slate-50 p-4 border border-slate-200">
                  <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider">Employer Contact Information</h4>
                  <div className="mt-2 space-y-1 font-semibold">
                    {selectedJob.contactEmail && (
                      <p>
                        📧 Email:{" "}
                        <a href={`mailto:${selectedJob.contactEmail}`} className="text-teal-600 hover:underline">
                          {selectedJob.contactEmail}
                        </a>
                      </p>
                    )}
                    {selectedJob.contactPhone && (
                      <p>
                        📞 Phone / WhatsApp:{" "}
                        <a href={`https://wa.me/${selectedJob.contactPhone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="text-emerald-600 hover:underline">
                          {selectedJob.contactPhone}
                        </a>
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
              <button
                onClick={() => toggleSaveJob(selectedJob._id)}
                className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                {savedJobIds.includes(selectedJob._id) ? "★ Bookmarked" : "☆ Bookmark Job"}
              </button>

              <button
                onClick={() => toggleApplyJob(selectedJob._id)}
                className={`rounded-xl px-5 py-2.5 text-xs font-bold text-white transition ${
                  appliedJobIds.includes(selectedJob._id) ? "bg-slate-700 hover:bg-slate-800" : "bg-teal-600 hover:bg-teal-500 shadow-md shadow-teal-600/30"
                }`}
              >
                {appliedJobIds.includes(selectedJob._id) ? "✓ Withdraw Application" : "Quick Apply Now"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Post Job Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl md:p-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-lg font-bold text-slate-900">Post Job Vacancy</h3>
              <button onClick={() => setShowCreateModal(false)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateJob} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Job Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Senior Software Engineer"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Company / Employer *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Kutchi Tech Solutions"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as JobCategory)}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 focus:border-teal-500"
                  >
                    {CATEGORIES.filter((c) => c !== "All").map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Job Type</label>
                  <select
                    value={jobType}
                    onChange={(e) => setJobType(e.target.value as JobType)}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 focus:border-teal-500"
                  >
                    {JOB_TYPES.filter((t) => t !== "All").map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Location / City *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Karachi, Pakistan"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Salary Range (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. PKR 100k - 150k"
                    value={salary}
                    onChange={(e) => setSalary(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Description *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Provide responsibilities, role summary, etc..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Requirements (One per line)</label>
                <textarea
                  rows={2}
                  placeholder="e.g. 3+ years React experience&#10;Good communication skills"
                  value={requirementsText}
                  onChange={(e) => setRequirementsText(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Contact Email</label>
                  <input
                    type="email"
                    placeholder="jobs@company.com"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Contact Phone / WhatsApp</label>
                  <input
                    type="tel"
                    placeholder="+923001234567"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-xl px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-teal-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-teal-600/30 hover:bg-teal-500 disabled:opacity-50"
                >
                  {submitting ? "Publishing..." : "Post Job Vacancy"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
