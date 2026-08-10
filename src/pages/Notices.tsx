import { useEffect, useMemo, useState, type FormEvent } from "react";
import API from "../api/axios";
import Toast from "../components/Toast";
import SEO from "../components/SEO";
import ConfirmModal from "../components/ConfirmModal";

const NOTICE_ACTIVITY_EVENT = "community-notice-activity";

function formatNoticeTime(value: string) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "";

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

const noticesTranslations: Record<string, string> = {
  mayyat_closing: "Inna lillahi wa inna ilayhi raji'un.",
  reaction_heart: 'Love',
  reaction_thumbs: 'Thumbs up',
  reaction_correct: 'Correct',
  reaction_wrong: 'Wrong',
  unable_load_notices: 'Unable to load notices right now.',
  add_name_time_place_required: 'Please add name, namaz-e-janaza time, and janaza place before saving.',
  add_title_body_required: 'Please add both a title and a message before saving.',
  mayyat_prefix: 'Mayyat: ',
  publish_mayyat_success: 'Mayyat notice published successfully.',
  publish_notice_success: 'Your notice has been published to the community feed.',
  unable_publish: 'Unable to publish notice right now.',
  unable_react: 'Unable to save your reaction right now.',
  unable_update_pin: 'Unable to update pin right now.',
  notice_deleted: 'Notice deleted.',
  unable_delete: 'Unable to delete notice right now.',
  update_success_mayyat: 'Mayyat notification updated.',
  update_success_notice: 'Notice updated.',
  unable_update: 'Unable to update notice right now.',
  unable_share: 'Unable to share right now.',
  notices_channel_title: 'Community Notices & Alerts',
  notices_heading: 'This channel is for important updates',
  checking_access: 'Checking your access level for notices...',
  admin_publish_notice: 'You can publish alerts and important announcements for the community.',
  member_mode_msg: 'You are viewing in member mode. You can read updates, react to them, and share them with others.',
  checking_access_short: 'Checking access...',
  moderator_access: 'Moderator access',
  admin_access: 'Admin access',
  member_access: 'Member access',
  post_notice_title: 'Post a notice or mayyat notification',
  post_notice_subtitle: 'Only super admins and moderators can publish updates for everyone in the community.',
  regular_notice: 'Regular notice',
  mayyat_notification: 'Mayyat notification',
  placeholder_marhoom_name: 'Marhoom/marhooma ka naam',
  placeholder_relation: 'Walid/shohar ya family reference',
  placeholder_age: 'Age',
  placeholder_jamaat: 'Jamaat / area',
  placeholder_inteqal: 'Inteqal date/time',
  placeholder_funeral_time: 'Namaz-e-janaza date/time',
  placeholder_funeral_place: 'Janaza place / masjid',
  placeholder_burial: 'Tadfeen / qabrastan',
  placeholder_extra_notes: 'Extra notes / dua request',
  placeholder_notice_title: 'Notice title',
  placeholder_notice_body: 'Write the alert or announcement...',
  pin_this_notice: 'Pin this notice to the top',
  publish_mayyat_action: 'Publish mayyat notification',
  publish_notice_action: 'Publish notice',
  loading_notices: 'Loading notices...',
  no_notices: 'No notices available yet.',
  name_label: 'Name',
  relation_label: 'Relation',
  age_label: 'Age',
  jamaat_label: 'Jamaat',
  inteqal_label: 'Inteqal',
  namaz_label: 'Namaz-e-Janaza',
  janaza_place_label: 'Janaza Place',
  tadfeen_label: 'Tadfeen/Qabrastan',
  notes_label: 'Notes',
  mayyat_label: 'Mayyat Notification',
  pinned_label: 'Pinned',
  share_label: 'Share',
  shared_label: 'Shared',
  pin_label: 'Pin',
  unpin_label: 'Unpin',
  edit_label: 'Edit',
  delete_label: 'Delete',
  save_label: 'Save',
  cancel_label: 'Cancel',
  admin_only: 'Admin only',
};

const t = (key: string) => noticesTranslations[key] || key;

interface MayyatDetails {
  deceasedName: string;
  fatherName: string;
  relation: string;
  relationName: string;
  age: string;
  jamaat: string;
  passedAwayAt: string;
  funeralPrayerDayPart: string;
  funeralPrayerTime: string;
  funeralPrayerPlace: string;
  burialPlace: string;
  notes: string;

  deceasedNameRoman?: string;
  fatherNameRoman?: string;
  relationRoman?: string;
  funeralPrayerDayPartRoman?: string;
  funeralPrayerTimeRoman?: string;
  funeralPrayerPlaceRoman?: string;
  notesRoman?: string;

  deceasedNameUrdu?: string;
  fatherNameUrdu?: string;
  relationUrdu?: string;
  funeralPrayerDayPartUrdu?: string;
  funeralPrayerTimeUrdu?: string;
  funeralPrayerPlaceUrdu?: string;
  notesUrdu?: string;
}

interface Notice {
  id: string;
  title: string;
  body: string;
  author: string;
  createdAt: string;
  type?: "notice" | "mayyat";
  mayyatDetails?: MayyatDetails;
  pinned?: boolean;
  reactions: number;
  reactionCounts?: Partial<Record<ReactionKind, number>>;
  shares: number;
  userReaction?: ReactionKind;
  hasShared?: boolean;
}

type Role = "super_admin" | "admin" | "moderator" | "member" | "loading";
type ReactionKind = "heart" | "thumbs_up" | "laugh" | "surprised" | "sad" | "pray" | "fire" | "clap" | "correct" | "wrong";

interface AuthUser {
  role?: string;
}

function normalizeRole(role?: string): Role {
  const norm = (role || "").trim().toLowerCase();
  if (["super_admin"].includes(norm)) return "super_admin";
  if (["admin", "jamaat_admin", "jamaatadmin"].includes(norm)) return "admin";
  if (["moderator", "mod"].includes(norm)) return "moderator";
  return "member";
}

const emptyMayyatDetails: MayyatDetails = {
  deceasedName: "",
  fatherName: "",
  relation: "",
  relationName: "",
  age: "",
  jamaat: "",
  passedAwayAt: "",
  funeralPrayerDayPart: "",
  funeralPrayerTime: "",
  funeralPrayerPlace: "",
  burialPlace: "",
  notes: "",
  deceasedNameRoman: "",
  fatherNameRoman: "",
  relationRoman: "",
  funeralPrayerDayPartRoman: "",
  funeralPrayerTimeRoman: "",
  funeralPrayerPlaceRoman: "",
  notesRoman: "",
  deceasedNameUrdu: "",
  fatherNameUrdu: "",
  relationUrdu: "",
  funeralPrayerDayPartUrdu: "",
  funeralPrayerTimeUrdu: "",
  funeralPrayerPlaceUrdu: "",
  notesUrdu: "",
};

function sanitizeMayyatDetails(details?: Partial<MayyatDetails>): MayyatDetails {
  const decRoman = details?.deceasedNameRoman || details?.deceasedName || "";
  const decUrdu = details?.deceasedNameUrdu || (details?.deceasedName && /[\u0600-\u06FF]/.test(details.deceasedName) ? details.deceasedName : "");

  const fRoman = details?.fatherNameRoman || details?.fatherName || "";
  const fUrdu = details?.fatherNameUrdu || (details?.fatherName && /[\u0600-\u06FF]/.test(details.fatherName) ? details.fatherName : "");

  const relRoman = details?.relationRoman || details?.relation || "";
  const relUrdu = details?.relationUrdu || (details?.relation && /[\u0600-\u06FF]/.test(details.relation) ? details.relation : "");

  const dayPartRoman = details?.funeralPrayerDayPartRoman || details?.funeralPrayerDayPart || "";
  const dayPartUrdu = details?.funeralPrayerDayPartUrdu || (details?.funeralPrayerDayPart && /[\u0600-\u06FF]/.test(details.funeralPrayerDayPart) ? details.funeralPrayerDayPart : "");

  const timeRoman = details?.funeralPrayerTimeRoman || details?.funeralPrayerTime || (details as any)?.time || "";
  const timeUrdu = details?.funeralPrayerTimeUrdu || timeRoman;

  const placeRoman = details?.funeralPrayerPlaceRoman || details?.funeralPrayerPlace || (details as any)?.janazaLocation || "";
  const placeUrdu = details?.funeralPrayerPlaceUrdu || (details?.funeralPrayerPlace && /[\u0600-\u06FF]/.test(details.funeralPrayerPlace) ? details.funeralPrayerPlace : "");

  const notesRoman = details?.notesRoman || details?.notes || "";
  const notesUrdu = details?.notesUrdu || (details?.notes && /[\u0600-\u06FF]/.test(details.notes) ? details.notes : "");

  return {
    deceasedName: decRoman || decUrdu,
    fatherName: fRoman || fUrdu,
    relation: relRoman || relUrdu,
    relationName: details?.relationName || "",
    age: details?.age || "",
    jamaat: details?.jamaat || "",
    passedAwayAt: details?.passedAwayAt || (details as any)?.inteqal || "",
    funeralPrayerDayPart: dayPartRoman || dayPartUrdu,
    funeralPrayerTime: timeRoman || timeUrdu,
    funeralPrayerPlace: placeRoman || placeUrdu,
    burialPlace: details?.burialPlace || (details as any)?.tadfeen || "",
    notes: notesRoman || notesUrdu,

    deceasedNameRoman: decRoman,
    fatherNameRoman: fRoman,
    relationRoman: relRoman,
    funeralPrayerDayPartRoman: dayPartRoman,
    funeralPrayerTimeRoman: timeRoman,
    funeralPrayerPlaceRoman: placeRoman,
    notesRoman: notesRoman,

    deceasedNameUrdu: decUrdu,
    fatherNameUrdu: fUrdu,
    relationUrdu: relUrdu,
    funeralPrayerDayPartUrdu: dayPartUrdu,
    funeralPrayerTimeUrdu: timeUrdu,
    funeralPrayerPlaceUrdu: placeUrdu,
    notesUrdu: notesUrdu,
  };
}

const romanToUrduMap: Record<string, string> = {
  subah: "صبح",
  raat: "رات",
  din: "دن",
  dopahar: "دوپہر",
  shaam: "شام",
  sham: "شام",
  zohar: "ظہر",
  zuhr: "ظہر",
  asr: "عصر",
  maghrib: "مغرب",
  isha: "عشاء",
  juma: "جمعہ",
  jumma: "جمعہ",
  aaj: "آج",
  kal: "کل",
  baje: "بجے",
  walad: "ولد",
  bint: "بنت",
  bin: "بن",
  beta: "بیٹا",
  beti: "بیٹی",
  shohar: "شوہر",
  bivi: "بیوی",
  biwi: "بیوی",
  waalid: "والد",
  walid: "والد",
  waalida: "والدہ",
  walida: "والدہ",
  bhai: "بھائی",
  behan: "بہن",
  behn: "بہن",
  khaloo: "خالو",
  khala: "خالہ",
  chacha: "چچا",
  chachi: "چچی",
  phupha: "پھوپا",
  phuphi: "پھوپھی",
  mamo: "ماموں",
  mamoo: "ماموں",
  mami: "مامی",
  dada: "دادا",
  dadi: "دادی",
  nana: "نانا",
  nani: "نانی",
  pota: "پوتا",
  poti: "پوتی",
  nawasa: "نواسا",
  nawasi: "نواسی",
  zauja: "زوجہ",
  ahliya: "اہلیہ",
};

function toUrduText(text: string): string {
  if (!text) return "";
  if (/[\u0600-\u06FF]/.test(text)) return text;
  const words = text.trim().split(/\s+/);
  const converted = words.map((w) => {
    const clean = w.toLowerCase().replace(/[^a-z]/g, "");
    return romanToUrduMap[clean] || w;
  });
  return converted.join(" ");
}

function buildMayyatBodyRoman(details: Partial<MayyatDetails>): string {
  const normalized = sanitizeMayyatDetails(details);
  const decName = (normalized.deceasedNameRoman || normalized.deceasedName).trim().toUpperCase();
  const fName = (normalized.fatherNameRoman || normalized.fatherName).trim();
  const rel = (normalized.relationRoman || normalized.relation).trim();
  const relName = normalized.relationName.trim();
  const dayPart = (normalized.funeralPrayerDayPartRoman || normalized.funeralPrayerDayPart).trim();
  const time = (normalized.funeralPrayerTimeRoman || normalized.funeralPrayerTime).trim();
  const place = (normalized.funeralPrayerPlaceRoman || normalized.funeralPrayerPlace).trim();
  const notes = (normalized.notesRoman || normalized.notes).trim();

  const lines: string[] = [];
  lines.push("**إِنَّا لِلَّٰهِ وَإِنَّا إِلَيْهِ رَاجِعُونَ**");

  let line2 = "Humein nihayat afsos ke saath ittila di jaati hai ke";
  if (decName) {
    line2 += ` **${decName}**`;
  }
  if (fName && rel) {
    line2 += `, **${fName}** ke **${rel}** ka`;
  } else if (fName && !rel) {
    line2 += `, **${fName}** ka`;
  } else if (!fName && rel) {
    line2 += ` ke **${rel}** ka`;
  } else if (relName) {
    line2 += `, **${relName}** ka`;
  } else {
    line2 += " ka";
  }
  line2 += " **raza-e-ilahi se inteqal ho gaya hai.**";
  lines.push(line2);

  let dayPartStr = dayPart;
  if (dayPartStr && !/^aaj\b/i.test(dayPartStr)) {
    dayPartStr = `Aaj ${dayPartStr}`;
  } else if (!dayPartStr) {
    dayPartStr = "Aaj";
  }

  let timeStr = time;
  if (timeStr && !/baje/i.test(timeStr)) {
    timeStr = `${timeStr} baje`;
  }

  const placeStr = place || "{Namaz-e-Janaza Ka Muqam (Masjid + Address)}";

  let line3 = `**Namaz-e-Janaza ${dayPartStr}`;
  if (timeStr) {
    line3 += ` ${timeStr}`;
  }
  line3 += ` ${placeStr} mein ada ki jaaye gi.**`;
  lines.push(line3);

  lines.push("Allah Ta'ala marhoom ki maghfirat farmaaye, un ki qabar ko roshan farmaaye, unhein Jannat-ul-Firdous mein aala maqam ata farmaaye aur tamam lawaheqeen ko sabr-e-jameel ata farmaaye.");
  lines.push("**Ameen.**");

  if (notes) {
    lines.push(`**Note:** ${notes}`);
  }

  return lines.join("\n");
}

function buildMayyatBodyUrdu(details: Partial<MayyatDetails>): string {
  const normalized = sanitizeMayyatDetails(details);
  const decName = (normalized.deceasedNameUrdu || normalized.deceasedNameRoman || normalized.deceasedName).trim();
  const fName = (normalized.fatherNameUrdu || normalized.fatherNameRoman || normalized.fatherName).trim();
  const rawRel = (normalized.relationUrdu || normalized.relationRoman || normalized.relation).trim();
  const rel = toUrduText(rawRel);
  const relName = normalized.relationName.trim();
  const rawDayPart = (normalized.funeralPrayerDayPartUrdu || normalized.funeralPrayerDayPartRoman || normalized.funeralPrayerDayPart).trim();
  const dayPart = toUrduText(rawDayPart);
  const time = (normalized.funeralPrayerTimeUrdu || normalized.funeralPrayerTimeRoman || normalized.funeralPrayerTime).trim();
  const place = (normalized.funeralPrayerPlaceUrdu || normalized.funeralPrayerPlaceRoman || normalized.funeralPrayerPlace).trim();
  const notes = (normalized.notesUrdu || normalized.notesRoman || normalized.notes).trim();

  const lines: string[] = [];
  lines.push("**إِنَّا لِلَّٰهِ وَإِنَّا إِلَيْهِ رَاجِعُونَ**");

  let line2 = "ہمیں نہایت افسوس کے ساتھ اطلاع دی جاتی ہے کہ";
  if (decName) {
    line2 += ` **${decName}**`;
  }
  if (fName && rel) {
    line2 += `، **${fName}** کے **${rel}** کا`;
  } else if (fName && !rel) {
    line2 += `، **${fName}** کا`;
  } else if (!fName && rel) {
    line2 += ` کے **${rel}** کا`;
  } else if (relName) {
    line2 += `، **${relName}** کا`;
  } else {
    line2 += " کا";
  }
  line2 += " **رضائے الٰہی سے انتقال ہو گیا ہے۔**";
  lines.push(line2);

  let dayPartStr = dayPart;
  if (dayPartStr && !/^آج\b|^aaj\b/i.test(dayPartStr)) {
    dayPartStr = `آج ${dayPartStr}`;
  } else if (!dayPartStr) {
    dayPartStr = "آج";
  }

  let timeStr = time;
  if (timeStr && !/baje|بجے/i.test(timeStr)) {
    timeStr = `${timeStr} بجے`;
  }

  const placeStr = place || "{نمازِ جنازہ کا مقام (مسجد + ایڈریس)}";

  let line3 = `**نمازِ جنازہ ${dayPartStr}`;
  if (timeStr) {
    line3 += ` ${timeStr}`;
  }
  line3 += ` ${placeStr} میں ادا کی جائے گی۔**`;
  lines.push(line3);

  lines.push("اللہ تعالیٰ مرحوم کی مغفرت فرمائے، ان کی قبر کو روشن فرمائے، انہیں جنت الفردوس میں اعلیٰ مقام عطا فرمائے اور تمام لواحقین کو صبرِ جمیل عطا فرمائے۔");
  lines.push("**آمین۔**");

  if (notes) {
    lines.push(`**نوٹ:** ${notes}`);
  }

  return lines.join("\n");
}

function buildMayyatBody(details: Partial<MayyatDetails>, lang: "roman" | "urdu" = "roman"): string {
  if (lang === "urdu") {
    return buildMayyatBodyUrdu(details);
  }
  return buildMayyatBodyRoman(details);
}

function renderFormattedText(text: string, langMode?: "roman" | "urdu", isMayyat?: boolean) {
  if (!text) return null;
  const lines = text.split("\n");
  const isUrduMode = langMode === "urdu";
  const isMayyatNotice = isMayyat || isUrduMode || text.includes("إِنَّا لِلَّٰهِ") || text.includes("raza-e-ilahi");

  return (
    <div className={`space-y-3.5 leading-relaxed ${isUrduMode ? "text-right" : ""}`} dir={isUrduMode ? "rtl" : "ltr"}>
      {lines.map((line, lineIndex) => {
        const trimmed = line.trim();
        if (!trimmed) return null;

        const parts = trimmed.split(/(\*\*.*?\*\*)/g);
        const isArabicHeader = lineIndex === 0 && /[\u0600-\u06FF]/.test(trimmed);

        return (
          <p
            key={lineIndex}
            className={`${
              isArabicHeader
                ? "text-center text-xl sm:text-2xl font-black py-1 text-slate-950 font-serif leading-loose"
                : isUrduMode
                ? "text-slate-900 text-lg sm:text-xl font-extrabold leading-relaxed font-serif"
                : "text-slate-900 text-base sm:text-lg font-bold leading-relaxed tracking-wide"
            }`}
          >
            {parts.map((part, partIndex) => {
              if (part.startsWith("**") && part.endsWith("**") && part.length >= 4) {
                const inner = part.slice(2, -2);
                return (
                  <strong
                    key={partIndex}
                    className={
                      isMayyatNotice
                        ? "font-black text-slate-950"
                        : "font-black text-teal-700 underline decoration-teal-500/50 decoration-2 underline-offset-4"
                    }
                  >
                    {inner}
                  </strong>
                );
              }
              return part;
            })}
          </p>
        );
      })}
    </div>
  );
}

function getReactionLabel(t: (k: string) => string, reaction: ReactionKind) {
  if (reaction === "heart") return t('reaction_heart') || '❤️ Love';
  if (reaction === "thumbs_up") return t('reaction_thumbs') || '👍 Thumbs up';
  if (reaction === "laugh") return '😂 Laugh';
  if (reaction === "surprised") return '😮 Wow';
  if (reaction === "sad") return '😢 Sad';
  if (reaction === "pray") return '🙏 Pray';
  if (reaction === "fire") return '🔥 Fire';
  if (reaction === "clap") return '👏 Clap';
  if (reaction === "correct") return t('reaction_correct') || '✅ Correct';
  return t('reaction_wrong') || '❌ Wrong';
}

function getReactionEmoji(reaction: ReactionKind) {
  if (reaction === "heart") return "❤️";
  if (reaction === "thumbs_up") return "👍";
  if (reaction === "laugh") return "😂";
  if (reaction === "surprised") return "😮";
  if (reaction === "sad") return "😢";
  if (reaction === "pray") return "🙏";
  if (reaction === "fire") return "🔥";
  if (reaction === "clap") return "👏";
  if (reaction === "correct") return "✅";
  return "❌";
}

function getNormalizedReactionCounts(notice: Notice): Record<ReactionKind, number> {
  return {
    heart: notice.reactionCounts?.heart ?? 0,
    thumbs_up: notice.reactionCounts?.thumbs_up ?? 0,
    laugh: notice.reactionCounts?.laugh ?? 0,
    surprised: notice.reactionCounts?.surprised ?? 0,
    sad: notice.reactionCounts?.sad ?? 0,
    pray: notice.reactionCounts?.pray ?? 0,
    fire: notice.reactionCounts?.fire ?? 0,
    clap: notice.reactionCounts?.clap ?? 0,
    correct: notice.reactionCounts?.correct ?? 0,
    wrong: notice.reactionCounts?.wrong ?? 0,
  };
}

const reactionOptions: ReactionKind[] = [
  "heart",
  "thumbs_up",
  "laugh",
  "surprised",
  "sad",
  "pray",
  "fire",
  "clap",
  "correct",
  "wrong",
];

export default function NoticesPage() {
  const [role, setRole] = useState<Role>("loading");
  const [notices, setNotices] = useState<Notice[]>([]);
  const [isLoadingNotices, setIsLoadingNotices] = useState(true);
  const [filterType, setFilterType] = useState<"all" | "notice" | "mayyat">("all");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [noticeType, setNoticeType] = useState<"notice" | "mayyat">("notice");
  const [mayyatDetails, setMayyatDetails] = useState<MayyatDetails>(emptyMayyatDetails);
  const [pinned, setPinned] = useState(false);
  const [status, setStatus] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info"; isVisible: boolean }>({
    message: "",
    type: "success",
    isVisible: false,
  });

  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ message, type, isVisible: true });
  };
  const [openReactionPickerId, setOpenReactionPickerId] = useState<string | null>(null);
  const [editingNoticeId, setEditingNoticeId] = useState<string | null>(null);
  const [noticeToDelete, setNoticeToDelete] = useState<Notice | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");
  const [editNoticeType, setEditNoticeType] = useState<"notice" | "mayyat">("notice");
  const [editPinned, setEditPinned] = useState(false);
  const [editMayyatDetails, setEditMayyatDetails] = useState<MayyatDetails>(emptyMayyatDetails);
  const [createFormLangTab, setCreateFormLangTab] = useState<"roman" | "urdu">("roman");
  const [mayyatLangMode, setMayyatLangMode] = useState<"roman" | "urdu">(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("mayyat_lang_mode") as "roman" | "urdu") || "roman";
    }
    return "roman";
  });

  const handleLangModeChange = (mode: "roman" | "urdu") => {
    setMayyatLangMode(mode);
    if (typeof window !== "undefined") {
      localStorage.setItem("mayyat_lang_mode", mode);
    }
  };

  const isAdminRole = role === "super_admin" || role === "admin" || role === "moderator";
  const roleResolved = role !== "loading";

  const dispatchNoticeActivity = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event(NOTICE_ACTIVITY_EVENT));
    }
  };

  const markNoticesReadForCurrentUser = async () => {
    try {
      await API.post("/notices/mark-read");
    } catch {
      // Keep the page usable even if the badge refresh cannot be persisted.
    } finally {
      dispatchNoticeActivity();
    }
  };

  const loadNotices = async (showSpinner = true) => {
    if (showSpinner) setIsLoadingNotices(true);
    try {
      const response = await API.get<{ success: boolean; notices: Notice[] }>("/notices/all");
      const fetchedNotices = Array.isArray(response.data?.notices) ? response.data.notices : [];

      setNotices((current) => {
        if (current.length === 0) return fetchedNotices;
        return fetchedNotices.map((n) => {
          const existing = current.find((item) => item.id === n.id);
          if (!existing) return n;
          return {
            ...n,
            body: existing.type === "mayyat" && n.mayyatDetails ? buildMayyatBody(n.mayyatDetails, mayyatLangMode) : n.body,
          };
        });
      });
    } catch {
      if (showSpinner) {
        setStatus(t('unable_load_notices'));
        setNotices([]);
      }
    } finally {
      if (showSpinner) setIsLoadingNotices(false);
    }
  };

  useEffect(() => {
    const loadRole = async () => {
      try {
        const response = await API.get<{ success?: boolean; user?: AuthUser }>("/auth/me");
        const userRole = response.data?.user?.role;
        if (userRole) {
          setRole(normalizeRole(userRole));
        } else {
          setRole("member");
        }
      } catch {
        setRole("member");
      }
    };

    void loadRole();
    void loadNotices();
  }, []);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      if (typeof document !== "undefined" && document.hidden) return;
      void loadNotices(false);
    }, 10000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [mayyatLangMode]);

  useEffect(() => {
    if (!roleResolved) return;

    void markNoticesReadForCurrentUser();
  }, [roleResolved]);

  const updateMayyatDetails = (field: keyof MayyatDetails, value: string) => {
    setMayyatDetails((current) => {
      const updated = { ...current, [field]: value };
      if (field === "deceasedNameRoman") updated.deceasedName = value;
      if (field === "fatherNameRoman") updated.fatherName = value;
      if (field === "relationRoman") updated.relation = value;
      if (field === "funeralPrayerDayPartRoman") updated.funeralPrayerDayPart = value;
      if (field === "funeralPrayerTimeRoman") updated.funeralPrayerTime = value;
      if (field === "funeralPrayerPlaceRoman") updated.funeralPrayerPlace = value;
      if (field === "notesRoman") updated.notes = value;
      return updated;
    });
  };

  const upsertNotice = (updatedNotice: Notice) => {
    setNotices((current) => {
      const index = current.findIndex((item) => item.id === updatedNotice.id);
      if (index === -1) return [updatedNotice, ...current];
      const cloned = [...current];
      cloned[index] = updatedNotice;
      return cloned;
    });
  };

  const handlePost = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (noticeType === "mayyat") {
      const sanitized = sanitizeMayyatDetails(mayyatDetails);
      const decName = sanitized.deceasedName.trim();
      const dayPart = sanitized.funeralPrayerDayPart.trim();
      const time = sanitized.funeralPrayerTime.trim();
      const place = sanitized.funeralPrayerPlace.trim();

      if (!decName || (!dayPart && !time) || !place) {
        setStatus(t('add_name_time_place_required'));
        return;
      }

      try {
        const mayyatBody = buildMayyatBody(sanitized, "roman");
        const payload = {
          title: "Mayyat Notification",
          body: mayyatBody,
          type: "mayyat",
          mayyatDetails: sanitized,
          pinned,
        };

        const response = await API.post<{ success: boolean; notice: Notice }>("/notices/create", payload);
        if (response.data?.notice) {
          const notice = response.data.notice;
          const noticeToShow = notice.type === "mayyat" && notice.mayyatDetails
            ? { ...notice, body: buildMayyatBody(notice.mayyatDetails, mayyatLangMode) }
            : notice;
          upsertNotice(noticeToShow);
        }

        setTitle("");
        setBody("");
        setNoticeType("notice");
        setMayyatDetails(emptyMayyatDetails);
        setPinned(false);
        setStatus(t('publish_mayyat_success'));
        await markNoticesReadForCurrentUser();
      } catch {
        setStatus(t('unable_publish'));
      }
      return;
    }

    if (!title.trim() || !body.trim()) {
      setStatus(t('add_title_body_required'));
      return;
    }

    try {
      const payload = {
        title: title.trim(),
        body: body.trim(),
        type: "notice",
        pinned,
      };

      const response = await API.post<{ success: boolean; notice: Notice }>("/notices/create", payload);
      if (response.data?.notice) {
        upsertNotice(response.data.notice);
      }

      setTitle("");
      setBody("");
      setNoticeType("notice");
      setPinned(false);
      setStatus(t('publish_notice_success'));
      await markNoticesReadForCurrentUser();
    } catch {
      setStatus(t('unable_publish'));
    }
  };

  const handleReact = async (noticeId: string, reaction: ReactionKind) => {
    setNotices((current) =>
      current.map((n) => {
        if (n.id !== noticeId) return n;
        const previousReaction = n.userReaction;
        const counts = { ...(n.reactionCounts || {}) };

        if (previousReaction === reaction) {
          counts[reaction] = Math.max(0, (counts[reaction] || 1) - 1);
          return { ...n, userReaction: undefined, reactionCounts: counts, reactions: Math.max(0, n.reactions - 1) };
        } else {
          if (previousReaction) {
            counts[previousReaction] = Math.max(0, (counts[previousReaction] || 1) - 1);
          }
          counts[reaction] = (counts[reaction] || 0) + 1;
          const reactionsDelta = previousReaction ? 0 : 1;
          return { ...n, userReaction: reaction, reactionCounts: counts, reactions: n.reactions + reactionsDelta };
        }
      })
    );

    try {
      const response = await API.patch<{ success: boolean; notice: Notice }>(`/notices/${noticeId}/react`, { reaction });
      if (response.data?.notice) {
        upsertNotice(response.data.notice);
      }
    } catch {
      showToast(t('unable_react'), "error");
    }
  };

  const handleTogglePin = async (notice: Notice) => {
    const nextPinnedState = !notice.pinned;

    setNotices((current) => {
      const updated = current.map((item) =>
        item.id === notice.id ? { ...item, pinned: nextPinnedState } : item
      );
      return [...updated].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
    });

    showToast(nextPinnedState ? "📌 Notice pinned to top!" : "Notice unpinned", "success");

    try {
      const response = await API.patch<{ success: boolean; notice: Notice }>(`/notices/${notice.id}/pin`, { pinned: nextPinnedState });
      if (response.data?.notice) {
        upsertNotice(response.data.notice);
      }
    } catch (err: any) {
      setNotices((current) =>
        current.map((item) => (item.id === notice.id ? { ...item, pinned: notice.pinned } : item))
      );
      const msg = err?.response?.data?.message || t('unable_update_pin');
      showToast(msg, "error");
    }
  };

  const handleDelete = (noticeId: string) => {
    const targetNotice = notices.find((item) => item.id === noticeId);
    if (targetNotice) setNoticeToDelete(targetNotice);
  };

  const confirmDeleteNotice = async () => {
    if (!noticeToDelete) return;
    const noticeId = noticeToDelete.id;
    const targetNotice = noticeToDelete;
    setNoticeToDelete(null);

    setNotices((current) => current.filter((item) => item.id !== noticeId));
    showToast(t('notice_deleted'), "success");
    dispatchNoticeActivity();

    try {
      await API.delete(`/notices/${noticeId}`);
    } catch {
      if (targetNotice) upsertNotice(targetNotice);
      showToast(t('unable_delete'), "error");
    }
  };

  const updateEditMayyatDetails = (field: keyof MayyatDetails, value: string) => {
    setEditMayyatDetails((current) => {
      const updated = { ...current, [field]: value };
      if (field === "deceasedNameRoman") updated.deceasedName = value;
      if (field === "fatherNameRoman") updated.fatherName = value;
      if (field === "relationRoman") updated.relation = value;
      if (field === "funeralPrayerDayPartRoman") updated.funeralPrayerDayPart = value;
      if (field === "funeralPrayerTimeRoman") updated.funeralPrayerTime = value;
      if (field === "funeralPrayerPlaceRoman") updated.funeralPrayerPlace = value;
      if (field === "notesRoman") updated.notes = value;
      return updated;
    });
  };

  const startEdit = (notice: Notice) => {
    setEditingNoticeId(notice.id);
    setEditTitle(notice.title);
    setEditBody(notice.body);
    setEditNoticeType(notice.type ?? "notice");
    setEditPinned(Boolean(notice.pinned));
    setEditMayyatDetails(notice.type === "mayyat" && notice.mayyatDetails ? sanitizeMayyatDetails(notice.mayyatDetails) : emptyMayyatDetails);
  };

  const cancelEdit = () => {
    setEditingNoticeId(null);
    setEditTitle("");
    setEditBody("");
    setEditNoticeType("notice");
    setEditPinned(false);
    setEditMayyatDetails(emptyMayyatDetails);
  };

  const saveEdit = async (noticeId: string) => {
    if (editNoticeType === "mayyat") {
      const targetNotice = notices.find((n) => n.id === noticeId);
      const existingDetails = sanitizeMayyatDetails(targetNotice?.mayyatDetails || editMayyatDetails);
      const isUrduEdit = mayyatLangMode === "urdu";

      let mergedDetails: MayyatDetails;
      if (isUrduEdit) {
        const decName = (editMayyatDetails.deceasedNameUrdu ?? existingDetails.deceasedNameUrdu ?? "").trim();
        const dayPart = (editMayyatDetails.funeralPrayerDayPartUrdu ?? existingDetails.funeralPrayerDayPartUrdu ?? "").trim();
        const time = (editMayyatDetails.funeralPrayerTimeUrdu ?? existingDetails.funeralPrayerTimeUrdu ?? "").trim();
        const place = (editMayyatDetails.funeralPrayerPlaceUrdu ?? existingDetails.funeralPrayerPlaceUrdu ?? "").trim();

        if (!decName || (!dayPart && !time) || !place) {
          setStatus(t('add_name_time_place_required'));
          return;
        }

        mergedDetails = {
          ...existingDetails,
          deceasedNameUrdu: editMayyatDetails.deceasedNameUrdu,
          fatherNameUrdu: editMayyatDetails.fatherNameUrdu,
          relationUrdu: editMayyatDetails.relationUrdu,
          funeralPrayerDayPartUrdu: editMayyatDetails.funeralPrayerDayPartUrdu,
          funeralPrayerTimeUrdu: editMayyatDetails.funeralPrayerTimeUrdu,
          funeralPrayerPlaceUrdu: editMayyatDetails.funeralPrayerPlaceUrdu,
          notesUrdu: editMayyatDetails.notesUrdu,
        };
      } else {
        const decName = (editMayyatDetails.deceasedNameRoman ?? editMayyatDetails.deceasedName ?? "").trim();
        const dayPart = (editMayyatDetails.funeralPrayerDayPartRoman ?? editMayyatDetails.funeralPrayerDayPart ?? "").trim();
        const time = (editMayyatDetails.funeralPrayerTimeRoman ?? editMayyatDetails.funeralPrayerTime ?? "").trim();
        const place = (editMayyatDetails.funeralPrayerPlaceRoman ?? editMayyatDetails.funeralPrayerPlace ?? "").trim();

        if (!decName || (!dayPart && !time) || !place) {
          setStatus(t('add_name_time_place_required'));
          return;
        }

        const decRoman = editMayyatDetails.deceasedNameRoman ?? editMayyatDetails.deceasedName ?? "";
        const fRoman = editMayyatDetails.fatherNameRoman ?? editMayyatDetails.fatherName ?? "";
        const relRoman = editMayyatDetails.relationRoman ?? editMayyatDetails.relation ?? "";
        const dayPartRoman = editMayyatDetails.funeralPrayerDayPartRoman ?? editMayyatDetails.funeralPrayerDayPart ?? "";
        const timeRoman = editMayyatDetails.funeralPrayerTimeRoman ?? editMayyatDetails.funeralPrayerTime ?? "";
        const placeRoman = editMayyatDetails.funeralPrayerPlaceRoman ?? editMayyatDetails.funeralPrayerPlace ?? "";
        const notesRoman = editMayyatDetails.notesRoman ?? editMayyatDetails.notes ?? "";

        mergedDetails = {
          ...existingDetails,
          deceasedNameRoman: decRoman,
          fatherNameRoman: fRoman,
          relationRoman: relRoman,
          funeralPrayerDayPartRoman: dayPartRoman,
          funeralPrayerTimeRoman: timeRoman,
          funeralPrayerPlaceRoman: placeRoman,
          notesRoman: notesRoman,
          deceasedName: decRoman,
          fatherName: fRoman,
          relation: relRoman,
          funeralPrayerDayPart: dayPartRoman,
          funeralPrayerTime: timeRoman,
          funeralPrayerPlace: placeRoman,
          notes: notesRoman,
        };
      }

      try {
        const nextBody = buildMayyatBody(mergedDetails, mayyatLangMode);
        const response = await API.put(`/notices/${noticeId}`, {
          title: "Mayyat Notification",
          body: nextBody,
          type: "mayyat",
          pinned: editPinned,
          mayyatDetails: mergedDetails,
        });

        if (response.data?.notice) {
          upsertNotice(response.data.notice);
        }

        cancelEdit();
        setStatus(t('update_success_mayyat'));
      } catch {
        setStatus(t('unable_update'));
      }
      return;
    }

    if (!editTitle.trim() || !editBody.trim()) {
      setStatus(t('add_title_body_required'));
      return;
    }

    try {
      const response = await API.put(`/notices/${noticeId}`, {
        title: editTitle.trim(),
        body: editBody.trim(),
        type: "notice",
        pinned: editPinned,
      });

      if (response.data?.notice) {
        upsertNotice(response.data.notice);
      }

      cancelEdit();
      setStatus(t('update_success_notice'));
    } catch {
      setStatus(t('unable_update'));
    }
  };

  const handleShare = async (notice: Notice) => {
    setNotices((current) =>
      current.map((item) => (item.id === notice.id ? { ...item, shares: (item.shares || 0) + 1, hasShared: true } : item))
    );

    const text = `${notice.type === "mayyat" ? "Mayyat Notification: " : ""}${notice.title}\n${notice.body}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: notice.title,
          text,
          url: window.location.href,
        });
        showToast("Notice shared!", "success");
      } catch {
        // User cancelled share sheet
      }
    } else if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(text);
        showToast("Notice content copied to clipboard!", "success");
      } catch {
        showToast("Notice copied!", "success");
      }
    }

    API.post<{ success: boolean; notice: Notice }>(`/notices/${notice.id}/share`)
      .then((response) => {
        if (response.data?.notice) upsertNotice(response.data.notice);
      })
      .catch(() => {});
  };

  const isMayyatNotice = (n: Notice) => {
    return (
      n.type === "mayyat" ||
      Boolean(n.mayyatDetails?.deceasedName) ||
      Boolean((n as any).isMayyat) ||
      (n as any).category === "mayyat" ||
      Boolean(n.title && (n.title.toLowerCase().includes("mayyat") || n.title.includes("میّت")))
    );
  };

  const noticeList = useMemo(() => {
    if (filterType === "all") return notices;
    if (filterType === "mayyat") return notices.filter(isMayyatNotice);
    return notices.filter((n) => !isMayyatNotice(n));
  }, [notices, filterType]);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <SEO pageKey="notices" />
      <div className="overflow-hidden rounded-3xl border border-teal-200 bg-gradient-to-br from-teal-600 via-emerald-600 to-teal-700 text-white shadow-xl p-5 sm:p-7">
        <div className="flex flex-wrap items-center gap-2 mb-2 min-w-0">
          <span className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-white border border-white/30 backdrop-blur-md">
            <img src="/logo.png" alt="Logo" className="h-4 w-4 shrink-0 object-contain brightness-200" />
            <span className="truncate">COMMUNITY ALERTS & NOTICES</span>
          </span>
        </div>
        <h1 className="text-xl sm:text-3xl font-black leading-tight text-white tracking-tight break-words">Notices & Mayyat Announcements</h1>
        <p className="mt-1.5 max-w-2xl text-xs sm:text-sm font-medium text-teal-50 leading-relaxed">
          {!roleResolved
            ? t('checking_access')
            : isAdminRole
            ? t('admin_publish_notice')
            : t('member_mode_msg')}
        </p>

        <div className="mt-3.5 inline-flex rounded-full bg-white/20 px-3.5 py-1 text-xs font-extrabold text-white border border-white/30 backdrop-blur-md">
          {role === "loading"
            ? t('checking_access_short')
            : role === "super_admin" || role === "admin"
            ? t('admin_access')
            : role === "moderator"
            ? t('moderator_access')
            : t('member_access')}
        </div>
      </div>

      {!roleResolved ? (
        <div className="rounded-2xl border border-teal-500/30 bg-white p-4 text-sm font-medium text-slate-700 shadow-md">{t('checking_access_short')}</div>
      ) : isAdminRole ? (
        <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 sm:p-7 text-slate-900 shadow-2xl transition-all duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-200">
            <div className="min-w-0 flex-1">
              <div className="flex items-start gap-2 min-w-0">
                <span className="text-lg shrink-0 mt-0.5">📝</span>
                <h2 className="text-sm sm:text-xl font-black text-slate-900 tracking-tight leading-snug break-words">
                  {t('post_notice_title')}
                </h2>
              </div>
              <p className="mt-1 text-xs sm:text-sm font-medium text-slate-500 leading-relaxed">{t('post_notice_subtitle')}</p>
            </div>
            <span className="self-start sm:self-center inline-flex items-center rounded-full bg-teal-50 border border-teal-200 px-3 py-0.5 text-[11px] font-extrabold text-teal-800 shrink-0">
              {t('admin_only')}
            </span>
          </div>

          <form onSubmit={handlePost} className="mt-5 space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setNoticeType("notice")}
                className={`rounded-xl border px-4 py-3 text-left text-sm font-extrabold transition flex items-center justify-between cursor-pointer ${
                  noticeType === "notice"
                    ? "active-green-btn bg-teal-600 !text-white border-teal-600 shadow-md shadow-teal-600/30"
                    : "border-slate-300 bg-slate-100 text-slate-700 hover:border-teal-500 hover:text-slate-900"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span>📢</span>
                  <span className={noticeType === "notice" ? "!text-white font-extrabold" : ""}>{t('regular_notice')}</span>
                </div>
                {noticeType === "notice" && <span className="h-2.5 w-2.5 rounded-full bg-white animate-pulse"></span>}
              </button>
              <button
                type="button"
                onClick={() => setNoticeType("mayyat")}
                className={`rounded-xl border px-4 py-3 text-left text-sm font-extrabold transition flex items-center justify-between cursor-pointer ${
                  noticeType === "mayyat"
                    ? "active-green-btn bg-teal-600 !text-white border-teal-600 shadow-md shadow-teal-600/30"
                    : "border-slate-300 bg-slate-100 text-slate-700 hover:border-teal-500 hover:text-slate-900"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span>🕌</span>
                  <span className={noticeType === "mayyat" ? "!text-white font-extrabold" : ""}>{t('mayyat_notification')}</span>
                </div>
                {noticeType === "mayyat" && <span className="h-2.5 w-2.5 rounded-full bg-white animate-pulse"></span>}
              </button>
            </div>

            {noticeType === "mayyat" ? (
              <div className="space-y-4 rounded-2xl border border-amber-300 bg-amber-50/50 p-4 sm:p-5">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-200 pb-3">
                  <span className="text-xs font-black uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                    <span>✨</span>
                    <span>Mayyat Details / تفصیلات:</span>
                  </span>

                  <div className="flex items-center gap-1 rounded-xl bg-white p-1 border border-amber-200">
                    <button
                      type="button"
                      onClick={() => setCreateFormLangTab("roman")}
                      className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                        createFormLangTab === "roman"
                          ? "active-green-btn bg-teal-600 !text-white shadow-md"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      Roman Urdu Fields
                    </button>
                    <button
                      type="button"
                      onClick={() => setCreateFormLangTab("urdu")}
                      className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                        createFormLangTab === "urdu"
                          ? "active-green-btn bg-teal-600 !text-white shadow-md font-serif"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      اردو فیلڈز
                    </button>
                  </div>
                </div>

                {createFormLangTab === "roman" ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <input
                      value={mayyatDetails.deceasedNameRoman ?? mayyatDetails.deceasedName ?? ""}
                      onChange={(event) => updateMayyatDetails("deceasedNameRoman", event.target.value)}
                      placeholder="Marhoom Ka Naam *"
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-900 placeholder-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition"
                    />
                    <input
                      value={mayyatDetails.fatherNameRoman ?? mayyatDetails.fatherName ?? ""}
                      onChange={(event) => updateMayyatDetails("fatherNameRoman", event.target.value)}
                      placeholder="Walid Ka Naam"
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-900 placeholder-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition"
                    />
                    <input
                      value={mayyatDetails.relationRoman ?? mayyatDetails.relation ?? ""}
                      onChange={(event) => updateMayyatDetails("relationRoman", event.target.value)}
                      placeholder="Rishta (e.g. walad / beta / beti / shohar)"
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-900 placeholder-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition"
                    />
                    <input
                      value={mayyatDetails.funeralPrayerDayPartRoman ?? mayyatDetails.funeralPrayerDayPart ?? ""}
                      onChange={(event) => updateMayyatDetails("funeralPrayerDayPartRoman", event.target.value)}
                      placeholder="Subah / Raat / Din Part (e.g. Subah / Raat)"
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-900 placeholder-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition"
                    />
                    <input
                      value={mayyatDetails.funeralPrayerTimeRoman ?? mayyatDetails.funeralPrayerTime ?? ""}
                      onChange={(event) => updateMayyatDetails("funeralPrayerTimeRoman", event.target.value)}
                      placeholder="Waqt (e.g. 10:00 / 5:00)"
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-900 placeholder-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition"
                    />
                    <input
                      value={mayyatDetails.funeralPrayerPlaceRoman ?? mayyatDetails.funeralPrayerPlace ?? ""}
                      onChange={(event) => updateMayyatDetails("funeralPrayerPlaceRoman", event.target.value)}
                      placeholder="Namaz-e-Janaza Ka Muqam (Masjid + Address) *"
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-900 placeholder-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition"
                    />
                    <input
                      value={mayyatDetails.notesRoman ?? mayyatDetails.notes ?? ""}
                      onChange={(event) => updateMayyatDetails("notesRoman", event.target.value)}
                      placeholder="Extra Notes / Dua Request (Optional)"
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-900 placeholder-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition sm:col-span-2"
                    />
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2 text-right" dir="rtl">
                    <input
                      value={mayyatDetails.deceasedNameUrdu || ""}
                      onChange={(event) => updateMayyatDetails("deceasedNameUrdu", event.target.value)}
                      placeholder="مرحوم کا نام *"
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-900 placeholder-slate-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition font-serif"
                    />
                    <input
                      value={mayyatDetails.fatherNameUrdu || ""}
                      onChange={(event) => updateMayyatDetails("fatherNameUrdu", event.target.value)}
                      placeholder="والد کا نام"
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-900 placeholder-slate-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition font-serif"
                    />
                    <input
                      value={mayyatDetails.relationUrdu || ""}
                      onChange={(event) => updateMayyatDetails("relationUrdu", event.target.value)}
                      placeholder="رشتہ (مثلاً ولد / بیٹا / شوہر)"
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-900 placeholder-slate-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition font-serif"
                    />
                    <input
                      value={mayyatDetails.funeralPrayerDayPartUrdu || ""}
                      onChange={(event) => updateMayyatDetails("funeralPrayerDayPartUrdu", event.target.value)}
                      placeholder="صبح / رات / ظہر (مثلاً صبح / رات)"
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-900 placeholder-slate-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition font-serif"
                    />
                    <input
                      value={mayyatDetails.funeralPrayerTimeUrdu || ""}
                      onChange={(event) => updateMayyatDetails("funeralPrayerTimeUrdu", event.target.value)}
                      placeholder="وقت (مثلاً 10:00 / 5:00)"
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-900 placeholder-slate-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition font-serif"
                    />
                    <input
                      value={mayyatDetails.funeralPrayerPlaceUrdu || ""}
                      onChange={(event) => updateMayyatDetails("funeralPrayerPlaceUrdu", event.target.value)}
                      placeholder="نمازِ جنازہ کا مقام (مسجد + ایڈریس) *"
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-900 placeholder-slate-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition font-serif"
                    />
                    <input
                      value={mayyatDetails.notesUrdu || ""}
                      onChange={(event) => updateMayyatDetails("notesUrdu", event.target.value)}
                      placeholder="اضافی نوٹ / دعا کی التجا"
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-900 placeholder-slate-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition sm:col-span-2 font-serif"
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder={t('placeholder_notice_title')}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-900 placeholder-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition"
                />
                <textarea
                  value={body}
                  onChange={(event) => setBody(event.target.value)}
                  rows={4}
                  placeholder={t('placeholder_notice_body')}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-900 placeholder-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition"
                />
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <label className="flex items-center gap-2.5 text-xs sm:text-sm font-bold text-slate-800 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={pinned}
                  onChange={() => setPinned((current) => !current)}
                  className="h-4 w-4 rounded border-slate-300 bg-white text-teal-600 focus:ring-teal-500 accent-teal-600"
                />
                <span className="text-slate-800 font-bold">{t('pin_this_notice')}</span>
              </label>

              <button
                type="submit"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl active-green-btn btn-primary bg-teal-600 !text-white px-6 py-3 text-xs sm:text-sm font-black uppercase tracking-wider shadow-lg shadow-teal-600/30 hover:bg-teal-700 active:scale-95 transition cursor-pointer"
              >
                <span className="!text-white font-black">🚀</span>
                <span className="!text-white font-black">{noticeType === "mayyat" ? t('publish_mayyat_action') : t('publish_notice_action')}</span>
              </button>
            </div>
          </form>

          {status ? (
            <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs sm:text-sm font-bold text-emerald-300 flex items-center gap-2">
              <span>✅</span>
              <span>{status}</span>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="rounded-2xl border border-teal-500/30 bg-white p-5 text-sm font-medium text-slate-700 shadow-md">
          {t('member_mode_msg')}
        </div>
      )}

      <div className="space-y-3">
        {/* Notice Category View Filter Bar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-200 bg-white p-3 sm:p-4 shadow-md">
          <div className="grid grid-cols-3 gap-1.5 w-full sm:flex sm:w-auto">
            <button
              type="button"
              onClick={() => setFilterType("all")}
              className={`rounded-xl px-1 py-2 sm:px-3.5 sm:py-2.5 text-[10px] sm:text-xs font-black transition cursor-pointer text-center truncate ${
                filterType === "all"
                  ? "active-green-btn bg-teal-600 !text-white shadow-md shadow-teal-600/30"
                  : "bg-slate-100 text-slate-700 border border-slate-300 hover:bg-teal-50"
              }`}
            >
              <span className={filterType === "all" ? "!text-white font-black" : ""}>📋 All ({notices.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setFilterType("notice")}
              className={`rounded-xl px-1 py-2 sm:px-3.5 sm:py-2.5 text-[10px] sm:text-xs font-black transition cursor-pointer text-center truncate ${
                filterType === "notice"
                  ? "active-green-btn bg-teal-600 !text-white shadow-md shadow-teal-600/30"
                  : "bg-slate-100 text-slate-700 border border-slate-300 hover:bg-teal-50"
              }`}
            >
              <span className={filterType === "notice" ? "!text-white font-black" : ""}>📢 Regular ({notices.filter((n) => !isMayyatNotice(n)).length})</span>
            </button>
            <button
              type="button"
              onClick={() => setFilterType("mayyat")}
              className={`rounded-xl px-1 py-2 sm:px-3.5 sm:py-2.5 text-[10px] sm:text-xs font-black transition cursor-pointer text-center truncate ${
                filterType === "mayyat"
                  ? "active-green-btn bg-teal-600 !text-white shadow-md shadow-teal-600/30"
                  : "bg-slate-100 text-slate-700 border border-slate-300 hover:bg-teal-50"
              }`}
            >
              <span className={filterType === "mayyat" ? "!text-white font-black" : ""}>🕌 Mayyat ({notices.filter(isMayyatNotice).length})</span>
            </button>
          </div>

          {/* Mayyat Language Selection Controls */}
          <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 border border-slate-300 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => handleLangModeChange("roman")}
              className={`flex-1 sm:flex-initial rounded-lg px-3 py-1.5 text-xs font-bold text-center transition ${
                mayyatLangMode === "roman"
                  ? "bg-teal-600 !text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Roman Urdu
            </button>
            <button
              type="button"
              onClick={() => handleLangModeChange("urdu")}
              className={`flex-1 sm:flex-initial rounded-lg px-3 py-1.5 text-xs font-bold text-center transition ${
                mayyatLangMode === "urdu"
                  ? "bg-emerald-600 !text-white shadow-sm font-serif"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              اردو
            </button>
          </div>
        </div>

        {isLoadingNotices ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm font-medium text-slate-700 shadow-md">{t('loading_notices')}</div>
        ) : noticeList.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm font-medium text-slate-700 shadow-md">{t('no_notices')}</div>
        ) : null}

        {noticeList.map((notice) => {
          const isMayyat = isMayyatNotice(notice);
          const selectedReaction = notice.userReaction;
          const hasShared = Boolean(notice.hasShared);
          const reactionCounts = getNormalizedReactionCounts(notice);
          const visibleReactionCounts = reactionOptions.filter((reaction) => reactionCounts[reaction] > 0);

          return (
            <article
              key={notice.id}
              className={`relative overflow-hidden rounded-3xl border p-6 shadow-xl transition-all duration-300 ${
                isMayyat
                  ? "border-amber-500/60 bg-white text-slate-900"
                  : notice.pinned
                  ? "border-amber-400/60 bg-white text-slate-900"
                  : "border-slate-200 bg-white text-slate-900"
              }`}
            >
              <div className="absolute -right-10 -bottom-10 h-32 w-32 rounded-full bg-slate-100 blur-2xl pointer-events-none" />

              {/* Header Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
                <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                  <div
                    className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl font-extrabold text-base shadow-inner ${
                      notice.pinned ? "bg-amber-100 border border-amber-300 text-slate-900" : isMayyat ? "bg-amber-100 border border-amber-300 text-slate-900" : "bg-teal-100 border border-teal-300 text-teal-800"
                    }`}
                  >
                    {notice.pinned ? "📌" : isMayyat ? "🕌" : "📢"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ${
                          isMayyat
                            ? "bg-amber-100 text-slate-900 border border-amber-300"
                            : "bg-teal-100 text-teal-900 border border-teal-300"
                        }`}
                      >
                        {isMayyat
                          ? (mayyatLangMode === "urdu" ? "اطلاعِ میّت" : t('mayyat_label'))
                          : "Official Announcement"}
                      </span>

                      {notice.pinned && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-400 text-slate-950 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider shadow-md">
                          <span>📌</span>
                          <span>{mayyatLangMode === "urdu" ? "پن شدہ" : t('pinned_label')}</span>
                        </span>
                      )}
                    </div>
                    {!isMayyat && (
                      <h3 className="mt-1.5 text-base sm:text-xl font-black text-slate-900 tracking-tight leading-snug break-words max-w-full">
                        {notice.title}
                      </h3>
                    )}
                  </div>
                </div>

                {/* Author & Timestamp */}
                <div className="flex items-center justify-between sm:justify-end gap-2 text-xs text-slate-800 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-300 backdrop-blur-md w-full sm:w-auto shrink-0 shadow-sm">
                  <span className="font-extrabold text-slate-950 truncate max-w-[180px] sm:max-w-none">👤 {notice.author || "Admin"}</span>
                  <span className="text-slate-500">•</span>
                  <span className="font-medium text-slate-700 shrink-0">{formatNoticeTime(notice.createdAt)}</span>
                </div>
              </div>

              {/* Body Content Box */}
              <div
                className={`mt-4 rounded-2xl p-4 sm:p-6 backdrop-blur-md break-words [overflow-wrap:anywhere] ${
                  isMayyat
                    ? "bg-amber-50/80 border border-amber-200 text-slate-950 shadow-inner"
                    : "bg-slate-50 border border-slate-200 text-slate-900"
                }`}
              >
                {renderFormattedText(
                  isMayyat && notice.mayyatDetails ? buildMayyatBody(notice.mayyatDetails, mayyatLangMode) : notice.body,
                  isMayyat ? mayyatLangMode : undefined,
                  isMayyat
                )}
              </div>

              <div className="mt-4 border-t border-slate-200 pt-3 space-y-2.5">
                {/* Upper Line: Reactions */}
                {!isMayyat ? (
                  <div className="relative flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setOpenReactionPickerId((current) => (current === notice.id ? null : notice.id))}
                      className={`inline-flex items-center justify-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-black transition cursor-pointer shadow-2xs ${
                        selectedReaction
                          ? "border-teal-500 bg-teal-50 text-teal-800 shadow-teal-500/20"
                          : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:border-teal-500"
                      }`}
                      title={selectedReaction ? "Click to change or remove reaction" : "React to notice"}
                    >
                      <span className="text-base leading-none">
                        {selectedReaction ? getReactionEmoji(selectedReaction) : "😊"}
                      </span>
                      <span>{selectedReaction ? "Reacted" : "React"}</span>
                    </button>

                    {openReactionPickerId === notice.id ? (
                      <div className="absolute left-0 bottom-full mb-2 z-30 grid grid-cols-5 sm:flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl animate-in fade-in zoom-in-95 duration-150 max-w-[280px] sm:max-w-none">
                        {reactionOptions.map((reaction) => {
                          const isSelected = selectedReaction === reaction;
                          return (
                            <button
                              key={reaction}
                              type="button"
                              onClick={() => {
                                handleReact(notice.id, reaction);
                                setOpenReactionPickerId(null);
                              }}
                              className={`grid h-9 w-9 place-items-center rounded-xl text-lg transition transform hover:scale-125 cursor-pointer ${
                                isSelected ? "bg-teal-100 ring-2 ring-teal-500" : "hover:bg-slate-100"
                              }`}
                              title={isSelected ? "Remove reaction" : getReactionLabel(t, reaction)}
                            >
                              {getReactionEmoji(reaction)}
                            </button>
                          );
                        })}
                      </div>
                    ) : null}

                    {visibleReactionCounts.length > 0 ? (
                      <div className="flex flex-wrap items-center gap-1.5">
                        {visibleReactionCounts.map((reaction) => {
                          const isSelected = selectedReaction === reaction;
                          return (
                            <button
                              key={reaction}
                              type="button"
                              onClick={() => handleReact(notice.id, reaction)}
                              className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-black transition cursor-pointer ${
                                isSelected
                                  ? "border-teal-400 bg-teal-50 text-teal-900 shadow-2xs hover:bg-teal-100"
                                  : "border-slate-200 bg-slate-100 text-slate-800 hover:bg-slate-200"
                              }`}
                              title={isSelected ? "Click to remove reaction" : "Click to react"}
                            >
                              <span className="text-sm leading-none">{getReactionEmoji(reaction)}</span>
                              <span>{reactionCounts[reaction]}</span>
                            </button>
                          );
                        })}
                      </div>
                    ) : null}
                  </div>
                ) : null}

                {/* Lower Line: Action Buttons (Pin, Edit, Share, Delete) - Single Line, Icon-only on mobile */}
                <div className="flex items-center gap-2 w-full pt-1">
                  {roleResolved && isAdminRole ? (
                    <>
                      <button
                        type="button"
                        onClick={() => handleTogglePin(notice)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-2.5 py-2 text-xs font-black text-amber-800 transition hover:bg-amber-100 cursor-pointer min-w-0"
                        title={notice.pinned ? t('unpin_label') : t('pin_label')}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m15 4 5 5-3 1-4 4v4l-2 2-2-6-6-2 2-2h4l4-4 1-3Z" />
                        </svg>
                        <span className="hidden sm:inline">{notice.pinned ? t('unpin_label') : t('pin_label')}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => startEdit(notice)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-2.5 py-2 text-xs font-black text-emerald-800 transition hover:bg-emerald-100 cursor-pointer min-w-0"
                        title={t('edit_label')}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 20h4l10.5-10.5a2.1 2.1 0 0 0-3-3L5 17v3Z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="m14 7 3 3" />
                        </svg>
                        <span className="hidden sm:inline">{t('edit_label')}</span>
                      </button>
                    </>
                  ) : null}

                  <button
                    type="button"
                    onClick={() => handleShare(notice)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white px-2.5 py-2 text-xs font-black text-slate-700 hover:border-teal-500 hover:bg-slate-50 transition cursor-pointer min-w-0"
                    title={hasShared ? t('shared_label') : t('share_label')}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 11v7a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-7M12 4v10m0-10 4 4m-4-4-4 4" />
                    </svg>
                    <span className="hidden sm:inline">{hasShared ? t('shared_label') : t('share_label')} ({notice.shares})</span>
                  </button>

                  {roleResolved && isAdminRole ? (
                    <button
                      type="button"
                      onClick={() => handleDelete(notice.id)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-2.5 py-2 text-xs font-black text-rose-700 transition hover:bg-rose-100 cursor-pointer min-w-0"
                      title={t('delete_label')}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V5h6v2" />
                      </svg>
                      <span className="hidden sm:inline">{t('delete_label')}</span>
                    </button>
                  ) : null}
                </div>
              </div>

              {roleResolved && isAdminRole && editingNoticeId === notice.id ? (
                <div className="mt-4 space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  {notice.type === "mayyat" ? (
                    mayyatLangMode === "roman" ? (
                      <div className="space-y-2">
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Editing Mayyat Notification (Roman Urdu)</p>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <input
                            value={editMayyatDetails.deceasedNameRoman ?? editMayyatDetails.deceasedName ?? ""}
                            onChange={(event) => updateEditMayyatDetails("deceasedNameRoman", event.target.value)}
                            placeholder="Marhoom Ka Naam *"
                            className="form-input px-3 py-2"
                          />
                          <input
                            value={editMayyatDetails.fatherNameRoman ?? editMayyatDetails.fatherName ?? ""}
                            onChange={(event) => updateEditMayyatDetails("fatherNameRoman", event.target.value)}
                            placeholder="Walid Ka Naam"
                            className="form-input px-3 py-2"
                          />
                          <input
                            value={editMayyatDetails.relationRoman ?? editMayyatDetails.relation ?? ""}
                            onChange={(event) => updateEditMayyatDetails("relationRoman", event.target.value)}
                            placeholder="Rishta (e.g. walad / beta / beti / shohar)"
                            className="form-input px-3 py-2"
                          />
                          <input
                            value={editMayyatDetails.funeralPrayerDayPartRoman ?? editMayyatDetails.funeralPrayerDayPart ?? ""}
                            onChange={(event) => updateEditMayyatDetails("funeralPrayerDayPartRoman", event.target.value)}
                            placeholder="Subah / Raat / Din Part (e.g. Subah / Raat)"
                            className="form-input px-3 py-2"
                          />
                          <input
                            value={editMayyatDetails.funeralPrayerTimeRoman ?? editMayyatDetails.funeralPrayerTime ?? ""}
                            onChange={(event) => updateEditMayyatDetails("funeralPrayerTimeRoman", event.target.value)}
                            placeholder="Waqt (e.g. 10:00 / 5:00)"
                            className="form-input px-3 py-2"
                          />
                          <input
                            value={editMayyatDetails.funeralPrayerPlaceRoman ?? editMayyatDetails.funeralPrayerPlace ?? ""}
                            onChange={(event) => updateEditMayyatDetails("funeralPrayerPlaceRoman", event.target.value)}
                            placeholder="Namaz-e-Janaza Ka Muqam (Masjid + Address) *"
                            className="form-input px-3 py-2"
                          />
                          <input
                            value={editMayyatDetails.notesRoman ?? editMayyatDetails.notes ?? ""}
                            onChange={(event) => updateEditMayyatDetails("notesRoman", event.target.value)}
                            placeholder="Extra Notes / Dua Request (Optional)"
                            className="form-input px-3 py-2 sm:col-span-2"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-xs font-bold font-serif text-emerald-800 text-right" dir="rtl">میّت نوٹس میں ترمیم (اردو)</p>
                        <div className="grid gap-3 sm:grid-cols-2 text-right" dir="rtl">
                          <input
                            value={editMayyatDetails.deceasedNameUrdu || ""}
                            onChange={(event) => updateEditMayyatDetails("deceasedNameUrdu", event.target.value)}
                            placeholder="مرحوم کا نام *"
                            className="form-input px-3 py-2 font-serif"
                          />
                          <input
                            value={editMayyatDetails.fatherNameUrdu || ""}
                            onChange={(event) => updateEditMayyatDetails("fatherNameUrdu", event.target.value)}
                            placeholder="والد کا نام"
                            className="form-input px-3 py-2 font-serif"
                          />
                          <input
                            value={editMayyatDetails.relationUrdu || ""}
                            onChange={(event) => updateEditMayyatDetails("relationUrdu", event.target.value)}
                            placeholder="رشتہ (مثلاً ولد / بیٹا / شوہر)"
                            className="form-input px-3 py-2 font-serif"
                          />
                          <input
                            value={editMayyatDetails.funeralPrayerDayPartUrdu || ""}
                            onChange={(event) => updateEditMayyatDetails("funeralPrayerDayPartUrdu", event.target.value)}
                            placeholder="صبح / رات / ظہر (مثلاً صبح / رات)"
                            className="form-input px-3 py-2 font-serif"
                          />
                          <input
                            value={editMayyatDetails.funeralPrayerTimeUrdu || ""}
                            onChange={(event) => updateEditMayyatDetails("funeralPrayerTimeUrdu", event.target.value)}
                            placeholder="وقت (مثلاً 10:00 / 5:00)"
                            className="form-input px-3 py-2 font-serif"
                          />
                          <input
                            value={editMayyatDetails.funeralPrayerPlaceUrdu || ""}
                            onChange={(event) => updateEditMayyatDetails("funeralPrayerPlaceUrdu", event.target.value)}
                            placeholder="نمازِ جنازہ کا مقام (مسجد + ایڈریس) *"
                            className="form-input px-3 py-2 font-serif"
                          />
                          <input
                            value={editMayyatDetails.notesUrdu || ""}
                            onChange={(event) => updateEditMayyatDetails("notesUrdu", event.target.value)}
                            placeholder="اضافی نوٹ / دعا کی التجا"
                            className="form-input px-3 py-2 sm:col-span-2 font-serif"
                          />
                        </div>
                      </div>
                    )
                  ) : (
                    <>
                      <input
                        value={editTitle}
                        onChange={(event) => setEditTitle(event.target.value)}
                        className="form-input px-3 py-2"
                        placeholder={t('placeholder_notice_title')}
                      />
                      <textarea
                        value={editBody}
                        onChange={(event) => setEditBody(event.target.value)}
                        rows={3}
                        className="form-input px-3 py-2"
                        placeholder={t('placeholder_notice_body')}
                      />
                    </>
                  )}
                  <label className="flex items-center gap-2 text-sm text-gray-600">
                    <input type="checkbox" checked={editPinned} onChange={() => setEditPinned((current) => !current)} />
                    {t('pin_this_notice')}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => saveEdit(notice.id)} className="btn-primary rounded-lg px-3 py-2 text-sm font-semibold">
                      {t('save_label')}
                    </button>
                    <button type="button" onClick={cancelEdit} className="btn-secondary rounded-lg px-3 py-2 text-sm font-semibold">
                      {t('cancel_label')}
                    </button>
                  </div>
                </div>
              ) : null}
            </article>
          );
        })}
      </div>

      <ConfirmModal
        isOpen={Boolean(noticeToDelete)}
        title="Delete Community Notice"
        message="Are you sure you want to delete this notice? This action cannot be undone."
        confirmText="Delete Notice"
        cancelText="Cancel"
        variant="danger"
        onConfirm={confirmDeleteNotice}
        onCancel={() => setNoticeToDelete(null)}
      />

      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={() => setToast((prev) => ({ ...prev, isVisible: false }))}
      />
    </div>
  );
}
