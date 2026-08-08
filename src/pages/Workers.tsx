import React, { useEffect, useState } from "react";
import API from "../api/axios";
import Loader from "../components/Loader";
import Toast from "../components/Toast";
import UserAvatar from "../components/UserAvatar";

export type WorkerCategory =
  | "All"
  | "Electrician"
  | "Plumber"
  | "Mistri (Mason)"
  | "Painter"
  | "AC Repair"
  | "Mechanic"
  | "Carpenter"
  | "Tailor"
  | "Driver"
  | "Cleaning & Maids"
  | "Other";

export interface WorkerReview {
  _id?: string;
  userName: string;
  userPhotoUrl?: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface WorkerItem {
  _id: string;
  title: string;
  company: string; // Master / Worker Name
  category: string;
  jobType: string;
  location: string;
  salary?: string;
  description: string;
  contactPhone?: string;
  hasWhatsApp?: boolean;
  contactEmail?: string;
  postedBy?: {
    _id: string;
    fullName?: string;
    profilePhotoUrl?: string;
  };
  reviews?: WorkerReview[];
  averageRating?: number;
  totalReviews?: number;
  createdAt: string;
}

export function checkWhatsAppAvailable(phone?: string, explicitHasWhatsApp?: boolean): boolean {
  if (typeof explicitHasWhatsApp === "boolean" && !explicitHasWhatsApp) {
    return false;
  }
  if (!phone) return false;
  const digits = phone.replace(/\D/g, "");
  if (!digits) return false;

  // Landline check: Starts with 021, 051, 042, 022, 091, 081 etc., or length <= 9 digits
  if (digits.length <= 9 || /^(021|051|042|022|091|081|041)/.test(digits)) {
    return false;
  }

  // Pakistani mobile check: 03xx (11 digits), or 923xx (12 digits), or 3xx (10 digits)
  if (/^0?3\d{9}$/.test(digits) || /^923\d{9}$/.test(digits)) {
    return true;
  }

  return Boolean(explicitHasWhatsApp);
}

const CATEGORIES: { id: WorkerCategory; labelEn: string; labelUr: string; icon: string }[] = [
  { id: "All", labelEn: "All Workers", labelUr: "تمام کاریگر", icon: "🛠️" },
  { id: "Electrician", labelEn: "Electrician", labelUr: "الیکٹریشن", icon: "⚡" },
  { id: "Plumber", labelEn: "Plumber", labelUr: "پلمبر", icon: "🚰" },
  { id: "Mistri (Mason)", labelEn: "Mistri (Mason)", labelUr: "مستری", icon: "🧱" },
  { id: "Painter", labelEn: "Painter", labelUr: "پینٹر", icon: "🎨" },
  { id: "AC Repair", labelEn: "AC Repair", labelUr: "اے سی سروس", icon: "❄️" },
  { id: "Mechanic", labelEn: "Mechanic", labelUr: "مکانک", icon: "🚗" },
  { id: "Carpenter", labelEn: "Carpenter", labelUr: "ترکھان / کارپینٹر", icon: "🚪" },
  { id: "Tailor", labelEn: "Tailor", labelUr: "درزی", icon: "✂️" },
  { id: "Driver", labelEn: "Driver", labelUr: "ڈرائیور", icon: "🚕" },
  { id: "Cleaning & Maids", labelEn: "Cleaning", labelUr: "صفائی / گھر کا کام", icon: "🧹" },
  { id: "Other", labelEn: "Other Services", labelUr: "دیگر خدمات", icon: "🔧" },
];

const DEMO_WORKERS: WorkerItem[] = [
  {
    _id: "demo-1",
    title: "Master Electrician & UPS Fitting Expert",
    company: "Ustad Muhammad Siddique",
    category: "Electrician",
    jobType: "Services / Daily Wages",
    location: "Kharadar & Ranchore Line, Karachi",
    description: "Ghar ki complete wiring, DB breaker box fitting, UPS & solar inverter setup, ceiling fan installation, and motor winding repair work.",
    contactPhone: "03001234567",
    hasWhatsApp: true,
    contactEmail: "https://images.unsplash.com/photo-1540569014015-19a7be504e3a?auto=format&fit=crop&w=400&q=80",
    averageRating: 5.0,
    totalReviews: 3,
    reviews: [
      { userName: "Bilal Kutchi", rating: 5, comment: "Bohot achha kaam kiya! UPS wiring clean thi aur breaker issue minutes mein solve kardiya.", createdAt: new Date().toISOString() },
      { userName: "Usman Ghani", rating: 5, comment: "Bohot imandar aur mehnati master hain. Rates b wajib hain.", createdAt: new Date().toISOString() },
      { userName: "Tariq Mahmood", rating: 5, comment: "Punctual aur skilled electrician.", createdAt: new Date().toISOString() },
    ],
    createdAt: new Date().toISOString(),
  },
  {
    _id: "demo-2",
    title: "Sanitary Plumber & Water Pump Specialist",
    company: "Rashid Plumber & Motor Expert",
    category: "Plumber",
    jobType: "Services / Daily Wages",
    location: "Lyari & Kharadar, Karachi",
    description: "Water pipeline underground leak repair, water pump motor installation, bathroom sanitary fitting, tank cleaning, and geyser installation.",
    contactPhone: "03219876543",
    hasWhatsApp: true,
    contactEmail: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
    averageRating: 4.8,
    totalReviews: 2,
    reviews: [
      { userName: "Haroon Rashid", rating: 5, comment: "Underground water leak trace karkay fix kiya. 100% recommended!", createdAt: new Date().toISOString() },
      { userName: "Zubair Memon", rating: 4, comment: "Achha plumber hai, time per aa gaye the.", createdAt: new Date().toISOString() },
    ],
    createdAt: new Date().toISOString(),
  },
  {
    _id: "demo-3",
    title: "Mason, Plaster & Tile Fitting Master",
    company: "Ustad Farooq Mistri (Mason)",
    category: "Mistri (Mason)",
    jobType: "Services / Daily Wages",
    location: "Ranchore Line & Lea Market, Karachi",
    description: "Plaster work, tile & marble fitting, wall demolition, concrete lintel, roof waterproofing, and house structure renovation.",
    contactPhone: "03332468101",
    hasWhatsApp: true,
    contactEmail: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80",
    averageRating: 4.9,
    totalReviews: 2,
    reviews: [
      { userName: "Asif Kapadia", rating: 5, comment: "Bathroom tile fitting bohot safai se ki. Perfect finishing!", createdAt: new Date().toISOString() },
      { userName: "Kamran Siddiqui", rating: 5, comment: "Plaster work smooth tha. Very trustworthy.", createdAt: new Date().toISOString() },
    ],
    createdAt: new Date().toISOString(),
  },
  {
    _id: "demo-4",
    title: "Distemper, Weather Sheet & Wood Polish Expert",
    company: "Tariq Painter & Polish Specialist",
    category: "Painter",
    jobType: "Services / Daily Wages",
    location: "Kharadar & Saddar, Karachi",
    description: "Distemper, plastic emulsion, weather sheet, gate oil paint, door polish, wall putty filling, and dampness treatment.",
    contactPhone: "03125554321",
    hasWhatsApp: true,
    contactEmail: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80",
    averageRating: 5.0,
    totalReviews: 2,
    reviews: [
      { userName: "Imran Merchant", rating: 5, comment: "Drawing room weather sheet aur Polish zabardast ki hai.", createdAt: new Date().toISOString() },
      { userName: "Faisal Vohra", rating: 5, comment: "High quality paint work at reasonable price.", createdAt: new Date().toISOString() },
    ],
    createdAt: new Date().toISOString(),
  },
  {
    _id: "demo-5",
    title: "Commercial AC Repair & Compressor Overhaul",
    company: "Siddiqui Cool Services (Landline)",
    category: "AC Repair",
    jobType: "Services / Daily Wages",
    location: "Saddar & Plaza, Karachi",
    description: "Commercial & domestic AC gas refilling, compressor overhaul, PCB circuit repair, and industrial cooling setup. (Landline Contact)",
    contactPhone: "02132219988",
    hasWhatsApp: false,
    contactEmail: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=400&q=80",
    averageRating: 4.7,
    totalReviews: 1,
    reviews: [
      { userName: "Salim Merchant", rating: 5, comment: "Shop ka AC gas leak trace karkay fix kar diya.", createdAt: new Date().toISOString() },
    ],
    createdAt: new Date().toISOString(),
  },
];

export default function Workers() {
  const [workers, setWorkers] = useState<WorkerItem[]>(DEMO_WORKERS);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<WorkerCategory>("All");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info"; isVisible: boolean }>({
    message: "",
    type: "success",
    isVisible: false,
  });

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Review Modal State
  const [reviewTargetWorker, setReviewTargetWorker] = useState<WorkerItem | null>(null);
  const [userRating, setUserRating] = useState(5);
  const [userComment, setUserComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  // Custom Delete Confirm Modal State
  const [deleteTargetWorker, setDeleteTargetWorker] = useState<WorkerItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form Fields
  const [workerName, setWorkerName] = useState("");
  const [professionTitle, setProfessionTitle] = useState("");
  const [category, setCategory] = useState<WorkerCategory>("Electrician");
  const [location, setLocation] = useState("");
  const [phone, setPhone] = useState("");
  const [hasWhatsAppInput, setHasWhatsAppInput] = useState(true);
  const [description, setDescription] = useState("");
  const [passportPhotoUrl, setPassportPhotoUrl] = useState("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ message, type, isVisible: true });
  };

  useEffect(() => {
    setHasWhatsAppInput(checkWhatsAppAvailable(phone, undefined));
  }, [phone]);

  const fetchWorkers = async () => {
    try {
      setLoading(true);
      let res;
      try {
        res = await API.get("/workers/all");
      } catch {
        res = await API.get("/jobs/all");
      }
      const rawList = res.data?.workers || res.data?.jobs;
      if (rawList && Array.isArray(rawList)) {
        const dbJobs = rawList;
        const demoFilter = DEMO_WORKERS.filter((demo) => !dbJobs.some((j: any) => j._id === demo._id));
        setWorkers([...dbJobs, ...demoFilter]);
      } else {
        setWorkers(DEMO_WORKERS);
      }
    } catch {
      setWorkers(DEMO_WORKERS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkers();
  }, []);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingPhoto(true);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "community-app/worker-photos");

      const res = await API.post("/storage/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data?.file?.url) {
        setPassportPhotoUrl(res.data.file.url);
        showToast("Passport photo uploaded successfully!", "success");
      }
    } catch {
      showToast("Failed to upload photo. Please try again.", "error");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleCreateWorker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workerName.trim() || !phone.trim() || !location.trim() || !description.trim()) {
      showToast("Worker name, phone, location, and description are required.", "error");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        title: professionTitle.trim() || `${workerName.trim()} - ${category}`,
        company: workerName.trim(),
        category,
        jobType: "Services / Daily Wages",
        location: location.trim(),
        salary: "",
        description: description.trim(),
        contactPhone: phone.trim(),
        hasWhatsApp: hasWhatsAppInput,
        contactEmail: passportPhotoUrl,
      };

      const res = await API.post("/jobs/create", payload);
      if (res.data?.job) {
        setWorkers([res.data.job, ...workers]);
        showToast("Worker listed successfully! کاریگر کا نام شامل ہو گیا۔", "success");
        setIsModalOpen(false);
        resetForm();
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to add worker listing.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewTargetWorker) return;
    if (!userComment.trim()) {
      showToast("Please write a comment for your review.", "error");
      return;
    }

    setSubmittingReview(true);
    const workerId = reviewTargetWorker._id;

    try {
      if (!workerId.startsWith("demo-")) {
        const res = await API.post(`/jobs/${workerId}/reviews`, {
          rating: userRating,
          comment: userComment.trim(),
        });
        if (res.data?.job) {
          setWorkers((prev) => prev.map((w) => (w._id === workerId ? res.data.job : w)));
        }
      } else {
        const newRev: WorkerReview = {
          userName: "Community Member",
          rating: userRating,
          comment: userComment.trim(),
          createdAt: new Date().toISOString(),
        };

        setWorkers((prev) =>
          prev.map((w) => {
            if (w._id === workerId) {
              const existingRev = w.reviews || [];
              const updatedRev = [newRev, ...existingRev];
              const totalRatingSum = updatedRev.reduce((acc, curr) => acc + curr.rating, 0);
              const avg = Number((totalRatingSum / updatedRev.length).toFixed(1));
              return {
                ...w,
                reviews: updatedRev,
                totalReviews: updatedRev.length,
                averageRating: avg,
              };
            }
            return w;
          })
        );
      }

      showToast("Review submitted successfully! آپ ki رائے شامل ہو گئی۔", "success");
      setUserComment("");
      setUserRating(5);
      setReviewTargetWorker(null);
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to submit review.", "error");
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetWorker) return;
    const id = deleteTargetWorker._id;
    setIsDeleting(true);

    try {
      if (!id.startsWith("demo-")) {
        await API.delete(`/jobs/${id}`);
      }
      setWorkers((prev) => prev.filter((w) => w._id !== id));
      showToast("Worker listing removed.", "success");
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to delete worker.", "error");
    } finally {
      setIsDeleting(false);
      setDeleteTargetWorker(null);
    }
  };

  const resetForm = () => {
    setWorkerName("");
    setProfessionTitle("");
    setCategory("Electrician");
    setLocation("");
    setPhone("");
    setHasWhatsAppInput(true);
    setDescription("");
    setPassportPhotoUrl("");
  };

  const filteredWorkers = workers.filter((worker) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      (worker.company || "").toLowerCase().includes(q) ||
      (worker.title || "").toLowerCase().includes(q) ||
      (worker.category || "").toLowerCase().includes(q) ||
      (worker.location || "").toLowerCase().includes(q) ||
      (worker.description || "").toLowerCase().includes(q) ||
      (worker.contactPhone && worker.contactPhone.includes(q));

    const cat = (worker.category || "").toLowerCase();
    const selected = selectedCategory.toLowerCase();

    const matchesCategory =
      selectedCategory === "All" ||
      cat === selected ||
      cat.includes(selected) ||
      (selectedCategory === "Electrician" && cat.includes("electric")) ||
      (selectedCategory === "Plumber" && cat.includes("plumb")) ||
      (selectedCategory === "Mistri (Mason)" && (cat.includes("mistri") || cat.includes("mason"))) ||
      (selectedCategory === "Painter" && cat.includes("paint")) ||
      (selectedCategory === "AC Repair" && (cat.includes("ac") || cat.includes("air")));

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="w-full space-y-6 sm:space-y-8 py-2 text-slate-100">
      {toast.isVisible && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast((prev) => ({ ...prev, isVisible: false }))}
        />
      )}

      <div className="mx-auto w-full max-w-7xl space-y-6 sm:space-y-8">
        {/* Sleek Hero Header */}
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-teal-950/60 p-5 sm:p-8 shadow-2xl">
          <div className="flex flex-col items-start justify-between gap-5 md:flex-row md:items-center">
            <div className="space-y-2.5">
              <div className="inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-500/10 px-3 py-1 text-[11px] sm:text-xs font-black tracking-widest text-teal-400 uppercase">
                🛠️ LOCAL WORKERS & SERVICES DIRECTORY
              </div>
              <h1 className="text-xl font-black text-white sm:text-3xl lg:text-4xl leading-tight">
                مقامی کاریگر اور خدمات (Local Workers Directory)
              </h1>
              <p className="max-w-2xl text-xs font-medium text-slate-300 sm:text-base leading-relaxed">
                اپنے علاقے کے بااعتماد الیکٹریشن، پلمبر، مستری، پینٹر اور مکانک سے 1 کلک میں رابطہ کریں۔ واٹس ایپ چیکنگ اور کسٹمر ریٹنگ کے ساتھ۔
              </p>
            </div>

            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex w-full sm:w-auto shrink-0 items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 px-5 py-3.5 text-xs sm:text-sm font-black text-slate-950 shadow-lg transition hover:scale-[1.02] hover:from-emerald-400 hover:to-teal-500 active:scale-95"
            >
              <span className="text-base sm:text-lg">➕</span>
              List a Worker / کاریگر درج کریں
            </button>
          </div>
        </div>

        {/* Search Input & Category Wrap Grid */}
        <div className="space-y-4 rounded-2xl sm:rounded-3xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur sm:p-6">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by worker name, electrician, plumber, mistri, area... (کاریگر کا نام یا شعبہ تلاش کریں)"
              className="w-full rounded-2xl border border-slate-700 bg-slate-950 py-3 pr-4 pl-11 text-xs sm:text-sm text-white placeholder-slate-400 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
            />
            <span className="absolute top-1/2 left-4 -translate-y-1/2 text-base sm:text-lg text-slate-400">🔍</span>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-wider text-slate-400">
              🛠️ Select Profession Category (شعبہ منتخب کریں):
            </label>
            <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2 min-w-0 rounded-xl border px-2.5 py-2 sm:py-2.5 text-xs font-bold transition ${
                      isSelected
                        ? "border-teal-500 bg-teal-500/20 text-teal-300 shadow-md"
                        : "border-slate-800 bg-slate-950 text-slate-300 hover:border-slate-700 hover:bg-slate-900"
                    }`}
                  >
                    <span className="text-sm sm:text-base shrink-0">{cat.icon}</span>
                    <span className="truncate min-w-0 text-[11px] sm:text-xs">{cat.labelEn}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Worker Cards Grid */}
        {loading ? (
          <div className="py-16 text-center">
            <Loader />
          </div>
        ) : filteredWorkers.length === 0 ? (
          <div className="rounded-2xl sm:rounded-3xl border border-slate-800 bg-slate-900/50 p-8 sm:p-12 text-center shadow-xl">
            <span className="text-4xl sm:text-5xl">🛠️</span>
            <h3 className="mt-4 text-base sm:text-lg font-black text-white">No Workers Found</h3>
            <p className="mt-1 text-xs sm:text-sm text-slate-400">اس کیٹیگری میں فی الحال کوئی کاریگر نہیں ملا۔ نیا کاریگر شامل کریں۔</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredWorkers.map((worker) => {
              const rawPhone = worker.contactPhone || "";
              const cleanPhone = rawPhone.replace(/\D/g, "");
              const isWhatsApp = checkWhatsAppAvailable(rawPhone, worker.hasWhatsApp);
              const whatsappLink = isWhatsApp && cleanPhone ? `https://wa.me/92${cleanPhone.replace(/^0/, "")}` : "";
              const callLink = rawPhone ? `tel:${rawPhone}` : "";
              const workerPhoto = worker.contactEmail;
              const avgRating = worker.averageRating || (worker.reviews?.length ? Number((worker.reviews.reduce((a, b) => a + b.rating, 0) / worker.reviews.length).toFixed(1)) : 5.0);
              const totalRevs = worker.totalReviews || worker.reviews?.length || 0;

              return (
                <div
                  key={worker._id}
                  className="flex flex-col justify-between min-w-0 w-full overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-800 bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 p-4 sm:p-5 shadow-xl transition hover:border-slate-700 hover:shadow-2xl"
                >
                  <div className="space-y-3.5 sm:space-y-4">
                    {/* Header: Photo & Name */}
                    <div className="flex items-start gap-3 sm:gap-4 min-w-0">
                      {workerPhoto ? (
                        <img
                          src={workerPhoto}
                          alt={worker.company || worker.title}
                          className="h-16 w-14 sm:h-20 sm:w-16 shrink-0 rounded-2xl border-2 border-teal-500/40 object-cover shadow-md"
                        />
                      ) : (
                        <div className="shrink-0">
                          <UserAvatar name={worker.company || worker.title} size="lg" />
                        </div>
                      )}

                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap min-w-0">
                          <span className="inline-block rounded-full border border-teal-500/30 bg-teal-500/10 px-2 sm:px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-teal-400 truncate max-w-[130px] sm:max-w-none">
                            {worker.category || "Service Worker"}
                          </span>

                          {/* Star Rating Badge */}
                          <button
                            onClick={() => setReviewTargetWorker(worker)}
                            className="inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/20 px-2 sm:px-2.5 py-0.5 text-[10px] sm:text-[11px] font-black text-amber-300 hover:scale-105 transition shrink-0"
                          >
                            ⭐ {avgRating} ({totalRevs})
                          </button>
                        </div>

                        <h3 className="text-base sm:text-lg font-black text-white leading-snug break-words line-clamp-2">
                          {worker.company || worker.title}
                        </h3>
                        <p className="text-xs font-bold text-teal-400 leading-tight break-words line-clamp-2">
                          {worker.title}
                        </p>
                        <p className="text-xs font-semibold text-slate-400 leading-tight break-words line-clamp-1">
                          📍 Area: {worker.location}
                        </p>
                      </div>

                      <button
                        onClick={() => setDeleteTargetWorker(worker)}
                        className="shrink-0 rounded-xl border border-red-500/30 bg-red-500/10 p-2 text-xs text-red-400 transition hover:bg-red-500/20 active:scale-95"
                        title="Delete listing"
                      >
                        🗑️
                      </button>
                    </div>

                    {/* Work Description */}
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3 sm:p-3.5 text-xs text-slate-300 font-sans leading-relaxed break-words [overflow-wrap:anywhere] line-clamp-3 sm:line-clamp-4 hover:line-clamp-none transition-all">
                      {worker.description}
                    </div>

                    {/* Reviews Strip */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 rounded-xl border border-slate-800 bg-slate-950/40 p-2.5 text-xs text-slate-300">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="shrink-0">💬</span>
                        <span className="font-semibold text-slate-400 truncate text-[11px] sm:text-xs">
                          {totalRevs > 0 ? `${totalRevs} Customer Reviews` : "No reviews yet"}
                        </span>
                      </div>
                      <button
                        onClick={() => setReviewTargetWorker(worker)}
                        className="w-full sm:w-auto shrink-0 text-center rounded-lg border border-amber-500/40 bg-amber-500/10 px-2.5 py-1 text-[11px] font-black text-amber-300 transition hover:bg-amber-500/20 active:scale-95"
                      >
                        ⭐ Rate & Review
                      </button>
                    </div>
                  </div>

                  {/* Contact Buttons: Real-Time WhatsApp Verification */}
                  <div className="mt-4 sm:mt-5 pt-3 border-t border-slate-800/80">
                    {isWhatsApp ? (
                      <div className="grid grid-cols-2 gap-2 sm:gap-3">
                        <a
                          href={callLink}
                          className="flex items-center justify-center gap-1.5 sm:gap-2 rounded-xl sm:rounded-2xl bg-emerald-500 py-2.5 sm:py-3 px-2 sm:px-3 text-xs font-black text-slate-950 shadow-md transition hover:bg-emerald-400 active:scale-95 text-center min-w-0"
                        >
                          <span>📞</span> <span className="truncate">Call Now</span>
                        </a>
                        <a
                          href={whatsappLink}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-center gap-1.5 sm:gap-2 rounded-xl sm:rounded-2xl border border-teal-500/40 bg-teal-600/30 py-2.5 sm:py-3 px-2 sm:px-3 text-xs font-black text-white shadow-md transition hover:bg-teal-600/50 active:scale-95 text-center min-w-0"
                        >
                          <span>💬</span> <span className="truncate">WhatsApp</span>
                        </a>
                      </div>
                    ) : (
                      <a
                        href={callLink}
                        className="flex w-full items-center justify-center gap-2 rounded-xl sm:rounded-2xl bg-emerald-500 py-2.5 sm:py-3.5 px-3 text-xs font-black text-slate-950 shadow-md transition hover:bg-emerald-400 active:scale-95 text-center"
                      >
                        <span>📞</span> Call Now
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Review & Star Rating Modal */}
      {reviewTargetWorker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-3 sm:p-4 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-lg space-y-4 sm:space-y-5 rounded-2xl sm:rounded-3xl border border-slate-800 bg-slate-900 p-4 sm:p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 sm:pb-4">
              <div>
                <h3 className="text-base sm:text-lg font-black text-white">⭐ Customer Reviews & Rating</h3>
                <p className="text-xs font-bold text-teal-400 truncate max-w-[220px] sm:max-w-xs">{reviewTargetWorker.company || reviewTargetWorker.title}</p>
              </div>
              <button onClick={() => setReviewTargetWorker(null)} className="text-xl font-bold text-slate-400 hover:text-white p-1">✕</button>
            </div>

            {/* Add Review Form */}
            <form onSubmit={handleAddReview} className="space-y-3 sm:space-y-4 rounded-2xl border border-slate-800 bg-slate-950/60 p-3.5 sm:p-4">
              <label className="text-xs font-black uppercase tracking-wider text-teal-400">Write Your Review (اپنی رائے دیں)</label>

              {/* Star Rating selector */}
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    type="button"
                    key={star}
                    onClick={() => setUserRating(star)}
                    className="text-2xl transition hover:scale-110"
                  >
                    {star <= userRating ? "⭐" : "☆"}
                  </button>
                ))}
              </div>

              <textarea
                value={userComment}
                onChange={(e) => setUserComment(e.target.value)}
                rows={2}
                placeholder="Write your feedback... (کام کی تفصیل اور تجربہ لکھیں)"
                className="w-full rounded-xl border border-slate-800 bg-slate-900 p-3 text-xs text-white placeholder-slate-500 outline-none focus:border-teal-500"
              />

              <button
                type="submit"
                disabled={submittingReview}
                className="w-full rounded-xl bg-amber-500 py-2.5 text-xs font-black text-slate-950 hover:bg-amber-400 transition active:scale-95"
              >
                {submittingReview ? "Submitting..." : "Submit Review (رائے جمع کریں)"}
              </button>
            </form>

            {/* Existing Reviews List */}
            <div className="max-h-60 space-y-3 overflow-y-auto pr-1">
              <h4 className="text-xs font-black uppercase text-slate-400">💬 Previous Reviews ({reviewTargetWorker.reviews?.length || 0})</h4>
              {(!reviewTargetWorker.reviews || reviewTargetWorker.reviews.length === 0) ? (
                <p className="py-4 text-center text-xs font-semibold text-slate-500">No reviews yet for this worker.</p>
              ) : (
                reviewTargetWorker.reviews.map((rev, idx) => (
                  <div key={idx} className="rounded-xl border border-slate-800 bg-slate-950/40 p-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">{rev.userName}</span>
                      <span className="text-amber-300">{"⭐".repeat(rev.rating)}</span>
                    </div>
                    <p className="mt-1 text-slate-300 break-words">{rev.comment}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteTargetWorker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md">
          <div className="w-full max-w-sm space-y-4 rounded-2xl sm:rounded-3xl border border-red-500/40 bg-slate-900 p-5 sm:p-6 text-center shadow-2xl">
            <span className="text-4xl">🗑️</span>
            <h3 className="text-lg font-black text-white">Delete Worker Record?</h3>
            <p className="text-xs text-slate-400">کیا آپ اس کاریگر کا ریکارڈ ختم کرنا چاہتے ہیں؟</p>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setDeleteTargetWorker(null)}
                disabled={isDeleting}
                className="flex-1 rounded-xl border border-slate-700 bg-slate-800 py-2.5 text-xs font-bold text-slate-300 hover:bg-slate-700 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="flex-1 rounded-xl bg-red-600 py-2.5 text-xs font-black text-white hover:bg-red-500 transition"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* List Worker Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-3 sm:p-4 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl sm:rounded-3xl border border-slate-800 bg-slate-900 p-4 sm:p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 sm:pb-4">
              <h3 className="text-base sm:text-lg font-black text-white">➕ List a Worker (کاریگر درج کریں)</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-xl font-bold text-slate-400 hover:text-white p-1">✕</button>
            </div>

            <form onSubmit={handleCreateWorker} className="mt-4 space-y-3.5 sm:space-y-4">
              {/* Photo Field Top */}
              <div className="space-y-1">
                <label className="text-xs font-black uppercase text-teal-400">Worker Passport Photo (پاسپورٹ تصویر)</label>
                <div className="flex items-center gap-4 pt-1">
                  {passportPhotoUrl ? (
                    <img src={passportPhotoUrl} alt="Preview" className="h-20 w-16 rounded-xl border-2 border-teal-500 object-cover" />
                  ) : (
                    <div className="flex h-20 w-16 items-center justify-center rounded-xl border-2 border-dashed border-slate-700 bg-slate-950 text-xs text-slate-500">No Photo</div>
                  )}
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} className="text-xs text-slate-400 w-full" />
                </div>
              </div>

              <div>
                <label className="text-xs font-black uppercase text-teal-400">Worker / Master Name *</label>
                <input type="text" value={workerName} onChange={(e) => setWorkerName(e.target.value)} required placeholder="e.g. Ustad Muhammad Siddique" className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs text-white outline-none focus:border-teal-500" />
              </div>

              <div>
                <label className="text-xs font-black uppercase text-teal-400">Category *</label>
                <select value={category} onChange={(e) => setCategory(e.target.value as WorkerCategory)} className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs text-white outline-none focus:border-teal-500">
                  {CATEGORIES.filter((c) => c.id !== "All").map((c) => (
                    <option key={c.id} value={c.id}>{c.icon} {c.labelEn}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-black uppercase text-teal-400">Skill Title</label>
                <input type="text" value={professionTitle} onChange={(e) => setProfessionTitle(e.target.value)} placeholder="e.g. Master Electrician & UPS Specialist" className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs text-white outline-none focus:border-teal-500" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-black uppercase text-teal-400">Phone *</label>
                  <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} required placeholder="03001234567" className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs text-white outline-none focus:border-teal-500" />
                </div>
                <div>
                  <label className="text-xs font-black uppercase text-teal-400">Area *</label>
                  <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} required placeholder="Kharadar / Lyari" className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs text-white outline-none focus:border-teal-500" />
                </div>
              </div>

              {/* WhatsApp Checkbox */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 space-y-1">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasWhatsAppInput}
                    onChange={(e) => setHasWhatsAppInput(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-teal-500 focus:ring-teal-500/20"
                  />
                  <span className="text-xs font-bold text-white">WhatsApp available on this number (واٹس ایپ کی سہولت موجود ہے)</span>
                </label>
                <p className="text-[11px] text-slate-400 pl-6">
                  {hasWhatsAppInput ? "💬 WhatsApp button will be visible on card" : "📞 Only Call Now button will be shown centered on card"}
                </p>
              </div>

              <div>
                <label className="text-xs font-black uppercase text-teal-400">Work Details *</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} required rows={3} placeholder="Wiring, UPS repair, Breaker Box, Fan installation." className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs text-white outline-none focus:border-teal-500" />
              </div>

              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button type="button" onClick={() => setIsModalOpen(false)} className="w-full sm:w-auto rounded-xl px-4 py-2.5 text-xs font-bold text-slate-400 hover:text-white border border-slate-800 sm:border-none">Cancel</button>
                <button type="submit" disabled={submitting} className="w-full sm:w-auto rounded-xl bg-emerald-500 px-6 py-2.5 text-xs font-black text-slate-950 hover:bg-emerald-400 transition">{submitting ? "Saving..." : "Save Worker"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
