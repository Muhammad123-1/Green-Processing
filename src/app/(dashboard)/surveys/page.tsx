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
} from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/components/providers/LanguageProvider";

export default function SurveysPage() {
  const { formatDual } = useLanguage();
  const [surveys, setSurveys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);

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
          <div className="flex gap-3">
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
            <div className="bg-white dark:bg-dark-900 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden border border-slate-200 dark:border-dark-750">
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
                    <div className="flex items-start gap-4">
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
                        <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
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
                      <div className="flex items-center gap-2 flex-shrink-0">
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
                  {isExpanded && <ResponseViewer surveyId={s.id} />}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function ResponseViewer({ surveyId }: { surveyId: number }) {
  const { formatDual } = useLanguage();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch(`/api/surveys/${surveyId}`)
      .then((r) => r.json())
      .then(setData);
  }, [surveyId]);

  if (!data) return null;

  const questions = data.questions || [];
  const responses = data.responses || [];

  return (
    <div className="border-t border-slate-100 dark:border-dark-750 bg-slate-50/50 dark:bg-dark-800/30">
      <div className="p-5">
        <h4 className="font-semibold text-slate-700 dark:text-slate-300 text-sm mb-4">
          {formatDual("Javoblar (", "Ответы (", "Answers (")}
          {responses.length} {formatDual("ta)", "шт.)", "count)")}
        </h4>
        {responses.length === 0 ? (
          <p className="text-xs text-slate-400 italic">
            {formatDual(
              "Hali javob yo'q",
              "Пока нет ответов",
              "No answers yet",
            )}
          </p>
        ) : (
          <div className="space-y-4">
            {responses.map((resp: any) => (
              <div
                key={resp.id}
                className="bg-white dark:bg-dark-900 rounded-xl p-4 border border-slate-200 dark:border-dark-700 text-xs"
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="font-bold text-slate-800 dark:text-white">
                      {resp.restaurantName ||
                        formatDual(
                          "Noma'lum restoran",
                          "Неизвестный ресторан",
                          "Unknown restaurant",
                        )}
                    </span>
                    {resp.respondentName && (
                      <span className="text-slate-500 ml-2">
                        — {resp.respondentName}
                      </span>
                    )}
                  </div>
                  <span className="text-slate-400">
                    {new Date(resp.submittedAt).toLocaleDateString("uz-UZ")}
                  </span>
                </div>
                <div className="space-y-1.5">
                  {resp.answers?.map((ans: any) => {
                    const q = questions.find(
                      (q: any) => q.id === ans.questionId,
                    );
                    return (
                      <div key={ans.id} className="flex gap-2">
                        <span className="text-slate-500 flex-shrink-0 w-3">
                          {q?.subLabel || "•"}
                        </span>
                        <span className="text-slate-600 dark:text-slate-400 flex-1 line-clamp-1">
                          {q?.questionText?.substring(0, 40)}...
                        </span>
                        <span
                          className={`font-bold flex-shrink-0 ${
                            ans.answerValue === "5"
                              ? "text-green-600"
                              : ans.answerValue === "4"
                                ? "text-blue-600"
                                : ans.answerValue === "3"
                                  ? "text-yellow-600"
                                  : ans.answerValue === "2"
                                    ? "text-orange-600"
                                    : ans.answerValue === "1"
                                      ? "text-red-600"
                                      : ans.answerValue === "Ha"
                                        ? "text-red-500"
                                        : ans.answerValue === "Yo'q" ||
                                            ans.answerValue === "Нет"
                                          ? "text-green-600"
                                          : "text-slate-700 dark:text-slate-300"
                          }`}
                        >
                          {ans.answerValue}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
