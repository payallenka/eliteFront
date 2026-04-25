import React, { useState, useEffect, useCallback, useRef } from "react";
import { MdSearch, MdFilterList, MdOpenInNew, MdSchool, MdAutoAwesome, MdCalendarToday, MdAttachMoney, MdClose, MdPublic, MdLabel, MdPeople } from "react-icons/md";
import { supabase } from "../supabaseClient";

const API = import.meta.env.VITE_SCHOLARSHIP_API_URL || "http://localhost:8000";

const DEGREE_LEVELS = ["", "undergraduate", "masters", "phd", "postgraduate"];
const CURRENT_LEVELS = ["bachelor", "masters", "phd", "high_school"];

function formatDeadline(deadline) {
  if (!deadline) return "Open / Not listed";
  return new Date(deadline).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}


// ─── Detail Modal ─────────────────────────────────────────────────────────────
function ScholarshipModal({ s, onClose }) {
  if (!s) return null;

  const levels = Array.isArray(s.degree_levels) ? s.degree_levels : [];
  const countries = Array.isArray(s.host_countries) ? s.host_countries : [];
  const fields = Array.isArray(s.fields_of_study) ? s.fields_of_study : [];
  const nationalities = Array.isArray(s.eligible_nationalities) ? s.eligible_nationalities : [];
  const tags = Array.isArray(s.tags) ? s.tags : [];
  const amount = s.amount || s.funding_type || null;
  const applyUrl = s.source_url || s.url;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-start justify-between gap-4 rounded-t-2xl z-10">
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-[#1a0841] text-base leading-snug">{s.title}</h2>
            {s.organization && <p className="text-sm text-purple-600 font-medium mt-0.5">{s.organization}</p>}
          </div>
          <button onClick={onClose} className="shrink-0 p-1.5 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
            <MdClose size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 flex flex-col gap-5">
          {/* Badges row */}
          <div className="flex flex-wrap gap-2">
            {levels.length > 0 && (
              <span className="inline-flex items-center gap-1 text-xs bg-purple-50 text-purple-700 rounded-full px-3 py-1 font-medium">
                <MdSchool size={13} /> {levels.join(", ")}
              </span>
            )}
            <span className="inline-flex items-center gap-1 text-xs bg-indigo-50 text-indigo-700 rounded-full px-3 py-1 font-medium">
              <MdCalendarToday size={13} /> {formatDeadline(s.deadline)}
            </span>
            {amount && (
              <span className="inline-flex items-center gap-1 text-xs bg-green-50 text-green-700 rounded-full px-3 py-1 font-medium">
                <MdAttachMoney size={13} /> {String(amount).slice(0, 60)}
              </span>
            )}
          </div>

          {/* Description */}
          {s.description && (
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">About</h3>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{s.description}</p>
            </div>
          )}

          {/* Details grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {countries.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                  <MdPublic size={13} /> Host Countries
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {countries.map(c => (
                    <span key={c} className="text-xs bg-gray-100 text-gray-700 rounded-full px-2.5 py-0.5">{c}</span>
                  ))}
                </div>
              </div>
            )}
            {nationalities.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                  <MdPeople size={13} /> Eligible Nationalities
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {nationalities.slice(0, 10).map(n => (
                    <span key={n} className="text-xs bg-gray-100 text-gray-700 rounded-full px-2.5 py-0.5">{n}</span>
                  ))}
                  {nationalities.length > 10 && (
                    <span className="text-xs text-gray-400">+{nationalities.length - 10} more</span>
                  )}
                </div>
              </div>
            )}
            {fields.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Fields of Study</h3>
                <div className="flex flex-wrap gap-1.5">
                  {fields.map(f => (
                    <span key={f} className="text-xs bg-blue-50 text-blue-700 rounded-full px-2.5 py-0.5">{f}</span>
                  ))}
                </div>
              </div>
            )}
            {tags.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                  <MdLabel size={13} /> Tags
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {tags.map(t => (
                    <span key={t} className="text-xs bg-orange-50 text-orange-700 rounded-full px-2.5 py-0.5">{t}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Source */}
          <div className="text-xs text-gray-400 flex items-center gap-1">
            Source: <span className="uppercase tracking-wide">{s.source_site}</span>
          </div>
        </div>

        {/* Footer CTA */}
        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 rounded-b-2xl">
          {applyUrl ? (
            <a
              href={applyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-sm hover:from-purple-700 hover:to-indigo-700 transition-all"
            >
              Apply Now <MdOpenInNew size={16} />
            </a>
          ) : (
            <p className="text-center text-xs text-gray-400">No application link available</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Scholarship Card ────────────────────────────────────────────────────────
function ScholarshipCard({ s, onClick }) {
  const levels = Array.isArray(s.degree_levels)
    ? s.degree_levels.join(", ")
    : s.degree_levels || "Any";
  const deadline = formatDeadline(s.deadline);
  const amount = s.amount || s.funding_type || null;

  return (
    <div
      className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col gap-3 hover:shadow-md hover:border-purple-100 transition-all duration-200 cursor-pointer group"
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-[#1a0841] text-sm leading-snug line-clamp-2 group-hover:text-purple-700 transition-colors">{s.title}</h3>
          {s.organization && <p className="text-xs text-purple-600 mt-0.5 font-medium truncate">{s.organization}</p>}
        </div>
        <span className="shrink-0 text-gray-300 group-hover:text-purple-400 transition-colors mt-0.5">
          <MdOpenInNew size={16} />
        </span>
      </div>

      {s.description && (
        <p className="text-xs text-gray-500 line-clamp-3 leading-relaxed">{s.description}</p>
      )}

      <div className="flex flex-wrap gap-1.5 mt-auto">
        <span className="inline-flex items-center gap-1 text-xs bg-purple-50 text-purple-700 rounded-full px-2.5 py-0.5">
          <MdSchool size={12} /> {levels}
        </span>
        <span className="inline-flex items-center gap-1 text-xs bg-indigo-50 text-indigo-700 rounded-full px-2.5 py-0.5">
          <MdCalendarToday size={12} /> {deadline}
        </span>
        {amount && (
          <span className="inline-flex items-center gap-1 text-xs bg-green-50 text-green-700 rounded-full px-2.5 py-0.5">
            <MdAttachMoney size={12} /> {String(amount).slice(0, 40)}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between pt-1 border-t border-gray-50">
        <span className="text-[10px] text-gray-400 uppercase tracking-wide">{s.source_site}</span>
        {Array.isArray(s.host_countries) && s.host_countries.length > 0 && (
          <span className="text-[10px] text-gray-400">{s.host_countries.slice(0, 2).join(", ")}</span>
        )}
      </div>
    </div>
  );
}

// ─── Browse All Tab ──────────────────────────────────────────────────────────
function BrowseTab() {
  const [scholarships, setScholarships] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [degreeLevel, setDegreeLevel] = useState("");
  const [hostCountry, setHostCountry] = useState("");
  const [sourceSite, setSourceSite] = useState("");
  const [sites, setSites] = useState([]);
  const [offset, setOffset] = useState(0);
  const [selected, setSelected] = useState(null);
  const LIMIT = 24;

  useEffect(() => {
    fetch(`${API}/api/sites`, { headers: { "ngrok-skip-browser-warning": "true" } })
      .then(r => r.json())
      .then(data => setSites(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  const fetchScholarships = useCallback(async (reset = false) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ limit: LIMIT, offset: reset ? 0 : offset, order: "desc" });
      if (search) params.set("search", search);
      if (degreeLevel) params.set("degree_level", degreeLevel);
      if (hostCountry) params.set("host_country", hostCountry);
      if (sourceSite) params.set("source_site", sourceSite);

      const res = await fetch(`${API}/api/scholarships?${params}`, {
        headers: { "ngrok-skip-browser-warning": "true" }
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();

      setTotal(data.total);
      setScholarships(prev => reset ? data.items : [...prev, ...data.items]);
      if (!reset) setOffset(o => o + LIMIT);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [search, degreeLevel, hostCountry, sourceSite, offset]);

  useEffect(() => {
    setOffset(0);
    setScholarships([]);
    fetchScholarships(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, degreeLevel, hostCountry, sourceSite]);

  const handleLoadMore = () => {
    setOffset(scholarships.length);
    fetchScholarships(false);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search scholarships, organizations..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 bg-white"
          />
        </div>
        <div className="relative">
          <MdFilterList className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <select
            value={degreeLevel}
            onChange={e => setDegreeLevel(e.target.value)}
            className="pl-8 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 bg-white appearance-none cursor-pointer"
          >
            <option value="">All Levels</option>
            {DEGREE_LEVELS.filter(Boolean).map(l => (
              <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>
            ))}
          </select>
        </div>
        <input
          type="text"
          placeholder="Host country..."
          value={hostCountry}
          onChange={e => setHostCountry(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 bg-white w-full sm:w-40"
        />
        <select
          value={sourceSite}
          onChange={e => setSourceSite(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 bg-white appearance-none cursor-pointer w-full sm:w-auto"
        >
          <option value="">All Sources</option>
          {sites.map(s => (
            <option key={s.name} value={s.name.toLowerCase()}>{s.name} ({s.count.toLocaleString()})</option>
          ))}
        </select>
      </div>

      {/* Count */}
      {!loading && !error && (
        <p className="text-xs text-gray-400">{total.toLocaleString()} scholarships found</p>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-600">
          Could not connect to the scholarship API. Make sure the backend is running at <code className="font-mono">{API}</code>.
          <br /><span className="text-xs text-red-400 mt-1 block">{error}</span>
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {scholarships.map(s => (
          <ScholarshipCard key={s.id} s={s} onClick={() => setSelected(s)} />
        ))}
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 h-44 animate-pulse">
              <div className="h-4 bg-gray-100 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-1/2 mb-4" />
              <div className="h-3 bg-gray-100 rounded w-full mb-2" />
              <div className="h-3 bg-gray-100 rounded w-5/6" />
            </div>
          ))}
        </div>
      )}

      {/* Load more */}
      {!loading && scholarships.length < total && (
        <div className="flex justify-center pt-2">
          <button
            onClick={handleLoadMore}
            className="px-6 py-2.5 rounded-xl bg-[#1a0841] text-white text-sm font-semibold hover:bg-[#2c1a4e] transition-colors"
          >
            Load more
          </button>
        </div>
      )}

      {!loading && scholarships.length === 0 && !error && (
        <div className="text-center text-gray-400 py-16 text-sm">No scholarships found. Try adjusting your filters.</div>
      )}

      {/* Detail modal */}
      {selected && <ScholarshipModal s={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

// ─── Find My Match Tab ───────────────────────────────────────────────────────
// Pure display component — state is hoisted to ScholarshipsPage so results
// survive tab switches without re-running the Groq API call.
function MatchTab({ result, loading, error, profileName, onRefresh }) {
  const [selected, setSelected] = useState(null);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 flex flex-col items-center gap-4 text-center">
          <div className="w-10 h-10 border-4 border-purple-400 border-t-transparent rounded-full animate-spin" />
          <div>
            <p className="font-semibold text-[#1a0841] text-sm">Analysing your profile…</p>
            <p className="text-xs text-gray-400 mt-1">Our AI advisor is finding your best scholarship matches</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-sm text-red-600">
          <p className="font-semibold mb-1">Could not load your matches</p>
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

  const profile = result?.profile || {};
  const budgetLabel = profile.budget_usd == null ? null
    : profile.budget_usd < 3000 ? "Needs full funding"
    : profile.budget_usd < 15000 ? "Partial OK"
    : "Flexible budget";

  const profileStats = [
    { label: "Nationality", value: profile.nationality, icon: "🌍" },
    { label: "Target Level", value: profile.target_level ? profile.target_level.charAt(0).toUpperCase() + profile.target_level.slice(1) : null, icon: "🎓" },
    { label: "Field", value: profile.field !== "any" ? profile.field : null, icon: "📚" },
    { label: "Languages", value: profile.languages?.length > 0 ? profile.languages.slice(0, 2).join(", ") : null, icon: "🗣️" },
    { label: "Budget", value: budgetLabel, icon: "💰" },
  ].filter(s => s.value);

  return (
    <div className="flex flex-col xl:flex-row gap-6 items-start">

      {/* ══════════ LEFT SIDEBAR (sticky on xl) ══════════ */}
      <div className="w-full xl:w-80 xl:sticky xl:top-6 flex-shrink-0 flex flex-col gap-4">

        {/* Header + refresh */}
        <div className="bg-white/70 backdrop-blur rounded-2xl border border-purple-100 p-4 shadow-sm">
          <div className="flex items-start justify-between gap-2 mb-3">
            <div>
              <h3 className="font-bold text-[#1a0841] text-sm leading-snug">
                Top {result?.matches?.length || 0} for <span className="text-purple-600">{profileName}</span>
              </h3>
              <p className="text-[11px] text-gray-400 mt-0.5">{result?.total_candidates} scholarships screened</p>
            </div>
            <button
              onClick={onRefresh}
              className="shrink-0 px-2.5 py-1.5 rounded-xl bg-purple-50 border border-purple-100 text-[11px] font-semibold text-purple-600 hover:bg-purple-100 transition-colors"
            >
              Refresh
            </button>
          </div>

          {/* Profile stat pills */}
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

        {/* AI Advisor card */}
        {result?.summary && (
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1a0841] to-[#3b1fa8] p-5 text-white shadow-lg">
            <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full bg-white/5" />
            <div className="absolute -bottom-4 -left-4 w-20 h-20 rounded-full bg-white/5" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-2.5">
                <div className="w-6 h-6 rounded-lg bg-purple-400/30 flex items-center justify-center">
                  <MdAutoAwesome size={13} className="text-purple-200" />
                </div>
                <span className="text-[10px] font-bold text-purple-300 uppercase tracking-widest">AI Advisor</span>
              </div>
              <p className="text-xs leading-relaxed text-white/85">{result.summary}</p>
            </div>
          </div>
        )}

        {/* Match count breakdown */}
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "Fully Funded", count: (result?.matches || []).filter(m => m.funding_coverage === "full").length, cls: "bg-emerald-50 border-emerald-100 text-emerald-700" },
            { label: "Partial", count: (result?.matches || []).filter(m => m.funding_coverage === "partial").length, cls: "bg-amber-50 border-amber-100 text-amber-700" },
          ].map(({ label, count, cls }) => (
            <div key={label} className={`rounded-xl border p-3 text-center ${cls}`}>
              <p className="text-xl font-bold">{count}</p>
              <p className="text-[10px] font-semibold uppercase tracking-wide mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ══════════ RIGHT: CARDS GRID ══════════ */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4">
        {(result?.matches || []).map((match, i) => {
          const s = match.scholarship || {};
          const deadline = formatDeadline(s.deadline);
          const daysLeft = s.deadline ? Math.ceil((new Date(s.deadline) - new Date()) / (24 * 3600 * 1000)) : null;
          const isUrgent = daysLeft !== null && daysLeft < 60;
          const isSoon = daysLeft !== null && daysLeft < 90;
          const deadlineCls = !s.deadline ? "text-gray-400 bg-gray-50" : isUrgent ? "text-red-600 bg-red-50 font-bold" : isSoon ? "text-amber-700 bg-amber-50" : "text-indigo-700 bg-indigo-50";
          const levels = Array.isArray(s.degree_levels) ? s.degree_levels.join(", ") : s.degree_levels || "Any";
          const hostCountries = Array.isArray(s.host_countries) ? s.host_countries : [];
          const coverage = match.funding_coverage;
          const isTopPick = match.rank === 1;

          const fundingBanner = coverage === "full"
            ? { label: "Fully Funded", cls: "bg-emerald-500 text-white" }
            : coverage === "partial"
            ? { label: "Partial Funding", cls: "bg-amber-400 text-white" }
            : s.amount
            ? { label: String(s.amount).slice(0, 28), cls: "bg-indigo-500 text-white" }
            : null;

          const cardBg = isTopPick
            ? "bg-gradient-to-br from-white to-violet-50/60 border-2 border-purple-300 shadow-lg shadow-purple-100"
            : i % 3 === 0
            ? "bg-gradient-to-br from-white to-indigo-50/40 border border-indigo-100/60 shadow-sm"
            : i % 3 === 1
            ? "bg-gradient-to-br from-white to-purple-50/40 border border-purple-100/60 shadow-sm"
            : "bg-gradient-to-br from-white to-blue-50/30 border border-blue-100/60 shadow-sm";

          return (
            <div
              key={i}
              className={`relative rounded-2xl flex flex-col overflow-hidden transition-all duration-200 cursor-pointer hover:shadow-md hover:-translate-y-0.5 ${cardBg}`}
              onClick={() => setSelected(s)}
            >
              {/* Top Pick badge */}
              {isTopPick && (
                <div className="absolute top-2.5 right-2.5 z-10">
                  <span className="inline-flex items-center gap-1 text-[9px] font-bold bg-gradient-to-r from-yellow-400 to-orange-400 text-white rounded-full px-2 py-0.5 shadow">
                    ★ TOP PICK
                  </span>
                </div>
              )}

              {/* Funding banner */}
              {fundingBanner && (
                <div className={`px-4 py-1 text-[11px] font-bold flex items-center gap-1 ${fundingBanner.cls}`}>
                  <MdAttachMoney size={12} /> {fundingBanner.label}
                </div>
              )}

              <div className="p-4 flex flex-col gap-2.5 flex-1">
                {/* Rank + title */}
                <div className="flex items-start gap-2.5">
                  <div className={`shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold text-white shadow-sm
                    ${isTopPick ? "bg-gradient-to-br from-yellow-400 to-orange-500" : "bg-gradient-to-br from-purple-500 to-indigo-600"}`}>
                    {match.rank}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-[#1a0841] text-xs leading-snug pr-5 line-clamp-2">{s.title || "Scholarship"}</h4>
                    {s.organization && <p className="text-[10px] text-purple-600 font-semibold mt-0.5 truncate">{s.organization}</p>}
                  </div>
                </div>

                {/* Host countries */}
                {hostCountries.length > 0 && (
                  <div className="flex gap-1 flex-wrap">
                    {hostCountries.map(c => (
                      <span key={c} className="inline-flex items-center gap-0.5 text-[10px] bg-slate-100 text-slate-600 rounded-full px-2 py-0.5">
                        <MdPublic size={9} /> {c}
                      </span>
                    ))}
                  </div>
                )}

                {/* Reason */}
                <div className="bg-white/70 rounded-xl px-3 py-2 flex-1">
                  <p className="text-[11px] text-gray-600 leading-relaxed italic line-clamp-3">&ldquo;{match.reason}&rdquo;</p>
                </div>

                {/* Highlights */}
                {match.highlights?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {match.highlights.map((h, j) => (
                      <span key={j} className="inline-flex items-center gap-0.5 text-[10px] bg-purple-50 text-purple-700 border border-purple-100 rounded-full px-2 py-0.5">
                        ✓ {h}
                      </span>
                    ))}
                  </div>
                )}

                {/* Footer row */}
                <div className="flex items-center gap-1.5 pt-2 border-t border-black/5 flex-wrap">
                  <span className="inline-flex items-center gap-0.5 text-[10px] bg-purple-50 text-purple-700 rounded-full px-2 py-0.5">
                    <MdSchool size={9} /> {levels}
                  </span>
                  <span className={`inline-flex items-center gap-0.5 text-[10px] rounded-full px-2 py-0.5 ${deadlineCls}`}>
                    <MdCalendarToday size={9} /> {daysLeft !== null && daysLeft < 60 ? `${daysLeft}d left` : deadline}
                  </span>
                  <a
                    href={s.source_url}
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
        })}
      </div>

      {selected && <ScholarshipModal s={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function inferTargetLevel(currentLevel) {
  if (currentLevel === "bachelor") return "masters";
  if (currentLevel === "masters") return "phd";
  if (currentLevel === "high_school") return "undergraduate";
  return "masters";
}

async function runMatch(profile) {
  const body = { ...profile };
  if (!body.background) delete body.background;
  if (!body.extra) delete body.extra;
  const res = await fetch(`${API}/api/match`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "ngrok-skip-browser-warning": "true" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Server error: ${res.status}`);
  }
  return res.json();
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ScholarshipsPage() {
  const [tab, setTab] = useState(() => sessionStorage.getItem("sch_tab") || "browse");

  // Match state hoisted here — survives tab switches without re-triggering the API.
  const [matchTriggered, setMatchTriggered] = useState(
    () => sessionStorage.getItem("sch_tab") === "match"
  );
  const [matchRun, setMatchRun] = useState(0);
  // Pre-populate from localStorage so there's no blank flash on page refresh
  const [matchResult, setMatchResult] = useState(() => {
    try { return JSON.parse(localStorage.getItem("sch_match") || "null")?.result ?? null; }
    catch { return null; }
  });
  const [matchProfileName, setMatchProfileName] = useState(() => {
    try { return JSON.parse(localStorage.getItem("sch_match") || "null")?.name ?? ""; }
    catch { return ""; }
  });
  const [matchLoading, setMatchLoading] = useState(false);
  const [matchError, setMatchError] = useState(null);

  // Ref so the effect can read the latest matchResult without adding it to deps
  const matchResultRef = useRef(matchResult);
  matchResultRef.current = matchResult;

  // Fetch runs only when the user first opens "Find My Match" or clicks Refresh.
  useEffect(() => {
    if (!matchTriggered) return;
    // Already have a result in state and no forced refresh — nothing to do.
    if (matchResultRef.current !== null && matchRun === 0) return;

    let cancelled = false;

    async function fetchAndMatch() {
      // ── localStorage cache check (synchronous — no spinner shown) ──
      // On initial load check the cache before touching any async APIs.
      // On manual Refresh (matchRun > 0) always skip the cache.
      if (matchRun === 0) {
        try {
          const cached = JSON.parse(localStorage.getItem("sch_match") || "null");
          if (cached?.result && !cancelled) {
            setMatchProfileName(cached.name ?? "");
            setMatchResult(cached.result);
            return;
          }
        } catch {}
      }

      // Cache miss or forced refresh — now show the spinner
      if (!cancelled) { setMatchLoading(true); setMatchError(null); }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;

        let name = user?.user_metadata?.name || "Student";
        let nationality = "African";
        let currentLevel = "bachelor";
        let field = "any";
        let background = "";
        let extra = "";
        const profileExtras = {};

        if (user) {
          const { data: roleData } = await supabase
            .from("user_roles")
            .select("name, degree_level, gpa, language_score, languages, budget, target_countries, application_report")
            .eq("user_id", user.id)
            .single();

          if (roleData?.name) name = roleData.name;
          if (roleData?.degree_level) currentLevel = roleData.degree_level;

          const report = roleData?.application_report;
          const detectedNat = report?.form?.nationality || user.user_metadata?.nationality || "";
          if (detectedNat) nationality = detectedNat;

          const detectedField =
            report?.form?.academicGoals ||
            report?.form?.field_of_study ||
            user.user_metadata?.field_of_study ||
            "";
          if (detectedField) field = detectedField;

          const langs = Array.isArray(roleData?.languages)
            ? roleData.languages.filter(Boolean)
            : typeof roleData?.languages === "string" && roleData.languages
              ? [roleData.languages]
              : [];
          if (langs.length === 0) langs.push("English");

          const rawBudget = roleData?.budget || report?.form?.budget || null;
          const budgetUsd = rawBudget
            ? parseFloat(String(rawBudget).replace(/[^\d.]/g, "")) || null
            : null;

          const bgParts = [];
          if (roleData?.gpa) bgParts.push(`GPA: ${roleData.gpa}`);
          if (roleData?.language_score) bgParts.push(`Language score: ${roleData.language_score}`);
          background = bgParts.join(", ");

          const countries = Array.isArray(roleData?.target_countries)
            ? roleData.target_countries
            : typeof roleData?.target_countries === "string" && roleData.target_countries
              ? [roleData.target_countries]
              : [];
          if (countries.length > 0) extra = `Preferred countries: ${countries.join(", ")}`;

          Object.assign(profileExtras, { langs, budgetUsd });
        }

        const { langs = ["English"], budgetUsd = null } = profileExtras;

        const profile = {
          name,
          nationality,
          current_level: CURRENT_LEVELS.includes(currentLevel) ? currentLevel : "bachelor",
          target_level: inferTargetLevel(currentLevel),
          field,
          languages: langs,
          budget_usd: budgetUsd,
          background: background || undefined,
          extra: extra || undefined,
        };

        const matchRes = await runMatch(profile);
        if (cancelled) return;

        // Persist to localStorage — survives page refresh and tab close
        try {
          localStorage.setItem("sch_match", JSON.stringify({ result: matchRes, name }));
        } catch {}

        setMatchProfileName(name);
        setMatchResult(matchRes);
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
    sessionStorage.setItem("sch_tab", "match");
    setTab("match");
    setMatchTriggered(true);
  };

  const handleBrowseTab = () => {
    sessionStorage.setItem("sch_tab", "browse");
    setTab("browse");
  };

  const refreshMatch = () => {
    try { localStorage.removeItem("sch_match"); } catch {}
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
        {/* Header */}
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#1a0841]">Scholarships</h1>
            <p className="text-sm text-gray-500 mt-0.5">Discover funding opportunities or let AI match your profile.</p>
          </div>
          {/* Tabs */}
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
            profileName={matchProfileName}
            onRefresh={refreshMatch}
          />
        )}
      </div>
    </div>
  );
}
