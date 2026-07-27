"use client";
 
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Globe, Image as ImageIcon, Plus, Trash2, Upload } from "lucide-react";
import {
  adminGetAbout, adminUpdateAbout,
  adminUploadMissionImage, adminUploadVisionImage,
} from "@/lib/api/admin/about";
import { useToast } from "@/hooks/use-toast";
 
type Social = { label: string; url: string; };
 
function backendPublic(pathname: string) {
  const base = (process.env.NEXT_PUBLIC_BACKEND_URL || "").replace(/\/$/, "");
  if (!pathname) return "";
  if (pathname.startsWith("http://") || pathname.startsWith("https://")) return pathname;
  if (pathname.startsWith("/")) return `${base}${pathname}`;
  return `${base}/public/${pathname}`;
}
 
const inputCls = "h-9 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none transition-colors focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10";
const labelCls = "mb-1.5 block text-xs font-semibold uppercase tracking-wide text-neutral-500";
const sectionCls = "rounded-xl border border-neutral-200 bg-white p-5";
const btnPrimary = "inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-neutral-900 px-4 text-sm font-semibold text-white transition-colors hover:bg-neutral-700 disabled:opacity-50";
const btnOutline = "inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-neutral-200 bg-white px-4 text-sm font-semibold text-neutral-700 transition-colors hover:border-neutral-900 disabled:opacity-50";
 
function SectionHead({ icon: Icon, title, subtitle }: { icon: any; title: string; subtitle?: string }) {
  return (
    <div className="mb-4 flex items-start gap-3 border-b border-neutral-100 pb-4">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-neutral-100">
        <Icon className="h-4 w-4 text-neutral-900" strokeWidth={1.8} />
      </span>
      <div>
        <p className="text-sm font-semibold text-neutral-900">{title}</p>
        {subtitle && <p className="mt-0.5 text-xs text-neutral-500">{subtitle}</p>}
      </div>
    </div>
  );
}
 
export default function AdminAboutPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
 
  const [heroTitle, setHeroTitle] = useState("");
  const [heroDescription, setHeroDescription] = useState("");
  const [missionTitle, setMissionTitle] = useState("");
  const [missionBody, setMissionBody] = useState("");
  const [missionImage, setMissionImage] = useState("");
  const [visionTitle, setVisionTitle] = useState("");
  const [visionBody, setVisionBody] = useState("");
  const [visionImage, setVisionImage] = useState("");
  const [published, setPublished] = useState(true);
  const [socials, setSocials] = useState<Social[]>([]);
 
  const missionPreview = useMemo(() => missionImage ? backendPublic(`about/${missionImage}`) : "", [missionImage]);
  const visionPreview = useMemo(() => visionImage ? backendPublic(`about/${visionImage}`) : "", [visionImage]);
 
  const fetchDoc = async () => {
    setLoading(true); setError("");
    try {
      const res = await adminGetAbout();
      const doc = res?.data ?? res;
      setHeroTitle(doc?.heroTitle || ""); setHeroDescription(doc?.heroDescription || "");
      setMissionTitle(doc?.missionTitle || ""); setMissionBody(doc?.missionBody || ""); setMissionImage(doc?.missionImage || "");
      setVisionTitle(doc?.visionTitle || ""); setVisionBody(doc?.visionBody || ""); setVisionImage(doc?.visionImage || "");
      setPublished(Boolean(doc?.published));
      setSocials(Array.isArray(doc?.socials) ? doc.socials : []);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Failed to load about data");
    } finally { setLoading(false); }
  };
 
  useEffect(() => { fetchDoc(); }, []);
 
  const save = async () => {
    setLoading(true); setError("");
    try {
      await adminUpdateAbout({ heroTitle, heroDescription, missionTitle, missionBody, visionTitle, visionBody, published, socials });
      toast({ title: "Saved", description: "About page updated.", duration: 1200 });
      await fetchDoc();
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || "Save failed";
      setError(msg); toast({ title: "Save failed", description: msg, variant: "destructive", duration: 2000 });
    } finally { setLoading(false); }
  };
 
  const uploadMission = async (file: File) => {
    setLoading(true); setError("");
    try {
      const res = await adminUploadMissionImage(file);
      const doc = res?.data ?? res;
      setMissionImage(doc?.missionImage || "");
      toast({ title: "Image uploaded", duration: 1200 });
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Upload failed");
    } finally { setLoading(false); }
  };
 
  const uploadVision = async (file: File) => {
    setLoading(true); setError("");
    try {
      const res = await adminUploadVisionImage(file);
      const doc = res?.data ?? res;
      setVisionImage(doc?.visionImage || "");
      toast({ title: "Image uploaded", duration: 1200 });
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Upload failed");
    } finally { setLoading(false); }
  };
 
  const addSocial = () => setSocials((p) => [...p, { label: "", url: "" }]);
  const removeSocial = (idx: number) => setSocials((p) => p.filter((_, i) => i !== idx));
 
  const ImageUploadBlock = ({ preview, onUpload, alt }: { preview: string; onUpload: (f: File) => void; alt: string }) => (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-lg border border-neutral-200 bg-neutral-50" style={{ height: 220 }}>
        {preview ? <Image src={preview} alt={alt} fill className="object-cover" unoptimized /> : (
          <div className="flex h-full items-center justify-center">
            <ImageIcon className="h-8 w-8 text-neutral-300" strokeWidth={1} />
          </div>
        )}
      </div>
      <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-neutral-200 px-3 py-2 text-sm font-medium text-neutral-700 transition-colors hover:border-neutral-900 w-fit">
        <Upload className="h-4 w-4" /> Upload image
        <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onUpload(f); }} />
      </label>
      <p className="text-[11px] text-neutral-400">Uploads to /public/about/</p>
    </div>
  );
 
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">About Page</h1>
          <p className="mt-1 text-sm text-neutral-500">Manage public About page content</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchDoc} disabled={loading} className={btnOutline}>Refresh</button>
          <button onClick={save} disabled={loading} className={btnPrimary}>{loading ? "Saving…" : "Save changes"}</button>
        </div>
      </div>
 
      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
 
      {/* Visibility */}
      <div className={sectionCls}>
        <label className="flex cursor-pointer items-center gap-3">
          <div onClick={() => setPublished((p) => !p)} className={`relative h-5 w-9 rounded-full transition-colors ${published ? "bg-neutral-900" : "bg-neutral-200"}`}>
            <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${published ? "translate-x-4" : "translate-x-0.5"}`} />
          </div>
          <div>
            <p className="text-sm font-semibold text-neutral-900">Published</p>
            <p className="text-xs text-neutral-500">{published ? "Visible to all users" : "Hidden from public"}</p>
          </div>
        </label>
      </div>
 
      {/* Hero */}
      <div className={sectionCls}>
        <SectionHead icon={Globe} title="Hero section" subtitle="The dark banner at the top of the page" />
        <div className="space-y-4">
          <div>
            <label className={labelCls}>Title</label>
            <input value={heroTitle} onChange={(e) => setHeroTitle(e.target.value)} placeholder="About Furnixo" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Description</label>
            <textarea value={heroDescription} onChange={(e) => setHeroDescription(e.target.value)} rows={4} className={`${inputCls} h-auto py-2`} placeholder="A short paragraph about the brand…" />
          </div>
        </div>
      </div>
 
      {/* Mission */}
      <div className={sectionCls}>
        <SectionHead icon={ImageIcon} title="Mission section" />
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <div>
              <label className={labelCls}>Title</label>
              <input value={missionTitle} onChange={(e) => setMissionTitle(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Body</label>
              <textarea value={missionBody} onChange={(e) => setMissionBody(e.target.value)} rows={5} className={`${inputCls} h-auto py-2`} />
            </div>
          </div>
          <div>
            <label className={labelCls}>Image</label>
            <ImageUploadBlock preview={missionPreview} onUpload={uploadMission} alt="Mission" />
          </div>
        </div>
      </div>
 
      {/* Vision */}
      <div className={sectionCls}>
        <SectionHead icon={ImageIcon} title="Vision section" />
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <div>
              <label className={labelCls}>Title</label>
              <input value={visionTitle} onChange={(e) => setVisionTitle(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Body</label>
              <textarea value={visionBody} onChange={(e) => setVisionBody(e.target.value)} rows={5} className={`${inputCls} h-auto py-2`} />
            </div>
          </div>
          <div>
            <label className={labelCls}>Image</label>
            <ImageUploadBlock preview={visionPreview} onUpload={uploadVision} alt="Vision" />
          </div>
        </div>
      </div>
 
      {/* Socials */}
      <div className={sectionCls}>
        <div className="mb-4 flex items-center justify-between border-b border-neutral-100 pb-4">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-100">
              <Globe className="h-4 w-4 text-neutral-900" strokeWidth={1.8} />
            </span>
            <p className="text-sm font-semibold text-neutral-900">Social links</p>
          </div>
          <button onClick={addSocial} disabled={loading} className={btnOutline + " h-8 px-3 text-xs"}>
            <Plus className="h-3.5 w-3.5" /> Add link
          </button>
        </div>
 
        {socials.length === 0 ? (
          <p className="text-sm text-neutral-400">No social links added yet</p>
        ) : (
          <div className="space-y-3">
            {socials.map((s, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input placeholder="Label (e.g. Instagram)" value={s.label} onChange={(e) => { const v = e.target.value; setSocials((p) => p.map((x, i) => i === idx ? { ...x, label: v } : x)); }} className={`${inputCls} w-40`} />
                <input placeholder="https://…" value={s.url} onChange={(e) => { const v = e.target.value; setSocials((p) => p.map((x, i) => i === idx ? { ...x, url: v } : x)); }} className={inputCls} />
                <button onClick={() => removeSocial(idx)} className="shrink-0 text-neutral-400 hover:text-red-600">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}