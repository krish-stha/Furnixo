"use client";
 
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Hammer, Leaf, ShieldCheck } from "lucide-react";
 
import { Header } from "@/app/user/component/header";
import { Footer } from "@/app/user/component/footer";
import { getPublicSettings } from "@/lib/api/settings";
import { getPublicAbout } from "@/lib/api/about";
 
function backendPublic(pathname: string) {
  const base = (process.env.NEXT_PUBLIC_BACKEND_URL || "").replace(/\/$/, "");
  if (!pathname) return "";
  if (pathname.startsWith("http://") || pathname.startsWith("https://")) return pathname;
  if (pathname.startsWith("/")) return `${base}${pathname}`;
  return `${base}/public/${pathname}`;
}
 
function resolveAboutImage(fnOrUrl: string, fallback: string) {
  const v = String(fnOrUrl || "").trim();
  if (!v) return fallback;
  if (v.startsWith("http://") || v.startsWith("https://")) return v;
  return backendPublic(`about/${v}`);
}
 
export default function AboutPage() {
  const [storeName, setStoreName] = useState("Furnixo");
  const [about, setAbout] = useState<any>(null);
 
  const missionImg = useMemo(
    () => resolveAboutImage(about?.missionImage, "/images/categories/sofas.jpg"),
    [about?.missionImage]
  );
  const visionImg = useMemo(
    () => resolveAboutImage(about?.visionImage, "/images/categories/armchairs.jpg"),
    [about?.visionImage]
  );
 
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const sres = await getPublicSettings();
        const sdata = sres?.data ?? sres ?? {};
        const name = String(sdata?.storeName || "").trim();
        if (alive && name) setStoreName(name);
      } catch {}
 
      try {
        const ares = await getPublicAbout();
        const adata = ares?.data ?? ares ?? null;
        if (alive) setAbout(adata);
      } catch {
        if (alive) setAbout(null);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);
 
  const heroTitle = about?.heroTitle || `About ${storeName}`;
  const heroDescription =
    about?.heroDescription ||
    `${storeName} brings honest, well-crafted furniture to contemporary homes — timeless silhouettes, durable materials, fair prices.`;
 
  const missionTitle = about?.missionTitle || "Our Mission";
  const missionBody =
    about?.missionBody ||
    "To make beautifully made furniture accessible — pieces designed to be lived with, not replaced.";
 
  const visionTitle = about?.visionTitle || "Our Vision";
  const visionBody =
    about?.visionBody ||
    "A home in every city where tradition and modern design sit comfortably side by side.";
 
  const socials = Array.isArray(about?.socials) ? about.socials : [];
 
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header />
 
      <main className="flex-1">
        {/* ===== HERO — dark editorial band ===== */}
        <section className="relative overflow-hidden bg-neutral-900">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-30"
            style={{ backgroundImage: "url(/images/hero-furniture.jpg)" }}
          />
          <div className="container relative mx-auto px-4 py-24 text-center md:py-32">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-neutral-400">
              Our Story
            </p>
            <h1 className="mx-auto mt-4 max-w-3xl text-4xl font-bold leading-tight text-white md:text-5xl">
              {heroTitle}
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-neutral-300 md:text-base">
              {heroDescription}
            </p>
 
            {socials.length > 0 && (
              <div className="mt-8 flex flex-wrap justify-center gap-2">
                {socials.map((s: any, idx: number) => (
                  <a
                    key={idx}
                    href={s.url}
                    target="_blank"
                    rel="noreferrer"
                    className="border border-white/30 px-4 py-1.5 text-xs font-medium uppercase tracking-wide text-white transition-colors hover:bg-white hover:text-neutral-900"
                  >
                    {s.label || s.url}
                  </a>
                ))}
              </div>
            )}
          </div>
        </section>
 
        {/* ===== MISSION ===== */}
        <section className="container mx-auto grid items-center gap-12 px-4 py-20 md:grid-cols-2 md:py-28">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-neutral-400">
              01 — Mission
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-neutral-900">
              {missionTitle}
            </h2>
            <p className="mt-5 text-base leading-relaxed text-neutral-600">{missionBody}</p>
          </div>
          {/* offset-frame image — the Furnixo signature */}
          <div className="relative">
            <div className="absolute -bottom-4 -right-4 h-full w-full border border-neutral-900" />
            <div className="relative aspect-[4/3] overflow-hidden bg-neutral-100">
              <Image src={missionImg} alt={missionTitle} fill className="object-cover" unoptimized />
            </div>
          </div>
        </section>
 
        {/* ===== VISION (mirrored) ===== */}
        <section className="bg-neutral-50">
          <div className="container mx-auto grid items-center gap-12 px-4 py-20 md:grid-cols-2 md:py-28">
            <div className="relative order-2 md:order-1">
              <div className="absolute -bottom-4 -left-4 h-full w-full border border-neutral-900" />
              <div className="relative aspect-[4/3] overflow-hidden bg-neutral-100">
                <Image src={visionImg} alt={visionTitle} fill className="object-cover" unoptimized />
              </div>
            </div>
            <div className="order-1 md:order-2">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-neutral-400">
                02 — Vision
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-neutral-900">
                {visionTitle}
              </h2>
              <p className="mt-5 text-base leading-relaxed text-neutral-600">{visionBody}</p>
            </div>
          </div>
        </section>
 
        {/* ===== VALUES ===== */}
        <section className="container mx-auto px-4 py-20 md:py-24">
          <p className="text-center text-xs font-semibold uppercase tracking-[0.25em] text-neutral-400">
            What we stand for
          </p>
          <div className="mt-10 grid gap-10 md:grid-cols-3">
            {[
              {
                icon: Hammer,
                title: "Craftsmanship",
                text: "Every piece is built with care, by people who take pride in their work.",
              },
              {
                icon: Leaf,
                title: "Honest Materials",
                text: "Solid wood, real leather, durable fabrics — nothing pretending to be something else.",
              },
              {
                icon: ShieldCheck,
                title: "Built to Last",
                text: "Furniture meant to be kept, with a 14-day return promise behind it.",
              },
            ].map(({ icon: Icon, title, text }) => (
              <div key={title} className="text-center">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-neutral-900">
                  <Icon className="h-5 w-5 text-neutral-900" strokeWidth={1.5} />
                </span>
                <h3 className="mt-4 text-sm font-semibold uppercase tracking-wide text-neutral-900">
                  {title}
                </h3>
                <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-neutral-500">
                  {text}
                </p>
              </div>
            ))}
          </div>
        </section>
 
        {/* ===== CLOSING CTA ===== */}
        <section className="bg-neutral-900">
          <div className="container mx-auto flex flex-col items-center gap-6 px-4 py-16 text-center">
            <h2 className="text-2xl font-bold text-white md:text-3xl">
              See what we&apos;ve been making
            </h2>
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 bg-white px-8 py-3 text-sm font-semibold uppercase tracking-wide text-neutral-900 transition-colors hover:bg-neutral-200"
            >
              Explore the collection <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>
 
      <Footer />
    </div>
  );
}