"use client";
 
import { useEffect, useMemo, useState } from "react";
import { FileText, Plus, Trash2, GripVertical, Save, ExternalLink, RefreshCw } from "lucide-react";
import Link from "next/link";
import {
  adminGetLegalDoc,
  adminUpdateLegalDoc,
  type LegalDoc,
  type LegalSection,
  type LegalSlug,
} from "@/lib/api/legal";
import { useToast } from "@/hooks/use-toast";
 
const TABS: { slug: LegalSlug; label: string; publicHref: string }[] = [
  { slug: "privacy", label: "Privacy Policy",   publicHref: "/privacy" },
  { slug: "terms",   label: "Terms of Service", publicHref: "/terms"   },
];
 
const inputCls   = "w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition-colors focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10 disabled:opacity-50";
const btnPrimary = "inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-neutral-900 px-5 text-sm font-semibold text-white transition-colors hover:bg-neutral-700 disabled:opacity-50";
const btnOutline = "inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-neutral-200 bg-white px-4 text-sm font-semibold text-neutral-700 transition-colors hover:border-neutral-900 disabled:opacity-50";
 
export default function AdminLegalPage() {
  const { toast } = useToast();
 
  const [activeSlug, setActiveSlug] = useState<LegalSlug>("privacy");
  const [loading, setLoading]       = useState(false);
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState("");
 
  const [title, setTitle]         = useState("");
  const [intro, setIntro]         = useState("");
  const [effectiveDate, setEffectiveDate] = useState("");
  const [sections, setSections]   = useState<LegalSection[]>([]);
  const [updatedAt, setUpdatedAt] = useState<string>("");
 
  const fetchDoc = async (slug: LegalSlug) => {
    setLoading(true); setError("");
    try {
      const res = await adminGetLegalDoc(slug);
      const d: LegalDoc = res?.data;
      setTitle(d?.title || "");
      setIntro(d?.intro || "");
      setEffectiveDate(d?.effectiveDate ? new Date(d.effectiveDate).toISOString().slice(0, 10) : "");
      setSections(d?.sections || []);
      setUpdatedAt(d?.updatedAt || "");
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || "Failed to load document";
      setError(msg);
      // If the doc doesn't exist yet, start with empty state
      if (e?.response?.status === 404) {
        setTitle(""); setIntro(""); setSections([]); setUpdatedAt("");
        setError("");
      }
    } finally { setLoading(false); }
  };
 
  useEffect(() => { fetchDoc(activeSlug); /* eslint-disable-next-line */ }, [activeSlug]);
 
  // ── section editing ──────────────────────────────────────────────────────
  const updateSection = (i: number, patch: Partial<LegalSection>) =>
    setSections((p) => p.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
 
  const addSection = () =>
    setSections((p) => [...p, { heading: "", body: "" }]);
 
  const removeSection = (i: number) =>
    setSections((p) => p.filter((_, idx) => idx !== i));
 
  const moveSection = (i: number, dir: -1 | 1) => {
    setSections((p) => {
      const next = [...p];
      const j = i + dir;
      if (j < 0 || j >= next.length) return p;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  };
 
  // ── validation ───────────────────────────────────────────────────────────
  const validation = useMemo(() => {
    if (!title.trim()) return "Title is required";
    if (!intro.trim()) return "Intro is required";
    if (intro.length > 2000) return "Intro is too long (max 2000)";
    if (sections.length === 0) return "Add at least one section";
    for (let i = 0; i < sections.length; i++) {
      if (!sections[i].heading.trim()) return `Section ${i + 1}: heading required`;
      if (!sections[i].body.trim())    return `Section ${i + 1}: body required`;
      if (sections[i].body.length > 10000) return `Section ${i + 1}: too long`;
    }
    return null;
  }, [title, intro, sections]);
 
  const save = async () => {
    if (validation) {
      toast({ title: "Cannot save", description: validation, variant: "destructive" });
      return;
    }
    setSaving(true); setError("");
    try {
      const res = await adminUpdateLegalDoc(activeSlug, {
        title: title.trim(),
        intro: intro.trim(),
        sections: sections.map((s) => ({ heading: s.heading.trim(), body: s.body.trim() })),
        effectiveDate: effectiveDate || undefined,
      });
      setUpdatedAt(res?.data?.updatedAt || new Date().toISOString());
      toast({ title: "Saved", description: `${TABS.find((t) => t.slug === activeSlug)?.label} updated.` });
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || "Save failed";
      setError(msg);
      toast({ title: "Save failed", description: msg, variant: "destructive" });
    } finally { setSaving(false); }
  };
 
  const activeTab = TABS.find((t) => t.slug === activeSlug)!;
 
  return (
    <div className="space-y-5">
      {/* head */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Legal documents</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Edit your public-facing privacy policy and terms of service.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={activeTab.publicHref}
            target="_blank"
            className={btnOutline}
          >
            <ExternalLink className="h-4 w-4" /> View live
          </Link>
          <button onClick={() => fetchDoc(activeSlug)} disabled={loading} className={btnOutline}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button onClick={save} disabled={saving || loading || !!validation} className={btnPrimary}>
            <Save className="h-4 w-4" />
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>
 
      <div className="flex gap-1 rounded-lg border border-neutral-200 bg-neutral-50 p-1 w-fit">
        {TABS.map((t) => (
          <button
            key={t.slug}
            onClick={() => setActiveSlug(t.slug)}
            className={`flex h-8 items-center gap-2 rounded-md px-4 text-sm font-semibold transition-colors ${
              activeSlug === t.slug
                ? "bg-white text-neutral-900 shadow-sm"
                : "text-neutral-500 hover:text-neutral-700"
            }`}
          >
            <FileText className="h-4 w-4" strokeWidth={1.8} /> {t.label}
          </button>
        ))}
      </div>
 
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}
 
      {/* header fields */}
      <div className="rounded-xl border border-neutral-200 bg-white p-5">
        <div className="grid gap-4 sm:grid-cols-[1fr_180px]">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-neutral-500">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={inputCls}
              disabled={loading}
              maxLength={200}
              placeholder="Privacy Policy"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-neutral-500">Effective date</label>
            <input
              type="date"
              value={effectiveDate}
              onChange={(e) => setEffectiveDate(e.target.value)}
              className={inputCls}
              disabled={loading}
            />
          </div>
        </div>
 
        <div className="mt-4">
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Intro <span className="normal-case font-normal text-neutral-400">— shown at the top of the public page</span>
          </label>
          <textarea
            rows={4}
            value={intro}
            onChange={(e) => setIntro(e.target.value)}
            className={`${inputCls} resize-none`}
            disabled={loading}
            maxLength={2000}
            placeholder="Welcome to Furnixo. This policy explains…"
          />
          <p className="mt-1 text-xs text-neutral-400">{intro.length} / 2000</p>
        </div>
 
        {updatedAt && (
          <p className="mt-3 text-xs text-neutral-400">
            Last edited {new Date(updatedAt).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
          </p>
        )}
      </div>
 
      {/* sections */}
      <div className="space-y-3">
        {sections.map((s, i) => (
          <div key={i} className="rounded-xl border border-neutral-200 bg-white">
            {/* section head */}
            <div className="flex items-center justify-between gap-2 border-b border-neutral-100 px-4 py-3">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                <GripVertical className="h-3.5 w-3.5 text-neutral-300" />
                Section {String(i + 1).padStart(2, "0")}
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => moveSection(i, -1)}
                  disabled={i === 0 || loading || saving}
                  className="inline-flex h-7 w-7 items-center justify-center rounded border border-neutral-200 text-xs font-bold text-neutral-600 transition-colors hover:border-neutral-900 hover:text-neutral-900 disabled:opacity-30"
                  title="Move up"
                >↑</button>
                <button
                  onClick={() => moveSection(i, 1)}
                  disabled={i === sections.length - 1 || loading || saving}
                  className="inline-flex h-7 w-7 items-center justify-center rounded border border-neutral-200 text-xs font-bold text-neutral-600 transition-colors hover:border-neutral-900 hover:text-neutral-900 disabled:opacity-30"
                  title="Move down"
                >↓</button>
                <button
                  onClick={() => removeSection(i)}
                  disabled={loading || saving}
                  className="inline-flex h-7 items-center gap-1 rounded border border-red-200 px-2 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>
 
            {/* section body */}
            <div className="space-y-3 p-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-neutral-500">Heading</label>
                <input
                  value={s.heading}
                  onChange={(e) => updateSection(i, { heading: e.target.value })}
                  className={inputCls}
                  disabled={loading || saving}
                  maxLength={200}
                  placeholder="e.g. Information We Collect"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  Body <span className="normal-case font-normal text-neutral-400">— use blank lines for paragraphs, bullet points with •</span>
                </label>
                <textarea
                  rows={6}
                  value={s.body}
                  onChange={(e) => updateSection(i, { body: e.target.value })}
                  className={`${inputCls} resize-y font-mono text-[13px] leading-relaxed`}
                  disabled={loading || saving}
                  maxLength={10000}
                  placeholder="Write the section content here…"
                />
                <p className="mt-1 text-xs text-neutral-400">{s.body.length} / 10000</p>
              </div>
            </div>
          </div>
        ))}
 
        <button
          onClick={addSection}
          disabled={loading || saving}
          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-neutral-200 bg-white py-4 text-sm font-medium text-neutral-500 transition-colors hover:border-neutral-400 hover:text-neutral-900 disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          Add section
        </button>
      </div>
 
      {/* footer save */}
      <div className="flex items-center justify-between gap-4 rounded-xl border border-neutral-200 bg-white px-5 py-4">
        <p className="text-sm text-neutral-500">
          {validation ? <span className="text-red-600">{validation}</span> : "Ready to save"}
        </p>
        <button onClick={save} disabled={saving || loading || !!validation} className={btnPrimary}>
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>
    </div>
  );
}