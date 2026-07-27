"use client";
 
import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { ChevronLeft, FileText, Clock } from "lucide-react";
import { Header } from "@/app/user/component/header";
import { Footer } from "@/app/user/component/footer";
import { getLegalDoc, type LegalDoc, type LegalSlug } from "@/lib/api/legal";
 
function fmtDate(d?: string) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("en-GB", {
      day: "numeric", month: "long", year: "numeric",
    });
  } catch { return "—"; }
}
 
function slugifyHeading(heading: string) {
  return heading
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}
 
export function LegalPageView({ slug }: { slug: LegalSlug }) {
  const [doc, setDoc] = useState<LegalDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
 
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true); setError("");
      try {
        const res = await getLegalDoc(slug);
        if (alive) setDoc(res?.data || null);
      } catch (e: any) {
        if (alive) setError(e?.response?.data?.message || e?.message || "Failed to load document");
      } finally { if (alive) setLoading(false); }
    })();
    return () => { alive = false; };
  }, [slug]);
 
  // Reading progress on scroll
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const el = document.documentElement;
      const pct = (el.scrollTop / (el.scrollHeight - el.clientHeight)) * 100;
      setProgress(Math.min(100, Math.max(0, pct)));
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
 
  const sectionAnchors = useMemo(
    () => (doc?.sections || []).map((s) => ({
      heading: s.heading,
      anchor: slugifyHeading(s.heading),
    })),
    [doc]
  );
 
  return (
    <div className="flex min-h-screen flex-col bg-neutral-50">
      <Header />
 
      {/* reading progress bar */}
      <div className="fixed top-0 left-0 right-0 z-50 h-0.5 bg-transparent">
        <div
          className="h-full bg-neutral-900 transition-all duration-150 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
 
      <main className="flex-1">
        <div className="container mx-auto max-w-6xl px-4 py-10">
 
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm text-neutral-500 transition-colors hover:text-neutral-900"
          >
            <ChevronLeft className="h-4 w-4" /> Back to home
          </Link>
 
          {loading ? (
            <div className="mt-6 space-y-4">
              <div className="h-10 w-2/3 animate-pulse rounded bg-neutral-200" />
              <div className="h-4 w-1/3 animate-pulse rounded bg-neutral-200" />
              <div className="mt-8 space-y-3">
                {[0,1,2,3,4].map((i) => (
                  <div key={i} className="h-4 animate-pulse rounded bg-neutral-100" />
                ))}
              </div>
            </div>
          ) : error ? (
            <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
              {error}
            </div>
          ) : !doc ? (
            <div className="mt-6 rounded-lg border border-neutral-200 bg-white px-5 py-12 text-center text-neutral-400">
              <FileText className="mx-auto mb-3 h-8 w-8 text-neutral-300" strokeWidth={1.4} />
              Document not available
            </div>
          ) : (
            <div className="mt-6 grid gap-10 lg:grid-cols-[260px_1fr]">
 
              {/* ── Sidebar TOC (desktop) ── */}
              <aside className="hidden lg:block">
                <div className="sticky top-24 space-y-1">
                  <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-neutral-400">
                    Contents
                  </p>
                  {sectionAnchors.map((s, i) => (
                    <a
                      key={s.anchor}
                      href={`#${s.anchor}`}
                      className="block rounded-lg px-3 py-2 text-sm text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
                    >
                      <span className="mr-2 inline-block w-5 text-right text-[11px] text-neutral-400">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      {s.heading}
                    </a>
                  ))}
                </div>
              </aside>
 
              {/* ── Document body ── */}
              <article className="min-w-0">
                {/* Hero */}
                <header className="border-b border-neutral-200 pb-8">
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
                    <FileText className="h-3 w-3" /> Legal
                  </div>
                  <h1 className="mt-4 text-4xl font-bold tracking-tight text-neutral-900 sm:text-5xl">
                    {doc.title}
                  </h1>
                  <div className="mt-4 flex items-center gap-2 text-sm text-neutral-500">
                    <Clock className="h-4 w-4" />
                    <span>Effective <span className="font-semibold text-neutral-700">{fmtDate(doc.effectiveDate)}</span></span>
                  </div>
                </header>
 
                {/* Intro */}
                <p className="mt-8 text-base leading-relaxed text-neutral-700">
                  {doc.intro}
                </p>
 
                {/* Mobile TOC (collapsible) */}
                <details className="mt-8 rounded-lg border border-neutral-200 bg-white p-4 lg:hidden">
                  <summary className="cursor-pointer text-sm font-semibold text-neutral-900">
                    Table of contents ({sectionAnchors.length})
                  </summary>
                  <div className="mt-3 space-y-1">
                    {sectionAnchors.map((s, i) => (
                      <a
                        key={s.anchor}
                        href={`#${s.anchor}`}
                        className="block py-1 text-sm text-neutral-600 hover:text-neutral-900"
                      >
                        {i + 1}. {s.heading}
                      </a>
                    ))}
                  </div>
                </details>
 
                {/* Sections */}
                <div className="mt-10 space-y-12">
                  {doc.sections.map((s, i) => (
                    <section key={slugifyHeading(s.heading)} id={slugifyHeading(s.heading)} className="scroll-mt-24">
                      <h2 className="flex items-baseline gap-3 text-xl font-bold text-neutral-900 sm:text-2xl">
                        <span className="text-sm font-semibold text-neutral-300">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        {s.heading}
                      </h2>
                      <div className="mt-3 text-base leading-relaxed text-neutral-700 whitespace-pre-wrap">
                        {s.body}
                      </div>
                    </section>
                  ))}
                </div>
 
                {/* Footer note */}
                <div className="mt-16 rounded-xl border border-neutral-200 bg-white p-6 text-sm text-neutral-500">
                  <p>
                    Last updated on <span className="font-semibold text-neutral-700">{fmtDate(doc.effectiveDate)}</span>.
                    Questions? <Link href="/user/dashboard/contact" className="font-semibold text-neutral-900 underline-offset-4 hover:underline">Contact us</Link>.
                  </p>
                </div>
 
              </article>
            </div>
          )}
        </div>
      </main>
 
      <Footer />
    </div>
  );
}