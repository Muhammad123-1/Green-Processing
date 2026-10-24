"use client";
import { useState, useEffect } from "react";
import {
  Plus,
  Link2,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Copy,
  Check,
  Calendar,
  Users,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Archive,
  Printer,
  FileSpreadsheet,
  BarChart2,
  Download,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  MessageSquare,
} from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/components/providers/LanguageProvider";
import SurveyReportModal from "@/components/surveys/SurveyReportModal";
import QuestionDrillDownModal from "@/components/surveys/QuestionDrillDownModal";

export default function SurveysPage() {
  const { formatDual } = useLanguage();
  const [surveys, setSurveys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [selectedSurveyId, setSelectedSurveyId] = useState<number | null>(null);
  const [isReportOpen, setIsReportOpen] = useState(false);

  const [form, setForm] = useState({
    title: "OOO \"GREEN PROCESSING\" mijozlar qoniqish anketasi",
    description: "Iltimos, anketani to'ldiring, sizning fikringiz biz uchun juda muhim. Ushbu anketa ishlab chiqarilayotgan mahsulotlar sifatini va siz bilan hamkorlikni yaxshilash uchun ishlatiladi.",
    expiresAt: "",
    addDefault: true,
  });
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    fetchSurveys();
  }, []);

  const fetchSurveys = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/surveys");
      const data = await res.json();
      if (Array.isArray(data)) setSurveys(data);
    } catch {
      toast.error("Xatolik");
    } finally {
      setLoading(false);
    }
  };

  const createSurvey = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch("/api/surveys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.id) {
        toast.success("So'rovnoma yaratildi!");
        window.location.href = `/surveys/${data.id}/edit`;
      } else toast.error(data.error || "Xatolik");
    } catch {
      toast.error("Tarmoq xatosi");
    } finally {
      setCreating(false);
    }
  };

  const toggleActive = async (survey: any) => {
    try {
      await fetch(`/api/surveys/${survey.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !survey.isActive }),
      });
      toast.success(survey.isActive ? "Link o'chirildi" : "Link yoqildi");
      fetchSurveys();
    } catch {
      toast.error("Xatolik");
    }
  };

  const deleteSurvey = async (id: number) => {
    if (!confirm("Haqiqatan ham o'chirmoqchimisiz?")) return;
    try {
      await fetch(`/api/surveys/${id}`, { method: "DELETE" });
      toast.success("O'chirildi");
      fetchSurveys();
    } catch {
      toast.error("Xatolik");
    }
  };

  const copyLink = (token: string, id: number) => {
    const url = `${typeof window !== "undefined" ? window.location.origin : ""}/survey/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    toast.success(formatDual("Nusxalandi!", "Скопировано!", "Copied!"));
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getStatus = (s: any) => {
    if (!s.isActive)
      return { label: "O'chirilgan", color: "bg-slate-100 text-slate-600" };
    if (s.expiresAt && new Date(s.expiresAt) < new Date())
      return { label: "Muddati tugagan", color: "bg-red-100 text-red-600" };
    return { label: "Faol", color: "bg-green-100 text-green-700" };
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-dark-950 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              {formatDual("So'rovnomalar", "Опросы", "Surveys")}
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              {formatDual(
                "Mijozlar qoniqish darajasini boshqarish",
                "Управление удовлетворенностью клиентов",
                "Customer satisfaction management",
              )}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={fetchSurveys}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-dark-700 hover:bg-slate-100 dark:hover:bg-dark-800 transition-colors"
            >
              <RefreshCw
                size={16}
                className="text-slate-600 dark:text-slate-400"
              />
            </button>
            <a
              href="/surveys/archive"
              className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-700 hover:bg-slate-50 dark:hover:bg-dark-750 text-slate-700 dark:text-slate-300 rounded-xl font-medium text-sm transition-colors"
            >
              <Archive size={16} className="text-blue-500" />
              {formatDual("Arxiv", "Архив", "Archive")}
            </a>
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium text-sm transition-all shadow-sm shadow-green-600/20"
            >
              <Plus size={16} />
              {formatDual(
                "Yangi so'rovnoma yaratish",
                "Создать новый опрос",
                "Create new survey",
              )}
            </button>
          </div>
        </div>

        {/* Create Modal */}
        {showCreate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-dark-900 rounded-3xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 dark:border-dark-750">
              <div className="p-6 border-b border-slate-100 dark:border-dark-800">
                <h2 className="text-lg font-bold text-slate-800 dark:text-white">
                  {formatDual(
                    "Yangi so'rovnoma yaratish",
                    "Создать новый опрос",
                    "Create new survey",
                  )}
                </h2>
              </div>
              <form onSubmit={createSurvey} className="p-6 space-y-5">
                <div>
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2">
                    {formatDual(
                      "So'rovnoma nomi",
                      "Название опроса",
                      "Survey title",
                    )}
                  </label>
                  <input
                    type="text"
                    required
                    value={form.title}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, title: e.target.value }))
                    }
                    className="w-full border border-slate-200 dark:border-dark-600 rounded-xl px-4 py-2.5 text-sm bg-white dark:bg-dark-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-400"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2">
                    {formatDual(
                      "Tavsif (ixtiyoriy)",
                      "Описание (необязательно)",
                      "Description (optional)",
                    )}
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, description: e.target.value }))
                    }
                    className="w-full border border-slate-200 dark:border-dark-600 rounded-xl px-4 py-2.5 text-sm bg-white dark:bg-dark-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-400 resize-none"
                    rows={2}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2">
                    {formatDual(
                      "Muddati (ixtiyoriy)",
                      "Срок (необязательно)",
                      "Deadline (optional)",
                    )}
                  </label>
                  <input
                    type="date"
                    value={form.expiresAt}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, expiresAt: e.target.value }))
                    }
                    className="border border-slate-200 dark:border-dark-600 rounded-xl px-4 py-2 text-sm bg-white dark:bg-dark-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-400"
                  />
                  <p className="text-xs text-slate-400 mt-1">
                    {formatDual(
                      "Bo'sh qoldirsangiz — muddat cheklanmaydi",
                      "Оставьте пустым — срок не ограничен",
                      "Leave empty — no deadline",
                    )}
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="addDef"
                    checked={form.addDefault}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, addDefault: e.target.checked }))
                    }
                    className="rounded border-slate-300 text-green-600 focus:ring-green-500"
                  />
                  <label
                    htmlFor="addDef"
                    className="text-sm text-slate-700 dark:text-slate-300"
                  >
                    {formatDual(
                      "Standart GREEN PROCESSING savollarini qo'shish (11 ta savol)",
                      "Добавить стандартные вопросы GREEN PROCESSING (11 вопросов)",
                      "Add standard GREEN PROCESSING questions (11 questions)",
                    )}
                  </label>
                </div>

                <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-dark-800">
                  <button
                    type="submit"
                    disabled={creating}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 rounded-xl transition-colors disabled:opacity-50"
                  >
                    {creating
                      ? "..."
                      : formatDual("Yaratish", "Создать", "Create")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreate(false)}
                    className="px-6 border border-slate-200 dark:border-dark-700 hover:bg-slate-50 dark:hover:bg-dark-800 text-slate-600 dark:text-slate-400 font-medium py-2.5 rounded-xl transition-colors"
                  >
                    {formatDual("Bekor", "Отмена", "Cancel")}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* List */}
        {loading ? (
          <div className="text-center py-12 text-slate-400">Yuklanmoqda...</div>
        ) : surveys.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-dark-900 rounded-2xl border border-slate-200 dark:border-dark-750 border-dashed">
            <div className="w-16 h-16 bg-slate-100 dark:bg-dark-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
              <Plus size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">
              {formatDual(
                "Hali so'rovnoma yo'q",
                "Пока нет опросов",
                "No surveys yet",
              )}
            </h3>
            <p className="text-slate-500">
              {formatDual(
                "Yuqoridagi tugmani bosib yangi so'rovnoma yarating",
                "Нажмите кнопку выше, чтобы создать новый опрос",
                "Click the button above to create a new survey",
              )}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {surveys.map((s) => {
              const status = getStatus(s);
              const isExpanded = expandedId === s.id;
              const link = `${typeof window !== "undefined" ? window.location.origin : ""}/survey/${s.token}`;
              return (
                <div
                  key={s.id}
                  className="bg-white dark:bg-dark-900 rounded-2xl border border-slate-200 dark:border-dark-750 shadow-sm overflow-hidden"
                >
                  <div className="p-5">
                    <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                            {s.title}
                          </h3>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${status.color}`}
                          >
                            {status.label}
                          </span>
                        </div>
                        {s.description && (
                          <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                            {s.description}
                          </p>
                        )}
                        <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-slate-400">
                          <span className="flex items-center gap-1">
                            <Users size={11} /> {s.responses.length}{" "}
                            {formatDual("ta javob", "ответов", "answers")}
                          </span>
                          <span className="flex items-center gap-1">
                            <Link2 size={11} /> {s.questions.length}{" "}
                            {formatDual("savol", "вопросов", "questions")}
                          </span>
                          {s.expiresAt && (
                            <span className="flex items-center gap-1">
                              <Calendar size={11} />{" "}
                              {new Date(s.expiresAt).toLocaleDateString(
                                "uz-UZ",
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => toggleActive(s)}
                          title={s.isActive ? "O'chirish" : "Yoqish"}
                          className={`p-2 rounded-xl transition-colors ${s.isActive ? "text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20" : "text-slate-400 hover:bg-slate-100 dark:hover:bg-dark-800"}`}
                        >
                          {s.isActive ? (
                            <ToggleRight size={20} />
                          ) : (
                            <ToggleLeft size={20} />
                          )}
                        </button>
                        <a
                          href={`/surveys/${s.id}/edit`}
                          title="Savollarni tahrirlash"
                          className="p-2 rounded-xl hover:bg-amber-50 dark:hover:bg-amber-900/20 text-amber-500 hover:text-amber-600 transition-colors flex items-center justify-center"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                          </svg>
                        </a>
                        <button
                          onClick={() => {
                            setSelectedSurveyId(s.id);
                            setIsReportOpen(true);
                          }}
                          title={formatDual(
                            "Statistika va Chop etish",
                            "Статистика и печать",
                            "Statistics & print",
                          )}
                          className="p-2 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 transition-colors flex items-center justify-center"
                        >
                          <Printer size={16} />
                        </button>
                        <a
                          href={`/api/surveys/${s.id}/export`}
                          download
                          title={formatDual(
                            "Excel (.xlsx) formatida yuklab olish",
                            "Скачать в формате Excel (.xlsx)",
                            "Download in Excel (.xlsx)",
                          )}
                          className="p-2 rounded-xl hover:bg-green-50 dark:hover:bg-green-900/20 text-green-700 dark:text-green-400 transition-colors flex items-center justify-center"
                        >
                          <FileSpreadsheet size={16} />
                        </a>
                        <button
                          onClick={() => copyLink(s.token, s.id)}
                          title="Linkni nusxalash"
                          className="p-2 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 transition-colors"
                        >
                          {copiedId === s.id ? (
                            <Check size={16} />
                          ) : (
                            <Copy size={16} />
                          )}
                        </button>
                        <button
                          onClick={() =>
                            setExpandedId(isExpanded ? null : s.id)
                          }
                          className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-dark-800 text-slate-600 dark:text-slate-400 transition-colors"
                        >
                          {isExpanded ? (
                            <ChevronUp size={16} />
                          ) : (
                            <ChevronDown size={16} />
                          )}
                        </button>
                        <button
                          onClick={() => deleteSurvey(s.id)}
                          title="O'chirish"
                          className="p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-red-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-2 bg-slate-50 dark:bg-dark-800 rounded-xl px-3 py-2">
                      <Link2
                        size={12}
                        className="text-slate-400 flex-shrink-0"
                      />
                      <code className="text-xs text-slate-600 dark:text-slate-300 truncate flex-1">
                        {link}
                      </code>
                      <button
                        onClick={() => copyLink(s.token, s.id)}
                        className="text-xs text-blue-600 hover:underline flex-shrink-0"
                      >
                        {copiedId === s.id
                          ? formatDual("Nusxalandi!", "Скопировано!", "Copied!")
                          : formatDual("Nusxala", "Копировать", "Copy")}
                      </button>
                    </div>
                  </div>
                  {isExpanded && (
                    <ResponseViewer
                      surveyId={s.id}
                      onOpenReport={() => {
                        setSelectedSurveyId(s.id);
                        setIsReportOpen(true);
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}

        <SurveyReportModal
          surveyId={selectedSurveyId}
          isOpen={isReportOpen}
          onClose={() => {
            setIsReportOpen(false);
            setSelectedSurveyId(null);
          }}
        />
      </div>
    </div>
  );
}

function ResponseViewer({
  surveyId,
  onOpenReport,
}: {
  surveyId: number;
  onOpenReport?: () => void;
}) {
  const { formatDual } = useLanguage();
  const [data, setData] = useState<any>(null);
  const [viewTab, setViewTab] = useState<'questions' | 'clients'>('questions');
  const [selectedQuestion, setSelectedQuestion] = useState<any | null>(null);
  const [isDrillDownOpen, setIsDrillDownOpen] = useState(false);

  useEffect(() => {
    fetch(`/api/surveys/${surveyId}`)
      .then((r) => r.json())
      .then(setData);
  }, [surveyId]);

  if (!data) return null;

  const questions: any[] = data.questions || [];
  const responses: any[] = data.responses || [];

  // Pre-calculate per-question stats
  const questionSummaries = questions.map((q) => {
    let posCount = 0;
    let negCount = 0;
    let otherCount = 0;
    let totalCount = 0;
    const isOpinion = q.questionType === 'text' || q.questionType === 'select';

    responses.forEach((resp) => {
      const ans = (resp.answers || []).find((a: any) => a.questionId === q.id);
      if (!ans || !ans.answerValue) return;
      const raw = (ans.answerValue || '').trim();
      let clean = raw;
      if (raw.includes('. Izoh:')) clean = raw.split('. Izoh:')[0].trim();
      else if (raw.includes('Izoh:')) clean = raw.split('Izoh:')[0].trim();

      const norm = clean.toLowerCase();
      totalCount++;

      // Text yoki Variantli taklif savollari ijobiy/salbiyga ajratilmaydi — faqat to'ldiruvchi fikri olinadi
      if (isOpinion) {
        otherCount++;
      } else if (q.questionType === 'yesno') {
        // INVERSION FIX:
        // "Yo'q" = POSITIVE (no defects reported)
        // "Ha" = NEGATIVE (defects / complaints)
        if (norm === "yo'q" || norm === 'yoq' || norm === 'нет' || norm === 'no') {
          posCount++;
        } else if (norm === 'ha' || norm === 'да' || norm === 'yes') {
          negCount++;
        } else {
          otherCount++;
        }
      } else if (q.questionType === 'rating' || ['1', '2', '3', '4', '5'].includes(clean)) {
        if (clean === '5' || clean === '4' || norm === "a'lo" || norm === 'yaxshi') {
          posCount++;
        } else {
          negCount++;
        }
      } else {
        otherCount++;
      }
    });

    const evaluated = posCount + negCount;
    const satisfactionPct = evaluated > 0 ? (posCount / evaluated) * 100 : 0;

    return {
      question: q,
      totalCount,
      posCount,
      negCount,
      otherCount,
      satisfactionPct,
      isOpinion,
    };
  });

  return (
    <div className="border-t border-slate-100 dark:border-dark-750 bg-slate-50/50 dark:bg-dark-800/30">
      <div className="p-5">
        {/* Header Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-200 dark:border-dark-700">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-bold text-slate-800 dark:text-white text-sm flex items-center gap-2 mr-2">
              <Users size={16} className="text-blue-500" />
              <span>
                {formatDual("Javoblar (", "Ответы (", "Answers (")}
                {responses.length} {formatDual("ta)", "шт.)", "count)")}
              </span>
            </h4>

            {/* View Mode Switcher */}
            <div className="flex flex-wrap items-center bg-slate-200/70 dark:bg-dark-750 p-1 rounded-xl">
              <button
                onClick={() => setViewTab('questions')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  viewTab === 'questions'
                    ? 'bg-white dark:bg-dark-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <BarChart2 size={13} />
                <span>{formatDual("Savollar bo'yicha tahlil", "По вопросам", "By questions")}</span>
              </button>
              <button
                onClick={() => setViewTab('clients')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  viewTab === 'clients'
                    ? 'bg-white dark:bg-dark-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Users size={13} />
                <span>{formatDual("Mijozlar bo'yicha", "По клиентам", "By clients")}</span>
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <a
              href={`/api/surveys/${surveyId}/export`}
              download
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-dark-800 hover:bg-slate-100 dark:hover:bg-dark-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-dark-700 rounded-xl text-xs font-bold transition-all shadow-sm"
              title="Excel formatida yuklab olish"
            >
              <FileSpreadsheet size={14} className="text-green-600" />
              <span>{formatDual("Excel yuklash", "Скачать Excel", "Excel export")}</span>
            </a>
            {onOpenReport && (
              <button
                onClick={onOpenReport}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-emerald-600/20 transition-all"
                title="Rasmiy statistika hisoboti va chop etish"
              >
                <Printer size={14} />
                <span>{formatDual("Statistika va Chop etish", "Печать и статистика", "Print & statistics")}</span>
              </button>
            )}
          </div>
        </div>

        {responses.length === 0 ? (
          <p className="text-xs text-slate-400 italic py-4 text-center">
            {formatDual("Hali javob yo'q", "Пока нет ответов", "No answers yet")}
          </p>
        ) : viewTab === 'questions' ? (
          /* =================================================================== */
          /* VIEW 1: BY QUESTIONS ANALYSIS (CLICKABLE FOR POSITIVE / NEGATIVE)   */
          /* =================================================================== */
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
              <span>
                {formatDual(
                  "Istalgan savol ustiga bosing — kim nima deb javob bergani (ijobiy va salbiy) ochiladi:",
                  "Нажмите на вопрос для подробного анализа (положительные и отрицательные ответы):",
                  "Click any question to view respondents (categorized into positive and negative):"
                )}
              </span>
              <span className="font-semibold">{questions.length} ta savol</span>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {questionSummaries.map(({ question: q, totalCount, posCount, negCount, satisfactionPct, isOpinion }) => (
                <div
                  key={q.id}
                  onClick={() => {
                    setSelectedQuestion(q);
                    setIsDrillDownOpen(true);
                  }}
                  className="bg-white dark:bg-dark-900 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 border border-slate-200 dark:border-dark-700 hover:border-emerald-300 dark:hover:border-emerald-800 rounded-2xl p-4 cursor-pointer transition-all shadow-xs group"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <span className="w-7 h-7 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-black text-xs flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                        {q.subLabel || `#${(q.orderIndex ?? 0) + 1}`}
                      </span>
                      <div className="flex-1 min-w-0">
                        <h5 className="font-bold text-slate-800 dark:text-white text-xs sm:text-sm group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors">
                          {q.questionText}
                        </h5>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {q.questionType === 'yesno'
                            ? formatDual("Ha / Yo'q savoli", "Вопрос Да / Нет", "Yes / No question")
                            : q.questionType === 'rating'
                              ? formatDual("5 ballik baholash", "5-балльная шкала", "5-star rating")
                              : formatDual("Matn / Variantli fikrlar", "Текстовые отзывы", "Text / Feedback")}
                        </p>
                      </div>
                    </div>

                    {/* Stats & Bar */}
                    <div className="flex items-center gap-4 flex-shrink-0 sm:min-w-[240px] justify-between sm:justify-end">
                      {isOpinion ? (
                        <div className="text-right">
                          <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-1 rounded-lg border border-blue-200 dark:border-blue-800 flex items-center gap-1.5 justify-end">
                            <MessageSquare size={12} />
                            <span>{totalCount} {formatDual("ta fikr", "ответов", "opinions")}</span>
                          </span>
                          <span className="text-[10px] text-slate-400 block mt-1">
                            {formatDual("To'ldiruvchilar fikri", "Мнения респондентов", "Respondent feedback")}
                          </span>
                        </div>
                      ) : (
                        <div className="text-right">
                          <div className="flex items-center gap-2 text-xs font-bold">
                            <span className="text-emerald-600 flex items-center gap-1">
                              <CheckCircle2 size={12} /> {posCount}
                            </span>
                            <span className="text-slate-300">•</span>
                            <span className="text-red-500 flex items-center gap-1">
                              <AlertTriangle size={12} /> {negCount}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            {formatDual("Qoniqish:", "Удовл.:", "Satisf.:")} {satisfactionPct.toFixed(0)}%
                          </span>
                        </div>
                      )}

                      {/* Percentage pill button */}
                      <button
                        type="button"
                        className="px-3 py-1.5 rounded-xl text-xs font-black bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 group-hover:bg-emerald-600 group-hover:text-white transition-all flex items-center gap-1.5"
                      >
                        <Users size={12} />
                        <span>{formatDual("Tahlil", "Анализ", "Inspect")}</span>
                      </button>
                    </div>
                  </div>

                  {/* Progress Bar / Info */}
                  {totalCount > 0 && (
                    isOpinion ? (
                      <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-dark-800 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1.5">
                          <MessageSquare size={12} className="text-blue-500" />
                          {formatDual("Erkin fikr-mulohazalar (ijobiy/salbiyga ajratilmagan)", "Свободные мнения респондентов", "Open respondent opinions")}
                        </span>
                        <span className="font-bold text-slate-700 dark:text-slate-300">{totalCount} {formatDual("ta to'ldirildi", "заполнено", "submitted")}</span>
                      </div>
                    ) : (
                      <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-dark-800 flex items-center gap-3">
                        <div className="flex-1 h-2 bg-slate-100 dark:bg-dark-800 rounded-full overflow-hidden flex">
                          <div
                            style={{ width: `${satisfactionPct}%` }}
                            className="h-full bg-emerald-500 transition-all duration-300"
                            title={`Ijobiy: ${satisfactionPct.toFixed(0)}%`}
                          />
                          <div
                            style={{ width: `${100 - satisfactionPct}%` }}
                            className="h-full bg-red-400 transition-all duration-300"
                            title={`Salbiy / E'tiroz: ${(100 - satisfactionPct).toFixed(0)}%`}
                          />
                        </div>
                        <span className="text-[10px] font-black text-slate-600 dark:text-slate-400 flex-shrink-0">
                          {satisfactionPct.toFixed(0)}%
                        </span>
                      </div>
                    )
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* =================================================================== */
          /* VIEW 2: BY CLIENTS (RESPONSES LIST)                                 */
          /* =================================================================== */
          <div className="space-y-4">
            {responses.map((resp: any) => (
              <div
                key={resp.id}
                className="bg-white dark:bg-dark-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-dark-700 text-xs shadow-xs"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2.5 border-b border-slate-100 dark:border-dark-800">
                  <div>
                    <span className="font-black text-slate-900 dark:text-white text-sm">
                      {resp.restaurantName ||
                        formatDual("Noma'lum restoran", "Неизвестный ресторан", "Unknown restaurant")}
                    </span>
                    {resp.respondentName && (
                      <span className="text-slate-500 ml-2 font-medium">
                        — {resp.respondentName}
                      </span>
                    )}
                  </div>
                  <span className="text-slate-400 font-medium">
                    {resp.respondentDate || (resp.submittedAt ? new Date(resp.submittedAt).toLocaleDateString("uz-UZ") : '-')}
                  </span>
                </div>

                <div className="space-y-2">
                  {resp.answers?.map((ans: any) => {
                    const q = questions.find((item: any) => item.id === ans.questionId);
                    const raw = (ans.answerValue || '').trim();
                    let clean = raw;
                    let comment = '';
                    if (raw.includes('. Izoh:')) {
                      const parts = raw.split('. Izoh:');
                      clean = parts[0].trim();
                      comment = parts.slice(1).join('. Izoh:').trim();
                    } else if (raw.includes('Izoh:')) {
                      const parts = raw.split('Izoh:');
                      clean = parts[0].trim();
                      comment = parts.slice(1).join('Izoh:').trim();
                    }

                    const isYoq = clean === "Yo'q" || clean === "Нет" || clean === "No";
                    const isHa = clean === "Ha" || clean === "Да" || clean === "Yes";

                    return (
                      <div
                        key={ans.id}
                        onClick={() => {
                          if (q) {
                            setSelectedQuestion(q);
                            setIsDrillDownOpen(true);
                          }
                        }}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-dark-800 cursor-pointer transition-colors"
                        title="Savol bo'yicha tahlilni ko'rish"
                      >
                        <div className="flex items-start gap-2 flex-1 min-w-0">
                          <span className="text-slate-400 font-bold flex-shrink-0 w-4">
                            {q?.subLabel || "•"}
                          </span>
                          <span className="text-slate-700 dark:text-slate-300 flex-1 line-clamp-1">
                            {q?.questionText}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0 pl-6 sm:pl-0">
                          <span
                            className={`font-black px-2 py-0.5 rounded-lg text-xs ${
                              isYoq
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                                : isHa
                                  ? "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300 border border-red-200 dark:border-red-800"
                                  : clean === "5"
                                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                                    : clean === "4"
                                      ? "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300"
                                      : clean === "3"
                                        ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                                        : clean === "2" || clean === "1"
                                          ? "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300"
                                          : "bg-slate-100 text-slate-700 dark:bg-dark-800 dark:text-slate-300"
                            }`}
                          >
                            {isYoq ? formatDual("Yo'q (Benuqson)", "Нет (Без дефектов)", "No (Flawless)") : isHa ? formatDual("Ha (Nuqson)", "Да (Дефект)", "Yes (Defect)") : clean}
                          </span>
                          {comment && (
                            <span className="text-slate-500 italic text-[11px] max-w-[200px] truncate" title={comment}>
                              "{comment}"
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* QUESTION DRILL-DOWN MODAL */}
      <QuestionDrillDownModal
        isOpen={isDrillDownOpen}
        onClose={() => {
          setIsDrillDownOpen(false);
          setSelectedQuestion(null);
        }}
        question={selectedQuestion}
        responses={responses}
      />
    </div>
  );
}
