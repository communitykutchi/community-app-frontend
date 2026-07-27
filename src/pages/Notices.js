import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from "react";
import API from "../api/axios.js";
const NOTICE_ACTIVITY_EVENT = "community-notice-activity";
const noticesTranslations = {
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
const t = (key) => noticesTranslations[key] || key;
function normalizeRole(role) {
    if (role === "jamaat_admin")
        return "moderator";
    return role;
}
const emptyMayyatDetails = {
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
function sanitizeMayyatDetails(details) {
    const decRoman = details?.deceasedNameRoman || details?.deceasedName || "";
    const decUrdu = details?.deceasedNameUrdu || (details?.deceasedName && /[\u0600-\u06FF]/.test(details.deceasedName) ? details.deceasedName : "");
    const fRoman = details?.fatherNameRoman || details?.fatherName || "";
    const fUrdu = details?.fatherNameUrdu || (details?.fatherName && /[\u0600-\u06FF]/.test(details.fatherName) ? details.fatherName : "");
    const relRoman = details?.relationRoman || details?.relation || "";
    const relUrdu = details?.relationUrdu || (details?.relation && /[\u0600-\u06FF]/.test(details.relation) ? details.relation : "");
    const dayPartRoman = details?.funeralPrayerDayPartRoman || details?.funeralPrayerDayPart || "";
    const dayPartUrdu = details?.funeralPrayerDayPartUrdu || (details?.funeralPrayerDayPart && /[\u0600-\u06FF]/.test(details.funeralPrayerDayPart) ? details.funeralPrayerDayPart : "");
    const timeRoman = details?.funeralPrayerTimeRoman || details?.funeralPrayerTime || details?.time || "";
    const timeUrdu = details?.funeralPrayerTimeUrdu || timeRoman;
    const placeRoman = details?.funeralPrayerPlaceRoman || details?.funeralPrayerPlace || details?.janazaLocation || "";
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
        passedAwayAt: details?.passedAwayAt || details?.inteqal || "",
        funeralPrayerDayPart: dayPartRoman || dayPartUrdu,
        funeralPrayerTime: timeRoman || timeUrdu,
        funeralPrayerPlace: placeRoman || placeUrdu,
        burialPlace: details?.burialPlace || details?.tadfeen || "",
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
const romanToUrduMap = {
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
function toUrduText(text) {
    if (!text)
        return "";
    if (/[\u0600-\u06FF]/.test(text))
        return text;
    const words = text.trim().split(/\s+/);
    const converted = words.map((w) => {
        const clean = w.toLowerCase().replace(/[^a-z]/g, "");
        return romanToUrduMap[clean] || w;
    });
    return converted.join(" ");
}
function buildMayyatBodyRoman(details) {
    const normalized = sanitizeMayyatDetails(details);
    const decName = (normalized.deceasedNameRoman || normalized.deceasedName).trim().toUpperCase();
    const fName = (normalized.fatherNameRoman || normalized.fatherName).trim();
    const rel = (normalized.relationRoman || normalized.relation).trim();
    const relName = normalized.relationName.trim();
    const dayPart = (normalized.funeralPrayerDayPartRoman || normalized.funeralPrayerDayPart).trim();
    const time = (normalized.funeralPrayerTimeRoman || normalized.funeralPrayerTime).trim();
    const place = (normalized.funeralPrayerPlaceRoman || normalized.funeralPrayerPlace).trim();
    const notes = (normalized.notesRoman || normalized.notes).trim();
    const lines = [];
    lines.push("**إِنَّا لِلَّٰهِ وَإِنَّا إِلَيْهِ رَاجِعُونَ**");
    let line2 = "Humein nihayat afsos ke saath ittila di jaati hai ke";
    if (decName) {
        line2 += ` **${decName}**`;
    }
    if (fName && rel) {
        line2 += `, **${fName}** ke **${rel}** ka`;
    }
    else if (fName && !rel) {
        line2 += `, **${fName}** ka`;
    }
    else if (!fName && rel) {
        line2 += ` ke **${rel}** ka`;
    }
    else if (relName) {
        line2 += `, **${relName}** ka`;
    }
    else {
        line2 += " ka";
    }
    line2 += " **raza-e-ilahi se inteqal ho gaya hai.**";
    lines.push(line2);
    let dayPartStr = dayPart;
    if (dayPartStr && !/^aaj\b/i.test(dayPartStr)) {
        dayPartStr = `Aaj ${dayPartStr}`;
    }
    else if (!dayPartStr) {
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
function buildMayyatBodyUrdu(details) {
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
    const lines = [];
    lines.push("**إِنَّا لِلَّٰهِ وَإِنَّا إِلَيْهِ رَاجِعُونَ**");
    let line2 = "ہمیں نہایت افسوس کے ساتھ اطلاع دی جاتی ہے کہ";
    if (decName) {
        line2 += ` **${decName}**`;
    }
    if (fName && rel) {
        line2 += `، **${fName}** کے **${rel}** کا`;
    }
    else if (fName && !rel) {
        line2 += `، **${fName}** کا`;
    }
    else if (!fName && rel) {
        line2 += ` کے **${rel}** کا`;
    }
    else if (relName) {
        line2 += `، **${relName}** کا`;
    }
    else {
        line2 += " کا";
    }
    line2 += " **رضائے الٰہی سے انتقال ہو گیا ہے۔**";
    lines.push(line2);
    let dayPartStr = dayPart;
    if (dayPartStr && !/^آج\b|^aaj\b/i.test(dayPartStr)) {
        dayPartStr = `آج ${dayPartStr}`;
    }
    else if (!dayPartStr) {
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
function buildMayyatBody(details, lang = "roman") {
    if (lang === "urdu") {
        return buildMayyatBodyUrdu(details);
    }
    return buildMayyatBodyRoman(details);
}
function renderFormattedText(text, langMode) {
    if (!text)
        return null;
    const lines = text.split("\n");
    const isUrduMode = langMode === "urdu";
    return (_jsx("div", { className: `space-y-3 text-slate-800 leading-relaxed ${isUrduMode ? "text-right" : ""}`, dir: isUrduMode ? "rtl" : "ltr", children: lines.map((line, lineIndex) => {
            const trimmed = line.trim();
            if (!trimmed)
                return null;
            const parts = trimmed.split(/(\*\*.*?\*\*)/g);
            const isArabicHeader = lineIndex === 0 && /[\u0600-\u06FF]/.test(trimmed);
            return (_jsx("p", { className: `${isArabicHeader
                    ? "text-center text-xl sm:text-2xl font-bold py-1 text-slate-950 font-serif leading-loose"
                    : isUrduMode
                        ? "text-slate-900 text-lg sm:text-xl font-medium leading-relaxed font-serif"
                        : "text-slate-800 text-base"}`, children: parts.map((part, partIndex) => {
                    if (part.startsWith("**") && part.endsWith("**") && part.length >= 4) {
                        const inner = part.slice(2, -2);
                        return (_jsx("strong", { className: "font-bold text-slate-950", children: inner }, partIndex));
                    }
                    return part;
                }) }, lineIndex));
        }) }));
}
function getReactionLabel(t, reaction) {
    if (reaction === "heart")
        return t('reaction_heart') || '❤️';
    if (reaction === "thumbs_up")
        return t('reaction_thumbs') || '👍';
    if (reaction === "correct")
        return t('reaction_correct') || 'Correct';
    return t('reaction_wrong') || 'Wrong';
}
function getReactionEmoji(reaction) {
    if (reaction === "heart")
        return "❤️";
    if (reaction === "thumbs_up")
        return "👍";
    if (reaction === "correct")
        return "✅";
    return "❌";
}
function getNormalizedReactionCounts(notice) {
    return {
        heart: notice.reactionCounts?.heart ?? 0,
        thumbs_up: notice.reactionCounts?.thumbs_up ?? 0,
        correct: notice.reactionCounts?.correct ?? 0,
        wrong: notice.reactionCounts?.wrong ?? 0,
    };
}
const reactionOptions = ["heart", "thumbs_up", "correct", "wrong"];
export default function NoticesPage() {
    const [role, setRole] = useState("loading");
    const [notices, setNotices] = useState([]);
    const [isLoadingNotices, setIsLoadingNotices] = useState(true);
    const [title, setTitle] = useState("");
    const [body, setBody] = useState("");
    const [noticeType, setNoticeType] = useState("notice");
    const [mayyatDetails, setMayyatDetails] = useState(emptyMayyatDetails);
    const [pinned, setPinned] = useState(false);
    const [status, setStatus] = useState("");
    const [editingNoticeId, setEditingNoticeId] = useState(null);
    const [editTitle, setEditTitle] = useState("");
    const [editBody, setEditBody] = useState("");
    const [editNoticeType, setEditNoticeType] = useState("notice");
    const [editPinned, setEditPinned] = useState(false);
    const [editMayyatDetails, setEditMayyatDetails] = useState(emptyMayyatDetails);
    const [createFormLangTab, setCreateFormLangTab] = useState("roman");
    const [mayyatLangMode, setMayyatLangMode] = useState(() => {
        if (typeof window !== "undefined") {
            return localStorage.getItem("mayyat_lang_mode") || "roman";
        }
        return "roman";
    });
    const handleLangModeChange = (mode) => {
        setMayyatLangMode(mode);
        if (typeof window !== "undefined") {
            localStorage.setItem("mayyat_lang_mode", mode);
        }
    };
    const isAdminRole = role === "super_admin" || role === "moderator";
    const roleResolved = role !== "loading";
    const dispatchNoticeActivity = () => {
        if (typeof window !== "undefined") {
            window.dispatchEvent(new Event(NOTICE_ACTIVITY_EVENT));
        }
    };
    const markNoticesReadForCurrentUser = async () => {
        try {
            await API.post("/notices/mark-read");
        }
        catch {
            // Keep the page usable even if the badge refresh cannot be persisted.
        }
        finally {
            dispatchNoticeActivity();
        }
    };
    const loadNotices = async () => {
        setIsLoadingNotices(true);
        try {
            const response = await API.get("/notices/all");
            setNotices(Array.isArray(response.data?.notices) ? response.data.notices : []);
        }
        catch {
            setStatus(t('unable_load_notices'));
            setNotices([]);
        }
        finally {
            setIsLoadingNotices(false);
        }
    };
    useEffect(() => {
        const loadRole = async () => {
            try {
                const response = await API.get("/auth/me");
                if (response.data.success && response.data.user?.role) {
                    const nextRole = normalizeRole(response.data.user.role);
                    setRole(nextRole === "super_admin" || nextRole === "moderator" ? nextRole : "member");
                }
                else {
                    setRole("member");
                }
            }
            catch {
                setRole("member");
            }
        };
        void loadRole();
        void loadNotices();
    }, []);
    useEffect(() => {
        if (!roleResolved)
            return;
        void markNoticesReadForCurrentUser();
    }, [roleResolved]);
    const updateMayyatDetails = (field, value) => {
        setMayyatDetails((current) => {
            const updated = { ...current, [field]: value };
            if (field === "deceasedNameRoman")
                updated.deceasedName = value;
            if (field === "fatherNameRoman")
                updated.fatherName = value;
            if (field === "relationRoman")
                updated.relation = value;
            if (field === "funeralPrayerDayPartRoman")
                updated.funeralPrayerDayPart = value;
            if (field === "funeralPrayerTimeRoman")
                updated.funeralPrayerTime = value;
            if (field === "funeralPrayerPlaceRoman")
                updated.funeralPrayerPlace = value;
            if (field === "notesRoman")
                updated.notes = value;
            return updated;
        });
    };
    const upsertNotice = (updatedNotice) => {
        setNotices((current) => {
            const index = current.findIndex((item) => item.id === updatedNotice.id);
            if (index === -1)
                return [updatedNotice, ...current];
            const cloned = [...current];
            cloned[index] = updatedNotice;
            return cloned;
        });
    };
    const handlePost = async (event) => {
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
                const response = await API.post("/notices/create", payload);
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
            }
            catch {
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
            const response = await API.post("/notices/create", payload);
            if (response.data?.notice) {
                upsertNotice(response.data.notice);
            }
            setTitle("");
            setBody("");
            setNoticeType("notice");
            setPinned(false);
            setStatus(t('publish_notice_success'));
            await markNoticesReadForCurrentUser();
        }
        catch {
            setStatus(t('unable_publish'));
        }
    };
    const handleReact = async (noticeId, reaction) => {
        try {
            const response = await API.patch(`/notices/${noticeId}/react`, { reaction });
            if (response.data?.notice) {
                upsertNotice(response.data.notice);
            }
        }
        catch {
            setStatus(t('unable_react'));
        }
    };
    const handleTogglePin = async (notice) => {
        try {
            const response = await API.patch(`/notices/${notice.id}/pin`, { pinned: !notice.pinned });
            if (response.data?.notice) {
                upsertNotice(response.data.notice);
            }
        }
        catch {
            setStatus(t('unable_update_pin'));
        }
    };
    const handleDelete = async (noticeId) => {
        try {
            await API.delete(`/notices/${noticeId}`);
            setNotices((current) => current.filter((item) => item.id !== noticeId));
            setStatus(t('notice_deleted'));
            dispatchNoticeActivity();
        }
        catch {
            setStatus(t('unable_delete'));
        }
    };
    const updateEditMayyatDetails = (field, value) => {
        setEditMayyatDetails((current) => {
            const updated = { ...current, [field]: value };
            if (field === "deceasedNameRoman")
                updated.deceasedName = value;
            if (field === "fatherNameRoman")
                updated.fatherName = value;
            if (field === "relationRoman")
                updated.relation = value;
            if (field === "funeralPrayerDayPartRoman")
                updated.funeralPrayerDayPart = value;
            if (field === "funeralPrayerTimeRoman")
                updated.funeralPrayerTime = value;
            if (field === "funeralPrayerPlaceRoman")
                updated.funeralPrayerPlace = value;
            if (field === "notesRoman")
                updated.notes = value;
            return updated;
        });
    };
    const startEdit = (notice) => {
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
    const saveEdit = async (noticeId) => {
        if (editNoticeType === "mayyat") {
            const targetNotice = notices.find((n) => n.id === noticeId);
            const existingDetails = sanitizeMayyatDetails(targetNotice?.mayyatDetails || editMayyatDetails);
            const isUrduEdit = mayyatLangMode === "urdu";
            let mergedDetails;
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
            }
            else {
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
            }
            catch {
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
        }
        catch {
            setStatus(t('unable_update'));
        }
    };
    const handleShare = async (notice) => {
        try {
            const response = await API.post(`/notices/${notice.id}/share`);
            if (response.data?.notice) {
                upsertNotice(response.data.notice);
            }
            const text = `${notice.type === "mayyat" ? "Mayyat Notification: " : ""}${notice.title}\n${notice.body}`;
            if (navigator.share) {
                try {
                    await navigator.share({
                        title: notice.title,
                        text,
                        url: window.location.href,
                    });
                }
                catch {
                    // Ignore cancelled share action.
                }
                return;
            }
            if (navigator.clipboard) {
                await navigator.clipboard.writeText(text);
                setStatus(t('notice_copied'));
            }
        }
        catch {
            setStatus(t('unable_share'));
        }
    };
    const noticeList = useMemo(() => notices, [notices]);
    return (_jsxs("div", { className: "mx-auto flex w-full max-w-4xl flex-col gap-6", children: [_jsxs("div", { className: "overflow-hidden rounded-[1.5rem] border border-emerald-200 bg-gradient-to-br from-emerald-950 via-emerald-900 to-green-700 p-6 text-white shadow-[0_24px_60px_-30px_rgba(5,150,105,0.55)]", children: [_jsx("p", { className: "text-sm font-semibold uppercase tracking-[0.3em] text-emerald-100", children: t('notices_channel_title') }), _jsx("h1", { className: "mt-2 text-2xl font-black", children: t('notices_heading') }), _jsx("p", { className: "mt-2 max-w-2xl text-sm leading-7 text-emerald-50", children: !roleResolved
                            ? t('checking_access')
                            : isAdminRole
                                ? t('admin_publish_notice')
                                : t('member_mode_msg') }), _jsx("div", { className: "mt-4 inline-flex rounded-full bg-white/15 px-3 py-2 text-sm font-semibold text-emerald-50", children: role === "loading" ? t('checking_access_short') : role === "moderator" ? t('moderator_access') : role === "super_admin" ? t('admin_access') : t('member_access') })] }), !roleResolved ? (_jsx("div", { className: "page-card p-4 text-sm text-slate-600", children: t('checking_access_short') })) : isAdminRole ? (_jsxs("div", { className: "page-card p-6", children: [_jsxs("div", { className: "flex items-center justify-between gap-3", children: [_jsxs("div", { children: [_jsx("h2", { className: "page-title text-xl", children: t('post_notice_title') }), _jsx("p", { className: "page-subtitle text-sm", children: t('post_notice_subtitle') })] }), _jsx("span", { className: "rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-700", children: t('admin_only') })] }), _jsxs("form", { onSubmit: handlePost, className: "mt-4 space-y-3", children: [_jsxs("div", { className: "grid gap-2 sm:grid-cols-2", children: [_jsx("button", { type: "button", onClick: () => setNoticeType("notice"), className: `rounded-lg border px-4 py-3 text-left text-sm font-semibold transition ${noticeType === "notice"
                                            ? "border-blue-600 bg-blue-50 text-blue-800"
                                            : "border-slate-200 bg-white text-slate-600 hover:border-blue-200"}`, children: t('regular_notice') }), _jsx("button", { type: "button", onClick: () => setNoticeType("mayyat"), className: `rounded-lg border px-4 py-3 text-left text-sm font-semibold transition ${noticeType === "mayyat"
                                            ? "border-slate-800 bg-slate-900 text-white"
                                            : "border-slate-200 bg-white text-slate-600 hover:border-slate-400"}`, children: t('mayyat_notification') })] }), noticeType === "mayyat" ? (_jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "flex items-center justify-between gap-2 border-b border-slate-200 pb-2", children: [_jsx("span", { className: "text-xs font-bold uppercase tracking-wider text-slate-600", children: "Mayyat Details / \u062A\u0641\u0635\u06CC\u0644\u0627\u062A:" }), _jsxs("div", { className: "flex items-center gap-1 rounded-md bg-slate-100 p-1 border border-slate-200", children: [_jsx("button", { type: "button", onClick: () => setCreateFormLangTab("roman"), className: `rounded-md px-3 py-1 text-xs font-semibold transition ${createFormLangTab === "roman"
                                                            ? "bg-slate-900 text-white shadow-sm"
                                                            : "text-slate-600 hover:text-slate-900"}`, children: "Roman Urdu Fields" }), _jsx("button", { type: "button", onClick: () => setCreateFormLangTab("urdu"), className: `rounded-md px-3 py-1 text-xs font-semibold transition ${createFormLangTab === "urdu"
                                                            ? "bg-emerald-700 text-white shadow-sm font-serif"
                                                            : "text-slate-600 hover:text-slate-900"}`, children: "\u0627\u0631\u062F\u0648 \u0641\u06CC\u0644\u0688\u0632" })] })] }), createFormLangTab === "roman" ? (_jsxs("div", { className: "grid gap-3 sm:grid-cols-2", children: [_jsx("input", { value: mayyatDetails.deceasedNameRoman ?? mayyatDetails.deceasedName ?? "", onChange: (event) => updateMayyatDetails("deceasedNameRoman", event.target.value), placeholder: "Marhoom Ka Naam *", className: "form-input px-4 py-3" }), _jsx("input", { value: mayyatDetails.fatherNameRoman ?? mayyatDetails.fatherName ?? "", onChange: (event) => updateMayyatDetails("fatherNameRoman", event.target.value), placeholder: "Walid Ka Naam", className: "form-input px-4 py-3" }), _jsx("input", { value: mayyatDetails.relationRoman ?? mayyatDetails.relation ?? "", onChange: (event) => updateMayyatDetails("relationRoman", event.target.value), placeholder: "Rishta (e.g. walad / beta / beti / shohar)", className: "form-input px-4 py-3" }), _jsx("input", { value: mayyatDetails.funeralPrayerDayPartRoman ?? mayyatDetails.funeralPrayerDayPart ?? "", onChange: (event) => updateMayyatDetails("funeralPrayerDayPartRoman", event.target.value), placeholder: "Subah / Raat / Din Part (e.g. Subah / Raat)", className: "form-input px-4 py-3" }), _jsx("input", { value: mayyatDetails.funeralPrayerTimeRoman ?? mayyatDetails.funeralPrayerTime ?? "", onChange: (event) => updateMayyatDetails("funeralPrayerTimeRoman", event.target.value), placeholder: "Waqt (e.g. 10:00 / 5:00)", className: "form-input px-4 py-3" }), _jsx("input", { value: mayyatDetails.funeralPrayerPlaceRoman ?? mayyatDetails.funeralPrayerPlace ?? "", onChange: (event) => updateMayyatDetails("funeralPrayerPlaceRoman", event.target.value), placeholder: "Namaz-e-Janaza Ka Muqam (Masjid + Address) *", className: "form-input px-4 py-3" }), _jsx("input", { value: mayyatDetails.notesRoman ?? mayyatDetails.notes ?? "", onChange: (event) => updateMayyatDetails("notesRoman", event.target.value), placeholder: "Extra Notes / Dua Request (Optional)", className: "form-input px-4 py-3 sm:col-span-2" })] })) : (_jsxs("div", { className: "grid gap-3 sm:grid-cols-2 text-right", dir: "rtl", children: [_jsx("input", { value: mayyatDetails.deceasedNameUrdu || "", onChange: (event) => updateMayyatDetails("deceasedNameUrdu", event.target.value), placeholder: "\u0645\u0631\u062D\u0648\u0645 \u06A9\u0627 \u0646\u0627\u0645 *", className: "form-input px-4 py-3 font-serif" }), _jsx("input", { value: mayyatDetails.fatherNameUrdu || "", onChange: (event) => updateMayyatDetails("fatherNameUrdu", event.target.value), placeholder: "\u0648\u0627\u0644\u062F \u06A9\u0627 \u0646\u0627\u0645", className: "form-input px-4 py-3 font-serif" }), _jsx("input", { value: mayyatDetails.relationUrdu || "", onChange: (event) => updateMayyatDetails("relationUrdu", event.target.value), placeholder: "\u0631\u0634\u062A\u06C1 (\u0645\u062B\u0644\u0627\u064B \u0648\u0644\u062F / \u0628\u06CC\u0679\u0627 / \u0634\u0648\u06C1\u0631)", className: "form-input px-4 py-3 font-serif" }), _jsx("input", { value: mayyatDetails.funeralPrayerDayPartUrdu || "", onChange: (event) => updateMayyatDetails("funeralPrayerDayPartUrdu", event.target.value), placeholder: "\u0635\u0628\u062D / \u0631\u0627\u062A / \u0638\u06C1\u0631 (\u0645\u062B\u0644\u0627\u064B \u0635\u0628\u062D / \u0631\u0627\u062A)", className: "form-input px-4 py-3 font-serif" }), _jsx("input", { value: mayyatDetails.funeralPrayerTimeUrdu || "", onChange: (event) => updateMayyatDetails("funeralPrayerTimeUrdu", event.target.value), placeholder: "\u0648\u0642\u062A (\u0645\u062B\u0644\u0627\u064B 10:00 / 5:00)", className: "form-input px-4 py-3 font-serif" }), _jsx("input", { value: mayyatDetails.funeralPrayerPlaceUrdu || "", onChange: (event) => updateMayyatDetails("funeralPrayerPlaceUrdu", event.target.value), placeholder: "\u0646\u0645\u0627\u0632\u0650 \u062C\u0646\u0627\u0632\u06C1 \u06A9\u0627 \u0645\u0642\u0627\u0645 (\u0645\u0633\u062C\u062F + \u0627\u06CC\u0688\u0631\u06CC\u0633) *", className: "form-input px-4 py-3 font-serif" }), _jsx("input", { value: mayyatDetails.notesUrdu || "", onChange: (event) => updateMayyatDetails("notesUrdu", event.target.value), placeholder: "\u0627\u0636\u0627\u0641\u06CC \u0646\u0648\u0679 / \u062F\u0639\u0627 \u06A9\u06CC \u0627\u0644\u062A\u062C\u0627", className: "form-input px-4 py-3 sm:col-span-2 font-serif" })] }))] })) : (_jsxs(_Fragment, { children: [_jsx("input", { value: title, onChange: (event) => setTitle(event.target.value), placeholder: t('placeholder_notice_title'), className: "form-input px-4 py-3" }), _jsx("textarea", { value: body, onChange: (event) => setBody(event.target.value), rows: 4, placeholder: t('placeholder_notice_body'), className: "form-input px-4 py-3" })] })), _jsxs("label", { className: "flex items-center gap-2 text-sm text-gray-600", children: [_jsx("input", { type: "checkbox", checked: pinned, onChange: () => setPinned((current) => !current) }), t('pin_this_notice')] }), _jsx("button", { type: "submit", className: "btn-primary rounded-lg px-4 py-2 font-semibold transition", children: noticeType === "mayyat" ? t('publish_mayyat_action') : t('publish_notice_action') })] }), status ? _jsx("p", { className: "mt-3 text-sm text-emerald-600", children: status }) : null] })) : (_jsx("div", { className: "page-card p-4 text-sm text-slate-600", children: "You are viewing in member mode. You can read updates, react to them, and share them with others." })), _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "inline-block h-2.5 w-2.5 rounded-full bg-slate-900" }), _jsx("h3", { className: "text-sm font-bold text-slate-800 uppercase tracking-wider", children: "Mayyat Notice Language / \u0645\u06CC\u0651\u062A \u0646\u0648\u0679\u0633\u0632 \u06A9\u06CC \u0632\u0628\u0627\u0646:" })] }), _jsxs("div", { className: "flex items-center gap-1.5 rounded-lg bg-slate-100 p-1 border border-slate-200", children: [_jsx("button", { type: "button", onClick: () => handleLangModeChange("roman"), className: `rounded-md px-3.5 py-1.5 text-xs sm:text-sm font-semibold transition ${mayyatLangMode === "roman"
                                            ? "bg-slate-900 text-white shadow-sm"
                                            : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"}`, children: "Roman Urdu" }), _jsx("button", { type: "button", onClick: () => handleLangModeChange("urdu"), className: `rounded-md px-3.5 py-1.5 text-xs sm:text-sm font-semibold transition ${mayyatLangMode === "urdu"
                                            ? "bg-emerald-700 text-white shadow-sm font-serif"
                                            : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"}`, children: "\u0627\u0631\u062F\u0648" })] })] }), isLoadingNotices ? (_jsx("div", { className: "page-card p-4 text-sm text-slate-600", children: t('loading_notices') })) : noticeList.length === 0 ? (_jsx("div", { className: "page-card p-4 text-sm text-slate-600", children: t('no_notices') })) : null, noticeList.map((notice) => {
                        const isMayyat = notice.type === "mayyat";
                        const selectedReaction = notice.userReaction;
                        const hasShared = Boolean(notice.hasShared);
                        const reactionCounts = getNormalizedReactionCounts(notice);
                        const visibleReactionCounts = reactionOptions.filter((reaction) => reactionCounts[reaction] > 0);
                        return (_jsxs("article", { className: `page-card p-5 ${isMayyat ? "border-2 border-slate-800 bg-slate-50 shadow-[0_12px_35px_rgba(15,23,42,0.12)]" : ""}`, children: [_jsxs("div", { className: "flex flex-wrap items-start justify-between gap-3", children: [_jsxs("div", { children: [_jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [isMayyat ? (_jsx("span", { className: "rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-white", children: mayyatLangMode === "urdu" ? "اطلاعِ میّت" : t('mayyat_label') })) : (_jsx("h3", { className: "text-lg font-semibold text-slate-800", children: notice.title })), notice.pinned ? _jsx("span", { className: "rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700", children: t('pinned_label') }) : null] }), _jsx("div", { className: `mt-2 space-y-2 text-sm leading-6 ${isMayyat ? "font-medium text-slate-900" : "text-slate-700"}`, children: renderFormattedText(isMayyat && notice.mayyatDetails ? buildMayyatBody(notice.mayyatDetails, mayyatLangMode) : notice.body, isMayyat ? mayyatLangMode : undefined) })] }), _jsxs("div", { className: "text-sm text-slate-500", children: [_jsx("p", { children: notice.author }), _jsx("p", { children: new Date(notice.createdAt).toLocaleString() })] })] }), _jsxs("div", { className: "mt-5 flex flex-wrap items-center gap-2 border-t border-slate-200 pt-3", children: [!isMayyat ? (_jsxs(_Fragment, { children: [reactionOptions.map((reaction) => (_jsxs("button", { type: "button", onClick: () => handleReact(notice.id, reaction), className: `inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition ${selectedReaction === reaction
                                                        ? "border-blue-600 bg-blue-50 text-blue-700"
                                                        : "border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50"}`, children: [_jsx("span", { className: "text-base leading-none", children: getReactionEmoji(reaction) }), _jsx("span", { children: getReactionLabel(t, reaction) })] }, reaction))), visibleReactionCounts.length > 0 ? (_jsx("div", { className: "flex flex-wrap items-center gap-2 px-1 text-sm font-medium text-slate-600", children: visibleReactionCounts.map((reaction) => (_jsxs("span", { className: "inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700", children: [_jsx("span", { children: getReactionEmoji(reaction) }), _jsx("span", { children: reactionCounts[reaction] })] }, reaction))) })) : null] })) : null, _jsxs("button", { type: "button", onClick: () => handleShare(notice), className: `inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition ${hasShared ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"}`, children: [_jsx("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-4 w-4", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.8", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M7 11v7a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-7M12 4v10m0-10 4 4m-4-4-4 4" }) }), hasShared ? t('shared_label') : t('share_label'), " - ", notice.shares] }), roleResolved && isAdminRole ? (_jsxs(_Fragment, { children: [_jsxs("button", { type: "button", onClick: () => handleTogglePin(notice), className: "inline-flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700 transition hover:bg-amber-100", children: [_jsx("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-4 w-4", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.8", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "m15 4 5 5-3 1-4 4v4l-2 2-2-6-6-2 2-2h4l4-4 1-3Z" }) }), notice.pinned ? t('unpin_label') : t('pin_label')] }), _jsxs("button", { type: "button", onClick: () => startEdit(notice), className: "inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100", children: [_jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-4 w-4", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.8", children: [_jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M4 20h4l10.5-10.5a2.1 2.1 0 0 0-3-3L5 17v3Z" }), _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "m14 7 3 3" })] }), t('edit_label')] }), _jsxs("button", { type: "button", onClick: () => handleDelete(notice.id), className: "inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100", children: [_jsx("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-4 w-4", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.8", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V5h6v2" }) }), t('delete_label')] })] })) : null] }), roleResolved && isAdminRole && editingNoticeId === notice.id ? (_jsxs("div", { className: "mt-4 space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4", children: [notice.type === "mayyat" ? (mayyatLangMode === "roman" ? (_jsxs("div", { className: "space-y-2", children: [_jsx("p", { className: "text-xs font-bold uppercase tracking-wider text-slate-500", children: "Editing Mayyat Notification (Roman Urdu)" }), _jsxs("div", { className: "grid gap-3 sm:grid-cols-2", children: [_jsx("input", { value: editMayyatDetails.deceasedNameRoman ?? editMayyatDetails.deceasedName ?? "", onChange: (event) => updateEditMayyatDetails("deceasedNameRoman", event.target.value), placeholder: "Marhoom Ka Naam *", className: "form-input px-3 py-2" }), _jsx("input", { value: editMayyatDetails.fatherNameRoman ?? editMayyatDetails.fatherName ?? "", onChange: (event) => updateEditMayyatDetails("fatherNameRoman", event.target.value), placeholder: "Walid Ka Naam", className: "form-input px-3 py-2" }), _jsx("input", { value: editMayyatDetails.relationRoman ?? editMayyatDetails.relation ?? "", onChange: (event) => updateEditMayyatDetails("relationRoman", event.target.value), placeholder: "Rishta (e.g. walad / beta / beti / shohar)", className: "form-input px-3 py-2" }), _jsx("input", { value: editMayyatDetails.funeralPrayerDayPartRoman ?? editMayyatDetails.funeralPrayerDayPart ?? "", onChange: (event) => updateEditMayyatDetails("funeralPrayerDayPartRoman", event.target.value), placeholder: "Subah / Raat / Din Part (e.g. Subah / Raat)", className: "form-input px-3 py-2" }), _jsx("input", { value: editMayyatDetails.funeralPrayerTimeRoman ?? editMayyatDetails.funeralPrayerTime ?? "", onChange: (event) => updateEditMayyatDetails("funeralPrayerTimeRoman", event.target.value), placeholder: "Waqt (e.g. 10:00 / 5:00)", className: "form-input px-3 py-2" }), _jsx("input", { value: editMayyatDetails.funeralPrayerPlaceRoman ?? editMayyatDetails.funeralPrayerPlace ?? "", onChange: (event) => updateEditMayyatDetails("funeralPrayerPlaceRoman", event.target.value), placeholder: "Namaz-e-Janaza Ka Muqam (Masjid + Address) *", className: "form-input px-3 py-2" }), _jsx("input", { value: editMayyatDetails.notesRoman ?? editMayyatDetails.notes ?? "", onChange: (event) => updateEditMayyatDetails("notesRoman", event.target.value), placeholder: "Extra Notes / Dua Request (Optional)", className: "form-input px-3 py-2 sm:col-span-2" })] })] })) : (_jsxs("div", { className: "space-y-2", children: [_jsx("p", { className: "text-xs font-bold font-serif text-emerald-800 text-right", dir: "rtl", children: "\u0645\u06CC\u0651\u062A \u0646\u0648\u0679\u0633 \u0645\u06CC\u06BA \u062A\u0631\u0645\u06CC\u0645 (\u0627\u0631\u062F\u0648)" }), _jsxs("div", { className: "grid gap-3 sm:grid-cols-2 text-right", dir: "rtl", children: [_jsx("input", { value: editMayyatDetails.deceasedNameUrdu || "", onChange: (event) => updateEditMayyatDetails("deceasedNameUrdu", event.target.value), placeholder: "\u0645\u0631\u062D\u0648\u0645 \u06A9\u0627 \u0646\u0627\u0645 *", className: "form-input px-3 py-2 font-serif" }), _jsx("input", { value: editMayyatDetails.fatherNameUrdu || "", onChange: (event) => updateEditMayyatDetails("fatherNameUrdu", event.target.value), placeholder: "\u0648\u0627\u0644\u062F \u06A9\u0627 \u0646\u0627\u0645", className: "form-input px-3 py-2 font-serif" }), _jsx("input", { value: editMayyatDetails.relationUrdu || "", onChange: (event) => updateEditMayyatDetails("relationUrdu", event.target.value), placeholder: "\u0631\u0634\u062A\u06C1 (\u0645\u062B\u0644\u0627\u064B \u0648\u0644\u062F / \u0628\u06CC\u0679\u0627 / \u0634\u0648\u06C1\u0631)", className: "form-input px-3 py-2 font-serif" }), _jsx("input", { value: editMayyatDetails.funeralPrayerDayPartUrdu || "", onChange: (event) => updateEditMayyatDetails("funeralPrayerDayPartUrdu", event.target.value), placeholder: "\u0635\u0628\u062D / \u0631\u0627\u062A / \u0638\u06C1\u0631 (\u0645\u062B\u0644\u0627\u064B \u0635\u0628\u062D / \u0631\u0627\u062A)", className: "form-input px-3 py-2 font-serif" }), _jsx("input", { value: editMayyatDetails.funeralPrayerTimeUrdu || "", onChange: (event) => updateEditMayyatDetails("funeralPrayerTimeUrdu", event.target.value), placeholder: "\u0648\u0642\u062A (\u0645\u062B\u0644\u0627\u064B 10:00 / 5:00)", className: "form-input px-3 py-2 font-serif" }), _jsx("input", { value: editMayyatDetails.funeralPrayerPlaceUrdu || "", onChange: (event) => updateEditMayyatDetails("funeralPrayerPlaceUrdu", event.target.value), placeholder: "\u0646\u0645\u0627\u0632\u0650 \u062C\u0646\u0627\u0632\u06C1 \u06A9\u0627 \u0645\u0642\u0627\u0645 (\u0645\u0633\u062C\u062F + \u0627\u06CC\u0688\u0631\u06CC\u0633) *", className: "form-input px-3 py-2 font-serif" }), _jsx("input", { value: editMayyatDetails.notesUrdu || "", onChange: (event) => updateEditMayyatDetails("notesUrdu", event.target.value), placeholder: "\u0627\u0636\u0627\u0641\u06CC \u0646\u0648\u0679 / \u062F\u0639\u0627 \u06A9\u06CC \u0627\u0644\u062A\u062C\u0627", className: "form-input px-3 py-2 sm:col-span-2 font-serif" })] })] }))) : (_jsxs(_Fragment, { children: [_jsx("input", { value: editTitle, onChange: (event) => setEditTitle(event.target.value), className: "form-input px-3 py-2", placeholder: t('placeholder_notice_title') }), _jsx("textarea", { value: editBody, onChange: (event) => setEditBody(event.target.value), rows: 3, className: "form-input px-3 py-2", placeholder: t('placeholder_notice_body') })] })), _jsxs("label", { className: "flex items-center gap-2 text-sm text-gray-600", children: [_jsx("input", { type: "checkbox", checked: editPinned, onChange: () => setEditPinned((current) => !current) }), t('pin_this_notice')] }), _jsxs("div", { className: "flex flex-wrap gap-2", children: [_jsx("button", { type: "button", onClick: () => saveEdit(notice.id), className: "btn-primary rounded-lg px-3 py-2 text-sm font-semibold", children: t('save_label') }), _jsx("button", { type: "button", onClick: cancelEdit, className: "btn-secondary rounded-lg px-3 py-2 text-sm font-semibold", children: t('cancel_label') })] })] })) : null] }, notice.id));
                    })] })] }));
}
