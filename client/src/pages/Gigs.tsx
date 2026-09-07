import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../lib/axios';
import { Search, ArrowUpRight, SlidersHorizontal, Briefcase } from 'lucide-react';
import { Button } from '../components/ui/button';

/* ──────────────────────────────────────────────
   CATEGORY DATA
   ────────────────────────────────────────────── */

const categoryChips = [
  { value: '', label: 'All gigs' },
  { value: 'coding', label: 'Development & IT' },
  { value: 'graphic-design', label: 'Design & Creative' },
  { value: 'video-editing', label: 'Video & Animation' },
  { value: 'content-writing', label: 'Writing & Translation' },
  { value: 'tutoring', label: 'Tutoring & Teaching' },
  { value: 'others', label: 'Other Services' },
];

const categoryLabels: Record<string, string> = {
  'coding': 'Development & IT',
  'graphic-design': 'Design & Creative',
  'video-editing': 'Video & Animation',
  'content-writing': 'Writing & Translation',
  'tutoring': 'Tutoring & Teaching',
  'others': 'Other Services',
};

/* ──────────────────────────────────────────────
   GIG CARD COMPONENT
   ────────────────────────────────────────────── */

interface GigCardProps {
  bg: string;
  bgLight: string;
  image?: string;
  category: string;
  clientName: string;
  title: string;
  meta: string;
  startingPrice: string;
  onClick?: () => void;
}

function GigCard({
  bg,
  bgLight,
  image,
  category,
  clientName,
  title,
  meta,
  startingPrice,
  onClick,
}: GigCardProps) {
  return (
    <article
      className="group rounded-[24px] overflow-hidden flex flex-col cursor-pointer transition-all duration-300 ease-out hover:-translate-y-1.5 hover:shadow-[0_16px_48px_rgba(0,0,0,0.12)]"
      style={{ backgroundColor: bgLight, border: '1px solid rgba(0,0,0,0.04)' }}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
      aria-label={title}
    >
      {/* Cover — image or colored fallback */}
      <div
        className="relative w-full overflow-hidden"
        style={{ height: '170px' }}
      >
        {image ? (
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div
            className="w-full h-full flex items-end p-5"
            style={{
              background: `linear-gradient(145deg, ${bg} 0%, ${bg}cc 100%)`,
            }}
          >
            {/* Decorative circle */}
            <div
              className="absolute top-[-20%] right-[-10%] w-[140px] h-[140px] rounded-full opacity-20 pointer-events-none"
              style={{ background: 'rgba(255,255,255,0.5)' }}
              aria-hidden="true"
            />
            <div
              className="absolute bottom-[-15%] left-[-8%] w-[100px] h-[100px] rounded-full opacity-15 pointer-events-none"
              style={{ background: 'rgba(255,255,255,0.4)' }}
              aria-hidden="true"
            />
          </div>
        )}

        {/* Category pill on cover */}
        <span className="absolute top-3.5 left-3.5 inline-flex items-center px-3 py-1 rounded-full bg-white/80 backdrop-blur-sm text-[11px] font-bold uppercase tracking-wide text-ink/80">
          {category}
        </span>

        {/* Price on cover */}
        <span className="absolute bottom-3.5 right-3.5 inline-flex items-center px-3 py-1 rounded-full bg-ink/70 backdrop-blur-sm text-[12px] font-bold text-white">
          {startingPrice}
        </span>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 px-5 pt-4 pb-5">
        {/* Client identity */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-[13px] font-semibold text-ink">{clientName}</span>
          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/40">
            Verified Brief
          </span>
        </div>

        {/* Title */}
        <h3 className="font-display font-bold text-ink text-[1.05rem] leading-snug tracking-[-0.01em] mb-2.5 line-clamp-2">
          {title}
        </h3>

        {/* Meta */}
        <p className="text-[12px] font-medium text-ink/50 mb-0">{meta}</p>

        {/* CTA */}
        <div className="mt-auto pt-4">
          <span
            className="inline-flex items-center gap-1.5 text-[13px] font-semibold transition-all group-hover:gap-2.5"
            style={{ color: bg }}
          >
            Open brief
            <ArrowUpRight size={14} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </span>
        </div>
      </div>
    </article>
  );
}

/* ──────────────────────────────────────────────
   EXPLORE GIGS PAGE
   ────────────────────────────────────────────── */

export default function Gigs() {
  const [apiGigs, setApiGigs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Sync from URL params
  useEffect(() => {
    const urlSearch = searchParams.get('search') || '';
    const urlCategory = searchParams.get('category') || '';
    if (urlSearch) setSearchTerm(urlSearch);
    if (urlCategory) setActiveCategory(urlCategory);
  }, [searchParams]);

  // Fetch API gigs
  useEffect(() => {
    fetchGigs();
  }, []);

  const fetchGigs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/gigs');
      setApiGigs(res.data.data.gigs || []);
    } catch (e) {
      console.error('Failed to fetch gigs:', e);
    } finally {
      setLoading(false);
    }
  };

  // Filter API gigs
  const filteredApi = useMemo(() => {
    return apiGigs.filter((gig) => {
      const query = searchTerm.toLowerCase();
      const matchesSearch =
        !query ||
        gig.title?.toLowerCase().includes(query) ||
        gig.category?.toLowerCase().includes(query) ||
        gig.description?.toLowerCase().includes(query) ||
        (gig.tags && gig.tags.some((t: string) => t.toLowerCase().includes(query)));

      const gigCat = (gig.category || '').toLowerCase();
      const matchesCategory =
        !activeCategory ||
        gigCat === activeCategory.toLowerCase() ||
        gigCat.includes(activeCategory.toLowerCase()) ||
        (activeCategory === 'coding' && (gigCat.includes('dev') || gigCat.includes('coding') || gigCat.includes('it') || gigCat.includes('software'))) ||
        (activeCategory === 'graphic-design' && (gigCat.includes('design') || gigCat.includes('graphic') || gigCat.includes('creative') || gigCat.includes('brand'))) ||
        (activeCategory === 'video-editing' && (gigCat.includes('video') || gigCat.includes('animation') || gigCat.includes('motion') || gigCat.includes('film'))) ||
        (activeCategory === 'content-writing' && (gigCat.includes('writ') || gigCat.includes('content') || gigCat.includes('translat') || gigCat.includes('editorial'))) ||
        (activeCategory === 'tutoring' && (gigCat.includes('tutor') || gigCat.includes('teach') || gigCat.includes('mentor'))) ||
        (activeCategory === 'others' && (gigCat.includes('other') || gigCat.includes('service') || gigCat.includes('misc')));

      return matchesSearch && matchesCategory;
    });
  }, [apiGigs, activeCategory, searchTerm]);

  const totalCount = filteredApi.length;

  const apiGigColors = ['#22D3EE', '#FFB347', '#FF6B6B', '#A3E635', '#D8B4FE', '#F9A8D4'];
  const apiGigLights = [
    'rgba(34,211,238,0.08)', 'rgba(255,179,71,0.08)', 'rgba(255,107,107,0.08)',
    'rgba(163,230,53,0.08)', 'rgba(216,180,254,0.08)', 'rgba(249,168,212,0.08)',
  ];

  return (
    <div className="min-h-screen bg-paper">

      {/* ════════════════════════════════════════
          EXPLORE WORKSPACE HEADER
          ════════════════════════════════════════ */}
      <section className="pt-12 md:pt-16 pb-0">
        <div className="container-app">
          {/* Heading row */}
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
            <div>
              <span className="text-xs font-bold uppercase tracking-[0.15em] text-purple mb-2 block">
                EXPLORE GIGS
              </span>
              <h1
                className="font-display font-extrabold text-ink tracking-[-0.02em] leading-[1.1]"
                style={{ fontSize: 'clamp(2rem, 5vw, 3rem)' }}
              >
                Find work worth making.
              </h1>
            </div>
            <span className="text-xs font-bold uppercase tracking-[0.12em] text-ink/50 shrink-0">
              {loading ? '...' : `${totalCount} OPEN GIG${totalCount !== 1 ? 'S' : ''}`}
            </span>
          </div>

          {/* Search + Filter row */}
          <div className="flex flex-col sm:flex-row gap-3 mb-5">
            <div
              className={`relative flex-1 flex items-center rounded-full bg-white border transition-all duration-200 ${
                searchFocused
                  ? 'border-purple/40 shadow-[0_4px_24px_rgba(124,58,237,0.10)] ring-2 ring-purple/10'
                  : 'border-ink/10 shadow-[0_2px_12px_rgba(0,0,0,0.04)]'
              }`}
            >
              <Search
                size={18}
                className={`absolute left-4 transition-colors ${
                  searchFocused ? 'text-purple' : 'text-ink/30'
                }`}
              />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                placeholder="Search by role, skill, title, or category…"
                className="w-full h-12 md:h-[52px] pl-11 pr-4 rounded-full border-none text-[0.9375rem] font-medium outline-none text-ink bg-transparent placeholder:text-ink/30"
                aria-label="Search gigs"
              />
            </div>
            <button
              className="inline-flex items-center gap-2 h-12 md:h-[52px] px-6 rounded-full bg-white border border-ink/10 text-sm font-semibold text-ink hover:bg-soft transition-colors cursor-pointer shrink-0"
              aria-label="Open filters"
            >
              <SlidersHorizontal size={16} />
              Filters
            </button>
          </div>

          {/* Category chips */}
          <div className="flex flex-wrap gap-2 mb-8">
            {categoryChips.map((chip) => (
              <button
                key={chip.value}
                onClick={() => setActiveCategory(chip.value)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 cursor-pointer border-none ${
                  activeCategory === chip.value
                    ? 'bg-ink text-white shadow-[0_2px_8px_rgba(0,0,0,0.12)]'
                    : 'bg-white text-ink hover:bg-soft shadow-[0_1px_4px_rgba(0,0,0,0.04)]'
                }`}
                aria-pressed={activeCategory === chip.value}
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Results header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display font-bold text-ink text-xl md:text-2xl tracking-[-0.01em]">
              Available Opportunities
            </h2>
            <button className="text-sm font-semibold text-purple hover:text-purple/70 transition-colors cursor-pointer bg-transparent border-none">
              Sort: Newest first
            </button>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          GIG RESULTS GRID
          ════════════════════════════════════════ */}
      <section className="pb-16 md:pb-24">
        <div className="container-app">
          {filteredApi.length === 0 && !loading ? (
            <div className="py-20 text-center border border-dashed border-ink/15 rounded-[24px] bg-white">
              <div className="mx-auto h-14 w-14 rounded-full bg-soft flex items-center justify-center mb-4 text-ink/40">
                <Briefcase size={22} />
              </div>
              <h3 className="font-display font-bold text-ink text-lg mb-2">No gigs found</h3>
              <p className="text-sm text-ink/50 font-medium max-w-sm mx-auto mb-6">
                Try adjusting your filters or search terms to find what you're looking for.
              </p>
              <Button
                variant="outline"
                onClick={() => { setSearchTerm(''); setActiveCategory(''); }}
                className="rounded-full"
              >
                Clear all filters
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {filteredApi.map((gig, i) => {
                const categoryLabel = categoryLabels[gig.category] || gig.category?.replace('-', ' ') || 'General';
                const client = gig.client?.name || 'Verified Client';
                const budgetNum = Number(gig.budget || 0);

                return (
                  <GigCard
                    key={gig._id}
                    bg={apiGigColors[i % apiGigColors.length]}
                    bgLight={apiGigLights[i % apiGigLights.length]}
                    image={gig.images?.[0] || ''}
                    category={categoryLabel}
                    clientName={client}
                    title={gig.title}
                    meta={`₹${budgetNum.toLocaleString('en-IN')} · Remote · ${gig.proposalsCount || 0} proposals`}
                    startingPrice={`₹${budgetNum.toLocaleString('en-IN')}`}
                    onClick={() => navigate(`/gigs/${gig._id}`)}
                  />
                );
              })}

              {loading &&
                Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={`skeleton-${i}`}
                    className="rounded-[24px] bg-soft animate-pulse min-h-[360px]"
                  />
                ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
