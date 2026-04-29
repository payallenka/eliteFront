import { useState, useEffect, useCallback, useRef } from "react";
import {
  MdSearch, MdWork, MdLocationOn, MdOpenInNew, MdAttachMoney,
  MdAutoAwesome, MdClose, MdFilterList, MdBusiness,
} from "react-icons/md";
import { supabase } from "../supabaseClient";

const API = import.meta.env.VITE_SCHOLARSHIP_API_URL || "http://localhost:8000";
const LIMIT = 24;

// ─── Shared helpers ───────────────────────────────────────────────────────────

const SOURCE_META = {
  remoteok:            { label: "RemoteOK",          bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-400" },
  arbeitnow:           { label: "Arbeitnow",         bg: "bg-blue-50",   text: "text-blue-700",    dot: "bg-blue-400" },
  uk_sponsor_register: { label: "UK Sponsor",        bg: "bg-purple-50", text: "text-purple-700",  dot: "bg-purple-400" },
  canada_job_bank:     { label: "Canada Job Bank",   bg: "bg-red-50",    text: "text-red-700",     dot: "bg-red-400" },
  nhs_jobs:            { label: "NHS Jobs",          bg: "bg-sky-50",    text: "text-sky-700",     dot: "bg-sky-400" },
  world_bank:          { label: "World Bank",        bg: "bg-amber-50",  text: "text-amber-700",   dot: "bg-amber-400" },
};

function formatSalary(min, max, currency) {
  const curr = currency || "USD";
  const fmt = (n) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: curr, maximumFractionDigits: 0 }).format(n);
  if (min && max) return `${fmt(min)} – ${fmt(max)}`;
  if (min) return `From ${fmt(min)}`;
  if (max) return `Up to ${fmt(max)}`;
  return null;
}

function postedDate(iso) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function stripHtml(html) {
  if (!html) return "";
  return html
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/?(p|li|h[1-6]|div|section|article)[^>]*>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ").replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/\s{2,}/g, " ")
    .trim();
}

// ─── Job Card (browse) ────────────────────────────────────────────────────────
function JobCard({ job, onClick }) {
  const meta  = SOURCE_META[job.source] || { label: job.source, bg: "bg-gray-50", text: "text-gray-600", dot: "bg-gray-300" };
  const salary = formatSalary(job.salary_min, job.salary_max, job.currency);
  const initials = (job.company || "?").slice(0, 2).toUpperCase();

  return (
    <div
      className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col gap-3 hover:shadow-md hover:border-purple-100 transition-all duration-200 cursor-pointer group"
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        {job.logo_url ? (
          <img
            src={job.logo_url}
            alt={job.company || ""}
            className="w-10 h-10 rounded-xl object-contain border border-gray-100 bg-white flex-shrink-0"
            onError={e => { e.target.style.display = "none"; }}
          />
        ) : (
          <div className="w-10 h-10 rounded-xl bg-[#ede9ff] flex items-center justify-center text-[#6c47ff] font-bold text-xs flex-shrink-0">
            {initials}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-[#1a0841] text-sm leading-snug line-clamp-2 group-hover:text-purple-700 transition-colors">
            {job.title}
          </h3>
          {job.company && <p className="text-xs text-purple-600 font-medium mt-0.5 truncate">{job.company}</p>}
        </div>
        <span className="shrink-0 text-gray-300 group-hover:text-purple-400 transition-colors mt-0.5">
          <MdOpenInNew size={16} />
        </span>
      </div>

      {/* Description snippet */}
      {job.description && (
        <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{stripHtml(job.description)}</p>
      )}

      {/* Badges */}
      <div className="flex flex-wrap gap-1.5 mt-auto">
        {job.location && (
          <span className="inline-flex items-center gap-1 text-xs bg-slate-50 text-slate-600 rounded-full px-2.5 py-0.5">
            <MdLocationOn size={11} /> {job.location}
          </span>
        )}
        {job.contract_type && (
          <span className="inline-flex items-center gap-1 text-xs bg-indigo-50 text-indigo-700 rounded-full px-2.5 py-0.5">
            <MdWork size={11} /> {job.contract_type.split(",")[0]}
          </span>
        )}
        {salary && (
          <span className="inline-flex items-center gap-1 text-xs bg-green-50 text-green-700 rounded-full px-2.5 py-0.5">
            <MdAttachMoney size={11} /> {salary}
          </span>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-1 border-t border-gray-50">
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${meta.bg} ${meta.text}`}>
          {meta.label}
        </span>
        {job.posted_at && (
          <span className="text-[10px] text-gray-400">{postedDate(job.posted_at)}</span>
        )}
      </div>
    </div>
  );
}

// ─── Job Detail Modal ─────────────────────────────────────────────────────────
function JobModal({ job, onClose }) {
  if (!job) return null;
  const meta   = SOURCE_META[job.source] || { label: job.source, bg: "bg-gray-50", text: "text-gray-600" };
  const salary = formatSalary(job.salary_min, job.salary_max, job.currency);
  const initials = (job.company || "?").slice(0, 2).toUpperCase();
  let tags = [];
  try { tags = JSON.parse(job.tags || "[]"); } catch { tags = []; }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Sticky header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-start justify-between gap-4 rounded-t-2xl z-10">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {job.logo_url ? (
              <img src={job.logo_url} alt="" className="w-10 h-10 rounded-xl object-contain border border-gray-100" />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-[#ede9ff] flex items-center justify-center text-[#6c47ff] font-bold text-xs flex-shrink-0">
                {initials}
              </div>
            )}
            <div className="min-w-0">
              <h2 className="font-bold text-[#1a0841] text-base leading-snug">{job.title}</h2>
              {job.company && <p className="text-sm text-purple-600 font-medium mt-0.5">{job.company}</p>}
            </div>
          </div>
          <button onClick={onClose} className="shrink-0 p-1.5 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
            <MdClose size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 flex flex-col gap-5">
          {/* Badges */}
          <div className="flex flex-wrap gap-2">
            <span className={`inline-flex items-center gap-1 text-xs rounded-full px-3 py-1 font-medium ${meta.bg} ${meta.text}`}>
              {meta.label}
            </span>
            {job.location && (
              <span className="inline-flex items-center gap-1 text-xs bg-slate-50 text-slate-700 rounded-full px-3 py-1 font-medium">
                <MdLocationOn size={12} /> {job.location}
              </span>
            )}
            {job.contract_type && (
              <span className="inline-flex items-center gap-1 text-xs bg-indigo-50 text-indigo-700 rounded-full px-3 py-1 font-medium">
                <MdWork size={12} /> {job.contract_type.split(",")[0]}
              </span>
            )}
            {salary && (
              <span className="inline-flex items-center gap-1 text-xs bg-green-50 text-green-700 rounded-full px-3 py-1 font-medium">
                <MdAttachMoney size={12} /> {salary}
              </span>
            )}
          </div>

          {/* Description */}
          {job.description && (
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">About this role</h3>
              <p className="text-sm text-gray-700 leading-relaxed">{stripHtml(job.description)}</p>
            </div>
          )}

          {/* Tags */}
          {tags.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Skills / Tags</h3>
              <div className="flex flex-wrap gap-1.5">
                {tags.map((t, i) => (
                  <span key={i} className="text-xs bg-orange-50 text-orange-700 rounded-full px-2.5 py-0.5">{t}</span>
                ))}
              </div>
            </div>
          )}

          {/* Meta */}
          <div className="text-xs text-gray-400">
            {job.posted_at && <span>Posted: {postedDate(job.posted_at)}</span>}
          </div>
        </div>

        {/* Sticky footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 rounded-b-2xl">
          <a
            href={job.apply_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-sm hover:from-purple-700 hover:to-indigo-700 transition-all"
          >
            Apply Now <MdOpenInNew size={16} />
          </a>
        </div>
      </div>
    </div>
  );
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────
function JobSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 h-44 animate-pulse">
      <div className="flex gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-gray-100 flex-shrink-0" />
        <div className="flex-1">
          <div className="h-3.5 bg-gray-100 rounded mb-2 w-4/5" />
          <div className="h-3 bg-gray-100 rounded w-2/5" />
        </div>
      </div>
      <div className="h-3 bg-gray-100 rounded mb-1.5 w-full" />
      <div className="h-3 bg-gray-100 rounded w-3/5 mb-4" />
      <div className="flex gap-2">
        <div className="h-5 w-20 bg-gray-100 rounded-full" />
        <div className="h-5 w-16 bg-gray-100 rounded-full" />
      </div>
    </div>
  );
}

// ─── Browse All Tab ───────────────────────────────────────────────────────────
function BrowseTab() {
  const [jobs, setJobs]           = useState([]);
  const [total, setTotal]         = useState(0);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);
  const [search, setSearch]       = useState("");
  const [sourceFilter, setSource] = useState("");
  const [locationFilter, setLoc]  = useState("");
  const [offset, setOffset]       = useState(0);
  const [selected, setSelected]   = useState(null);

  const [sourcesStatus, setSourcesStatus] = useState([]);

  useEffect(() => {
    fetch(`${API}/api/jobs/sources/status`).then(r => r.ok ? r.json() : null).then(d => { if (Array.isArray(d)) setSourcesStatus(d); }).catch(() => {});
  }, []);

  const fetchJobs = useCallback(async (reset = false) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ limit: LIMIT, offset: reset ? 0 : offset });
      if (search)         params.set("search",        search);
      if (sourceFilter)   params.set("source",        sourceFilter);
      if (locationFilter) params.set("location",      locationFilter);
      const res = await fetch(`${API}/api/jobs?${params}`);
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();
      setTotal(data.total);
      setJobs(prev => reset ? data.items : [...prev, ...data.items]);
      if (!reset) setOffset(o => o + LIMIT);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [search, sourceFilter, locationFilter, offset]);

  useEffect(() => {
    setOffset(0);
    setJobs([]);
    fetchJobs(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, sourceFilter, locationFilter]);

  const hasFilters = search || sourceFilter || locationFilter;

  return (
    <div className="flex flex-col gap-5">

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search jobs, companies, skills..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 bg-white"
          />
        </div>

        <div className="relative">
          <MdFilterList className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <select
            value={sourceFilter}
            onChange={e => setSource(e.target.value)}
            className="pl-8 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 bg-white appearance-none cursor-pointer"
          >
            <option value="">All Sources</option>
            {sourcesStatus.map(s => {
              const label = SOURCE_META[s.source]?.label || s.source;
              return <option key={s.source} value={s.source}>{label}</option>;
            })}
          </select>
        </div>

        <input
          type="text"
          placeholder="Location..."
          value={locationFilter}
          onChange={e => setLoc(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 bg-white w-full sm:w-36"
        />

        {hasFilters && (
          <button
            onClick={() => { setSearch(""); setSource(""); setLoc(""); }}
            className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1.5 whitespace-nowrap"
          >
            <MdClose size={14} /> Clear
          </button>
        )}
      </div>

      {/* Count */}
      {!loading && !error && (
        <p className="text-xs text-gray-400">{total.toLocaleString()} jobs found</p>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-600">
          Could not connect to the jobs API.
          <span className="text-xs text-red-400 mt-1 block">{error}</span>
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {jobs.map(job => (
          <JobCard key={job.id} job={job} onClick={() => setSelected(job)} />
        ))}
      </div>

      {/* Skeleton */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <JobSkeleton key={i} />)}
        </div>
      )}

      {/* Load more */}
      {!loading && jobs.length < total && (
        <div className="flex justify-center pt-2">
          <button
            onClick={() => { setOffset(jobs.length); fetchJobs(false); }}
            className="px-6 py-2.5 rounded-xl bg-[#1a0841] text-white text-sm font-semibold hover:bg-[#2c1a4e] transition-colors"
          >
            Load more
          </button>
        </div>
      )}

      {!loading && jobs.length === 0 && !error && (
        <div className="text-center text-gray-400 py-16 text-sm">
          No jobs found. Try adjusting your filters.
        </div>
      )}

      {selected && <JobModal job={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

// ─── Find My Match Tab ────────────────────────────────────────────────────────
function MatchTab({ result, loading, error, profile, onRefresh }) {
  const [selected, setSelected] = useState(null);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 flex flex-col items-center gap-4 text-center">
          <div className="w-10 h-10 border-4 border-purple-400 border-t-transparent rounded-full animate-spin" />
          <div>
            <p className="font-semibold text-[#1a0841] text-sm">Matching jobs to your profile…</p>
            <p className="text-xs text-gray-400 mt-1">Scanning visa-sponsored opportunities across all sources</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-sm text-red-600">
          <p className="font-semibold mb-1">Could not load job matches</p>
          <p className="text-xs text-red-400">{error}</p>
          <button
            onClick={onRefresh}
            className="mt-3 px-4 py-2 rounded-xl bg-red-100 text-red-700 text-xs font-semibold hover:bg-red-200 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!result) return null;

  const suggestions   = result.suggestions || [];
  const prof          = result.profile || profile || {};
  const countries     = Array.isArray(prof.countries) ? prof.countries : [];
  const field         = prof.field || "";
  const degreeLevel   = prof.degreeLevel || "";

  // Generate a per-card match reason from profile data
  function matchReason(job) {
    const loc  = (job.location || "").toLowerCase();
    const text = `${job.title} ${job.description || ""} ${job.tags || ""}`.toLowerCase();
    const matchedCountry = countries.find(c => loc.includes(c.toLowerCase()));
    if (matchedCountry) return `Located in ${matchedCountry}, one of your target countries`;
    if (field && text.includes(field.toLowerCase().split(" ")[0]))
      return `Relevant to your field of interest: ${field}`;
    return "Visa-sponsored opportunity matching your profile";
  }

  const profileStats = [
    { label: "Target Countries", value: countries.length ? countries.join(", ") : null, icon: "🌍" },
    { label: "Field of Interest", value: field || null, icon: "💼" },
    { label: "Education Level",  value: degreeLevel || null, icon: "🎓" },
  ].filter(s => s.value);

  return (
    <div className="flex flex-col xl:flex-row gap-6 items-start">

      {/* ══════════ LEFT SIDEBAR ══════════ */}
      <div className="w-full xl:w-80 xl:sticky xl:top-6 flex-shrink-0 flex flex-col gap-4">

        {/* Profile card */}
        <div className="bg-white/70 backdrop-blur rounded-2xl border border-purple-100 p-4 shadow-sm">
          <div className="flex items-start justify-between gap-2 mb-3">
            <div>
              <h3 className="font-bold text-[#1a0841] text-sm leading-snug">
                {suggestions.length} job{suggestions.length !== 1 ? "s" : ""} matched for{" "}
                <span className="text-purple-600">{prof.name || "you"}</span>
              </h3>
              <p className="text-[11px] text-gray-400 mt-0.5">Ranked by location & field relevance</p>
            </div>
            <button
              onClick={onRefresh}
              className="shrink-0 px-2.5 py-1.5 rounded-xl bg-purple-50 border border-purple-100 text-[11px] font-semibold text-purple-600 hover:bg-purple-100 transition-colors"
            >
              Refresh
            </button>
          </div>

          {profileStats.length > 0 && (
            <div className="flex flex-col gap-1.5">
              {profileStats.map((s, i) => (
                <div key={i} className="flex items-center gap-2 bg-purple-50/60 rounded-xl px-3 py-1.5">
                  <span className="text-sm">{s.icon}</span>
                  <div className="min-w-0">
                    <p className="text-[10px] text-purple-400 font-semibold uppercase tracking-wide">{s.label}</p>
                    <p className="text-xs font-semibold text-[#1a0841] truncate">{s.value}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* AI summary card */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1a0841] to-[#3b1fa8] p-5 text-white shadow-lg">
          <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full bg-white/5" />
          <div className="absolute -bottom-4 -left-4 w-20 h-20 rounded-full bg-white/5" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-2.5">
              <div className="w-6 h-6 rounded-lg bg-purple-400/30 flex items-center justify-center">
                <MdAutoAwesome size={13} className="text-purple-200" />
              </div>
              <span className="text-[10px] font-bold text-purple-300 uppercase tracking-widest">Smart Matching</span>
            </div>
            <p className="text-xs leading-relaxed text-white/85">
              {suggestions.length > 0
                ? `We found ${suggestions.length} visa-sponsored ${suggestions.length === 1 ? "opportunity" : "opportunities"} matched to your profile${countries.length ? ` in ${countries.slice(0, 2).join(" & ")}` : ""}${field ? ` for ${field} roles` : ""}. Click any card to view full details and apply.`
                : "Complete your profile with target countries and field of interest to get better job matches."}
            </p>
          </div>
        </div>

        {/* Source breakdown */}
        {suggestions.length > 0 && (() => {
          const counts = suggestions.reduce((acc, j) => {
            acc[j.source] = (acc[j.source] || 0) + 1;
            return acc;
          }, {});
          return (
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(counts).map(([src, cnt]) => {
                const m = SOURCE_META[src];
                return (
                  <div key={src} className={`rounded-xl border p-3 text-center ${m?.bg || "bg-gray-50"} border-transparent`}>
                    <p className={`text-xl font-bold ${m?.text || "text-gray-600"}`}>{cnt}</p>
                    <p className={`text-[10px] font-semibold uppercase tracking-wide mt-0.5 ${m?.text || "text-gray-500"}`}>{m?.label || src}</p>
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>

      {/* ══════════ RIGHT: MATCH CARDS ══════════ */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4">
        {suggestions.length === 0 ? (
          <div className="col-span-2 bg-white rounded-2xl border border-gray-100 p-10 text-center text-sm text-gray-400">
            <MdWork size={40} className="mx-auto mb-3 text-gray-200" />
            <p>No matches found. Try adding target countries to your profile, or use Browse All to explore all jobs.</p>
          </div>
        ) : (
          suggestions.map((job, i) => {
            const meta   = SOURCE_META[job.source] || { label: job.source, bg: "bg-gray-50", text: "text-gray-600" };
            const salary = formatSalary(job.salary_min, job.salary_max, job.currency);
            const isTop  = i === 0;
            const reason = matchReason(job);

            const cardBg = isTop
              ? "bg-gradient-to-br from-white to-violet-50/60 border-2 border-purple-300 shadow-lg shadow-purple-100"
              : i % 3 === 0
              ? "bg-gradient-to-br from-white to-indigo-50/40 border border-indigo-100/60 shadow-sm"
              : i % 3 === 1
              ? "bg-gradient-to-br from-white to-purple-50/40 border border-purple-100/60 shadow-sm"
              : "bg-gradient-to-br from-white to-blue-50/30 border border-blue-100/60 shadow-sm";

            return (
              <div
                key={job.id}
                className={`relative rounded-2xl flex flex-col overflow-hidden transition-all duration-200 cursor-pointer hover:shadow-md hover:-translate-y-0.5 ${cardBg}`}
                onClick={() => setSelected(job)}
              >
                {/* Top pick badge */}
                {isTop && (
                  <div className="absolute top-2.5 right-2.5 z-10">
                    <span className="inline-flex items-center gap-1 text-[9px] font-bold bg-gradient-to-r from-yellow-400 to-orange-400 text-white rounded-full px-2 py-0.5 shadow">
                      ★ TOP MATCH
                    </span>
                  </div>
                )}

                {/* Source banner */}
                <div className={`px-4 py-1 text-[11px] font-bold flex items-center gap-1 ${meta.bg} ${meta.text}`}>
                  <MdBusiness size={12} /> {meta.label}
                </div>

                <div className="p-4 flex flex-col gap-2.5 flex-1">
                  {/* Rank + title */}
                  <div className="flex items-start gap-2.5">
                    <div className={`shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold text-white shadow-sm
                      ${isTop ? "bg-gradient-to-br from-yellow-400 to-orange-500" : "bg-gradient-to-br from-purple-500 to-indigo-600"}`}>
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-[#1a0841] text-xs leading-snug pr-5 line-clamp-2">{job.title}</h4>
                      {job.company && <p className="text-[10px] text-purple-600 font-semibold mt-0.5 truncate">{job.company}</p>}
                    </div>
                  </div>

                  {/* Location */}
                  {job.location && (
                    <div className="flex gap-1 flex-wrap">
                      <span className="inline-flex items-center gap-0.5 text-[10px] bg-slate-100 text-slate-600 rounded-full px-2 py-0.5">
                        <MdLocationOn size={9} /> {job.location}
                      </span>
                    </div>
                  )}

                  {/* Match reason */}
                  <div className="bg-white/70 rounded-xl px-3 py-2 flex-1">
                    <p className="text-[11px] text-gray-600 leading-relaxed italic line-clamp-3">
                      &ldquo;{reason}&rdquo;
                    </p>
                  </div>

                  {/* Salary + contract */}
                  {(salary || job.contract_type) && (
                    <div className="flex flex-wrap gap-1">
                      {job.contract_type && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full px-2 py-0.5">
                          <MdWork size={9} /> {job.contract_type.split(",")[0]}
                        </span>
                      )}
                      {salary && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] bg-green-50 text-green-700 border border-green-100 rounded-full px-2 py-0.5">
                          <MdAttachMoney size={9} /> {salary}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center gap-1.5 pt-2 border-t border-black/5 flex-wrap">
                    {job.posted_at && (
                      <span className="text-[10px] text-gray-400">{postedDate(job.posted_at)}</span>
                    )}
                    <a
                      href={job.apply_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}
                      className="ml-auto inline-flex items-center gap-0.5 text-[10px] font-bold text-purple-600 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 rounded-full px-2.5 py-1 transition-colors"
                    >
                      Apply <MdOpenInNew size={10} />
                    </a>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {selected && <JobModal job={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function JobsPage() {
  const [tab, setTab] = useState(() => sessionStorage.getItem("jobs_tab") || "browse");

  // Match state hoisted — survives tab switches without re-running the API call
  const [matchTriggered, setMatchTriggered] = useState(
    () => sessionStorage.getItem("jobs_tab") === "match"
  );
  const [matchRun, setMatchRun] = useState(0);
  const [matchResult, setMatchResult] = useState(() => {
    try { return JSON.parse(localStorage.getItem("jobs_match") || "null")?.result ?? null; }
    catch { return null; }
  });
  const [matchProfile, setMatchProfile] = useState(() => {
    try { return JSON.parse(localStorage.getItem("jobs_match") || "null")?.profile ?? null; }
    catch { return null; }
  });
  const [matchLoading, setMatchLoading] = useState(false);
  const [matchError, setMatchError]   = useState(null);

  const matchResultRef = useRef(matchResult);
  matchResultRef.current = matchResult;

  // Fetch runs only when the user first opens "Find My Match" or clicks Refresh
  useEffect(() => {
    if (!matchTriggered) return;
    if (matchResultRef.current !== null && matchRun === 0) return;

    let cancelled = false;

    async function fetchAndMatch() {
      // Cache check on first load
      if (matchRun === 0) {
        try {
          const cached = JSON.parse(localStorage.getItem("jobs_match") || "null");
          if (cached?.result && !cancelled) {
            setMatchProfile(cached.profile ?? null);
            setMatchResult(cached.result);
            return;
          }
        } catch {}
      }

      if (!cancelled) { setMatchLoading(true); setMatchError(null); }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;

        let name        = user?.user_metadata?.name || "Student";
        let countries   = [];
        let field       = "";
        let degreeLevel = "";

        if (user) {
          const { data: roleData } = await supabase
            .from("user_roles")
            .select("name, degree_level, target_countries, application_report")
            .eq("user_id", user.id)
            .single();

          if (roleData?.name)         name = roleData.name;
          if (roleData?.degree_level) degreeLevel = roleData.degree_level;

          countries = Array.isArray(roleData?.target_countries)
            ? roleData.target_countries.filter(Boolean)
            : typeof roleData?.target_countries === "string" && roleData.target_countries
              ? [roleData.target_countries]
              : [];

          const report = roleData?.application_report;
          const detectedField =
            report?.form?.academicGoals ||
            report?.form?.field_of_study ||
            user.user_metadata?.field_of_study || "";
          if (detectedField) field = detectedField;
        }

        const profileData = { name, countries, field, degreeLevel };

        const params = new URLSearchParams({ limit: 10 });
        if (countries.length) params.set("countries", countries.join(","));
        if (field)            params.set("field",     field);

        const res = await fetch(`${API}/api/jobs/suggest?${params}`);
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        const data = await res.json();

        if (cancelled) return;

        const result = { suggestions: data.suggestions || [], profile: profileData };
        try { localStorage.setItem("jobs_match", JSON.stringify({ result, profile: profileData })); } catch {}

        setMatchProfile(profileData);
        setMatchResult(result);
      } catch (e) {
        if (!cancelled) setMatchError(e.message);
      } finally {
        if (!cancelled) setMatchLoading(false);
      }
    }

    fetchAndMatch();
    return () => { cancelled = true; };
  }, [matchTriggered, matchRun]);

  const handleMatchTab = () => {
    sessionStorage.setItem("jobs_tab", "match");
    setTab("match");
    setMatchTriggered(true);
  };

  const handleBrowseTab = () => {
    sessionStorage.setItem("jobs_tab", "browse");
    setTab("browse");
  };

  const refreshMatch = () => {
    try { localStorage.removeItem("jobs_match"); } catch {}
    setMatchResult(null);
    setMatchError(null);
    setMatchRun(r => r + 1);
  };

  return (
    <div
      className="min-h-screen"
      style={{
        fontFamily: "Montserrat, Inter, Hedvig Letters Sans, sans-serif",
        fontWeight: 400,
        background: "linear-gradient(135deg, #f0ebff 0%, #ede9fe 30%, #e8f0fe 70%, #f0f4ff 100%)",
      }}
    >
      <div className="ml-0 lg:ml-16 px-4 sm:px-6 lg:px-8 py-6">

        {/* Header + tab pills */}
        <div className="mb-6 flex items-end justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#1a0841]">Jobs</h1>
            <p className="text-sm text-gray-500 mt-0.5">Browse visa-sponsored jobs or find matches for your profile.</p>
          </div>
          <div className="flex gap-1 bg-white/70 backdrop-blur rounded-2xl p-1 shadow-sm border border-purple-100">
            <button
              onClick={handleBrowseTab}
              className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all ${tab === "browse" ? "bg-[#1a0841] text-white shadow" : "text-gray-500 hover:text-[#1a0841]"}`}
            >
              Browse All
            </button>
            <button
              onClick={handleMatchTab}
              className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-1.5 ${tab === "match" ? "bg-[#1a0841] text-white shadow" : "text-gray-500 hover:text-[#1a0841]"}`}
            >
              <MdAutoAwesome size={15} /> Find My Match
            </button>
          </div>
        </div>

        {tab === "browse" ? (
          <BrowseTab />
        ) : (
          <MatchTab
            result={matchResult}
            loading={matchLoading}
            error={matchError}
            profile={matchProfile}
            onRefresh={refreshMatch}
          />
        )}
      </div>
    </div>
  );
}
