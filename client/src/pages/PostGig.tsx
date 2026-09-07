import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import api from '../lib/axios';
import { FilePlus2, IndianRupee, Calendar, Tag, Info, Upload, X, Sparkles, AlertCircle } from 'lucide-react';
import AnimatedSection from '../components/AnimatedSection';

const categories = [
  { value: 'coding', label: 'Development & IT', minBudget: 2000 },
  { value: 'graphic-design', label: 'Design & Creative', minBudget: 1000 },
  { value: 'video-editing', label: 'Video & Animation', minBudget: 1500 },
  { value: 'content-writing', label: 'Writing & Translation', minBudget: 500 },
  { value: 'tutoring', label: 'Tutoring & Teaching', minBudget: 500 },
  { value: 'others', label: 'Other Services', minBudget: 500 },
];

const categoryMinBudgets: Record<string, number> = {
  'coding': 2000,
  'graphic-design': 1000,
  'video-editing': 1500,
  'content-writing': 500,
  'tutoring': 500,
  'others': 500,
};

const experienceLevels = [
  { value: 'entry', label: 'Entry Level' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'expert', label: 'Expert' },
];

export default function PostGig() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    budget: '',
    deadline: '',
    tags: '',
  });
  const [loading, setLoading] = useState(false);
  const [experienceLevel, setExperienceLevel] = useState('');
  const [additionalTags, setAdditionalTags] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null);
  const draftLoadedRef = useRef(false);

  // Restore draft from localStorage on mount (runs exactly once)
  useEffect(() => {
    if (draftLoadedRef.current) return;
    try {
      const raw = localStorage.getItem('gigmatch_post_gig_draft');
      if (raw) {
        draftLoadedRef.current = true;
        const parsed = JSON.parse(raw);
        if (parsed.formData) {
          setFormData(parsed.formData);
        }
        if (parsed.experienceLevel) {
          setExperienceLevel(parsed.experienceLevel);
        }
        if (parsed.additionalTags) {
          setAdditionalTags(parsed.additionalTags);
        }
        if (parsed.savedAt) {
          setDraftSavedAt(parsed.savedAt);
        }
        setHasDraft(true);
        toast.info('Loaded your saved project draft from browser storage.', {
          id: 'loaded-draft-toast',
        });
      }
    } catch (e) {
      console.error('Failed to load draft from localStorage:', e);
    }
  }, []);

  // Today's date in YYYY-MM-DD for deadline min attribute
  const todayStr = new Date().toISOString().split('T')[0];

  const currentMinBudget = formData.category
    ? categoryMinBudgets[formData.category] || 500
    : 500;

  const currentCategoryLabel =
    categories.find((c) => c.value === formData.category)?.label || '';

  const isBudgetTooLow =
    formData.budget !== '' &&
    (Number(formData.budget) < currentMinBudget || Number(formData.budget) < 500);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Validate Title
    if (!formData.title.trim() || formData.title.trim().length < 5) {
      toast.error('Please enter a descriptive project title (at least 5 characters)');
      return;
    }

    // 2. Validate Category
    if (!formData.category) {
      toast.error('Please choose a category');
      return;
    }

    // 3. Validate Description
    if (!formData.description.trim() || formData.description.trim().length < 20) {
      toast.error('Please provide a detailed description (at least 20 characters)');
      return;
    }

    // 4. Validate Budget (Must be >= currentMinBudget and at least ₹500)
    const numericBudget = Number(formData.budget);
    if (!formData.budget || isNaN(numericBudget) || numericBudget <= 0) {
      toast.error(`Please enter a valid budget of at least ₹${currentMinBudget.toLocaleString('en-IN')}`);
      return;
    }
    if (numericBudget < 500 || numericBudget < currentMinBudget) {
      toast.error(
        `Budget cannot be less than ₹${currentMinBudget.toLocaleString('en-IN')} for ${currentCategoryLabel || 'this category'}`
      );
      return;
    }

    // 5. Validate Deadline
    if (!formData.deadline) {
      toast.error('Please set a target deadline for your project');
      return;
    }
    if (formData.deadline < todayStr) {
      toast.error('Deadline cannot be in the past');
      return;
    }

    // 6. Validate Experience Level
    if (!experienceLevel) {
      toast.error('Please select an experience level (Entry, Intermediate, or Expert)');
      return;
    }

    // 7. Validate Required Skills
    const tagsArray = formData.tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    if (tagsArray.length === 0) {
      toast.error('Please provide at least one required skill tag');
      return;
    }

    setLoading(true);

    try {
      // Convert uploaded file attachments to DataURI objects
      const processedAttachments = await Promise.all(
        attachments.map(async (file) => {
          const dataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
          return {
            name: file.name,
            size: file.size,
            type: file.type,
            url: dataUrl,
          };
        })
      );

      const imageList = processedAttachments
        .filter((att) => att.type.startsWith('image/'))
        .map((att) => att.url);

      await api.post('/api/gigs', {
        ...formData,
        budget: numericBudget,
        tags: tagsArray,
        experienceLevel,
        attachments: processedAttachments,
        images: imageList,
      });
      localStorage.removeItem('gigmatch_post_gig_draft');
      toast.success('Gig posted successfully!');
      navigate('/dashboard?tab=Projects');
    } catch {
      toast.error('Failed to post gig. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = () => {
    const hasAnyContent =
      formData.title.trim() ||
      formData.description.trim() ||
      formData.category ||
      formData.budget ||
      formData.deadline ||
      formData.tags ||
      experienceLevel ||
      additionalTags;

    if (!hasAnyContent) {
      toast.error('Cannot save an empty draft. Please fill in some project details first.');
      return;
    }

    const now = new Date().toISOString();
    try {
      localStorage.setItem(
        'gigmatch_post_gig_draft',
        JSON.stringify({
          formData,
          experienceLevel,
          additionalTags,
          savedAt: now,
        })
      );
      setHasDraft(true);
      setDraftSavedAt(now);
      toast.success('Draft saved in browser storage! You can leave and resume anytime.');
    } catch (e) {
      console.error('Failed to save draft to localStorage:', e);
      toast.error('Could not save draft locally.');
    }
  };

  const handleDiscardDraft = () => {
    localStorage.removeItem('gigmatch_post_gig_draft');
    setFormData({
      title: '',
      description: '',
      category: '',
      budget: '',
      deadline: '',
      tags: '',
    });
    setExperienceLevel('');
    setAdditionalTags('');
    setHasDraft(false);
    setDraftSavedAt(null);
    toast.info('Draft discarded.');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      setAttachments((prev) => [...prev, ...files]);
      toast.success(`Attached ${files.length} file${files.length > 1 ? 's' : ''}`);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      if (files.length > 0) {
        setAttachments((prev) => [...prev, ...files]);
        toast.success(`Attached ${files.length} file${files.length > 1 ? 's' : ''}`);
      }
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  /* ── Shared input classes (matching homepage search bar feel) ── */
  const inputBase =
    'w-full h-13 px-5 rounded-2xl bg-white border border-border text-[0.9375rem] font-medium text-ink placeholder:text-ink/30 outline-none transition-all duration-300 focus:border-purple/30 focus:ring-2 focus:ring-purple/10 focus:shadow-[0_4px_24px_rgba(124,58,237,0.08)]';
  const inputWithIcon = inputBase + ' pl-11';
  const labelClass =
    'block text-sm font-semibold text-ink mb-2';

  return (
    <div className="min-h-screen bg-paper overflow-hidden">

      {/* ════════════════════════════════════════
          HERO HEADER
          ════════════════════════════════════════ */}
      <section className="relative pt-8 pb-12 md:pt-12 md:pb-16 overflow-hidden">
        {/* Organic color fields — same palette as homepage hero */}
        <div
          className="absolute top-[-15%] left-[-8%] w-[380px] h-[380px] rounded-full opacity-35 blur-[120px] animate-float-slow pointer-events-none"
          style={{ background: '#A3E635' }}
          aria-hidden="true"
        />
        <div
          className="absolute top-[-5%] right-[-6%] w-[340px] h-[340px] rounded-full opacity-30 blur-[110px] animate-float-medium pointer-events-none"
          style={{ background: '#22D3EE' }}
          aria-hidden="true"
        />
        <div
          className="absolute bottom-[0%] right-[15%] w-[300px] h-[300px] rounded-full opacity-25 blur-[100px] animate-float-fast pointer-events-none"
          style={{ background: '#FF6B6B' }}
          aria-hidden="true"
        />

        <div className="container-app relative z-10">
          <div className="max-w-[760px] mx-auto text-center">
            {/* Pill badge — mirrors homepage top badge */}
            <AnimatedSection>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-ink text-white text-xs font-bold uppercase tracking-widest -rotate-[2deg] mb-5">
                <Sparkles size={14} className="text-cyan" />
                CREATE A BRIEF
              </div>
            </AnimatedSection>

            {/* Headline */}
            <AnimatedSection delay={100}>
              <h1
                className="font-display font-extrabold text-ink leading-[1.18] tracking-[-0.015em] mb-4"
                style={{ fontSize: 'clamp(1.75rem, 4.5vw, 3rem)' }}
              >
                Post a New Gig
              </h1>
            </AnimatedSection>

            {/* Subtitle */}
            <AnimatedSection delay={200}>
              <p className="text-base md:text-lg text-ink/60 font-medium max-w-[520px] mx-auto leading-relaxed">
                Describe what you need and receive proposals from talented freelancers.
              </p>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          FORM BODY
          ════════════════════════════════════════ */}
      <section className="pb-20 md:pb-28">
        <div className="container-app max-w-[1100px] mx-auto">
          <form onSubmit={handleSubmit}>

            {/* ── DRAFT BANNER ── */}
            {hasDraft && (
              <div className="mb-6 p-4.5 rounded-2xl bg-purple/5 border border-purple/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-purple/15 text-purple flex items-center justify-center shrink-0">
                    <Sparkles size={16} />
                  </div>
                  <div>
                    <span className="font-bold text-xs text-ink block">
                      Resumed from your saved local draft
                    </span>
                    <span className="text-[11px] text-ink/50">
                      {draftSavedAt ? `Last saved on ${new Date(draftSavedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })} at ${new Date(draftSavedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · ` : ''}
                      Data is stored securely in your browser's local storage.
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={handleSaveDraft}
                    className="btn-secondary !py-1.5 !px-3.5 !text-xs cursor-pointer"
                  >
                    Save Changes
                  </button>
                  <button
                    type="button"
                    onClick={handleDiscardDraft}
                    className="text-xs font-bold text-coral hover:underline px-2.5 py-1 cursor-pointer bg-transparent border-0"
                  >
                    Discard Draft
                  </button>
                </div>
              </div>
            )}

            {/* ── TWO-COLUMN ROW: Basic Info (left) | Budget + Skills (right) ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-7 items-start">

              {/* ═══ LEFT COLUMN: Basic Information ═══ */}
              <AnimatedSection delay={100}>
                <div className="bg-white rounded-[28px] border border-border/50 p-7 md:p-9 shadow-[0_4px_24px_rgba(0,0,0,0.04)] transition-all duration-300 hover:shadow-[0_8px_40px_rgba(0,0,0,0.07)] h-full">
                  {/* Section header */}
                  <div className="flex items-center gap-3 mb-7">
                    <div className="w-10 h-10 rounded-xl bg-purple/10 flex items-center justify-center">
                      <Info size={18} className="text-purple" />
                    </div>
                    <div>
                      <h2 className="font-display font-bold text-ink text-lg tracking-normal">Basic Information</h2>
                      <p className="text-ink/50 text-sm font-medium">Tell us about your project</p>
                    </div>
                  </div>

                  <div className="space-y-5">
                    {/* Project Title */}
                    <div>
                      <label className={labelClass}>
                        Project Title <span className="text-coral">*</span>
                      </label>
                      <input
                        type="text"
                        className={inputBase}
                        placeholder="e.g. Build a responsive landing page"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        required
                        minLength={5}
                      />
                      <p className="text-xs text-ink/40 font-medium mt-2 ml-1">Keep it short and descriptive to attract the right talent.</p>
                    </div>

                    {/* Category */}
                    <div>
                      <label className={labelClass}>
                        Category <span className="text-coral">*</span>
                      </label>
                      <select
                        className={inputBase + ' cursor-pointer appearance-none'}
                        value={formData.category}
                        onChange={(e) => {
                          const selectedCat = e.target.value;
                          const minB = categoryMinBudgets[selectedCat] || 500;
                          setFormData((prev) => ({
                            ...prev,
                            category: selectedCat,
                            budget: (!prev.budget || Number(prev.budget) < minB) ? String(minB) : prev.budget,
                          }));
                        }}
                        required
                        style={{
                          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2371717A' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
                          backgroundRepeat: 'no-repeat',
                          backgroundPosition: 'right 1.25rem center',
                        }}
                      >
                        <option value="" disabled>Select a category</option>
                        {categories.map((c) => (
                          <option key={c.value} value={c.value}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Description */}
                    <div>
                      <label className={labelClass}>
                        Description <span className="text-coral">*</span>
                      </label>
                      <textarea
                        className="w-full min-h-[200px] px-5 py-4 rounded-2xl bg-white border border-border text-[0.9375rem] font-medium text-ink placeholder:text-ink/30 outline-none transition-all duration-300 focus:border-purple/30 focus:ring-2 focus:ring-purple/10 focus:shadow-[0_4px_24px_rgba(124,58,237,0.08)] resize-y leading-relaxed"
                        placeholder="Describe your requirements, scope of work, and what deliverables you expect..."
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        required
                        minLength={20}
                      />
                      {/* Tip box */}
                      <div className="mt-3 flex items-start gap-3 bg-purple/5 border border-purple/10 rounded-xl p-4">
                        <div className="w-7 h-7 rounded-lg bg-purple/15 flex items-center justify-center shrink-0 mt-0.5">
                          <Info size={14} className="text-purple" />
                        </div>
                        <p className="text-xs text-ink/55 font-medium leading-relaxed">
                          Be as specific as possible. Mention any required formats, access you will provide, and examples of similar work if you have them.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </AnimatedSection>

              {/* ═══ RIGHT COLUMN: Budget & Skills stacked ═══ */}
              <div className="flex flex-col gap-7">

                {/* Budget & Timeline */}
                <AnimatedSection delay={150}>
                  <div className="bg-white rounded-[28px] border border-border/50 p-7 md:p-9 shadow-[0_4px_24px_rgba(0,0,0,0.04)] transition-all duration-300 hover:shadow-[0_8px_40px_rgba(0,0,0,0.07)]">
                    <div className="flex items-center gap-3 mb-7">
                      <div className="w-10 h-10 rounded-xl bg-cyan/10 flex items-center justify-center">
                        <IndianRupee size={18} className="text-cyan" />
                      </div>
                      <div>
                        <h2 className="font-display font-bold text-ink text-lg tracking-normal">Budget & Timeline</h2>
                        <p className="text-ink/50 text-sm font-medium">Set your project constraints</p>
                      </div>
                    </div>

                    <div className="grid gap-5 grid-cols-2">
                      {/* Budget Input */}
                      <div>
                        <label className={labelClass}>
                          Fixed Budget (₹) <span className="text-coral">*</span>
                        </label>
                        <div className="relative">
                          <IndianRupee size={16} className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${isBudgetTooLow ? 'text-coral' : 'text-ink/30'}`} />
                          <input
                            type="number"
                            min={currentMinBudget}
                            step="100"
                            className={`${inputWithIcon} ${isBudgetTooLow
                                ? 'border-coral/50 ring-2 ring-coral/10 focus:border-coral focus:ring-coral/20'
                                : ''
                              }`}
                            placeholder={formData.category ? `Min ₹${currentMinBudget.toLocaleString('en-IN')}` : 'e.g. 5000'}
                            value={formData.budget}
                            onKeyDown={(e) => {
                              // Prevent entering negative symbols or scientific notation
                              if (e.key === '-' || e.key === '+' || e.key === 'e' || e.key === 'E') {
                                e.preventDefault();
                              }
                            }}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === '' || Number(val) >= 0) {
                                setFormData({ ...formData, budget: val });
                              }
                            }}
                            required
                          />
                        </div>

                        {/* Minimum Budget Helper & Warning */}
                        {isBudgetTooLow ? (
                          <p className="text-[11px] text-coral font-semibold mt-1.5 ml-1 flex items-center gap-1">
                            <AlertCircle size={12} className="shrink-0" />
                            Minimum budget is ₹{currentMinBudget.toLocaleString('en-IN')}
                          </p>
                        ) : (
                          <p className="text-[11px] text-ink/50 font-medium mt-1.5 ml-1">
                            {formData.category
                              ? `Min ₹${currentMinBudget.toLocaleString('en-IN')} required for ${currentCategoryLabel}`
                              : 'Minimum ₹500'}
                          </p>
                        )}
                      </div>

                      {/* Deadline */}
                      <div>
                        <label className={labelClass}>
                          Deadline <span className="text-coral">*</span>
                        </label>
                        <div className="relative">
                          <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/30" />
                          <input
                            type="date"
                            min={todayStr}
                            className={inputWithIcon}
                            value={formData.deadline}
                            onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                            required
                          />
                        </div>
                        <p className="text-[11px] text-ink/50 font-medium mt-1.5 ml-1">
                          Target completion date
                        </p>
                      </div>
                    </div>

                    {/* Experience Level */}
                    <div className="mt-5">
                      <label className={labelClass}>
                        Experience Level <span className="text-coral">*</span>
                      </label>
                      <div className="flex flex-wrap gap-2.5">
                        {experienceLevels.map((lvl) => (
                          <button
                            key={lvl.value}
                            type="button"
                            onClick={() => setExperienceLevel(lvl.value)}
                            className={`px-5 py-2.5 rounded-full text-sm font-semibold border transition-all duration-200 cursor-pointer ${experienceLevel === lvl.value
                                ? 'gradient-primary text-white border-transparent shadow-[0_4px_16px_rgba(124,58,237,0.25)]'
                                : 'bg-white text-ink/70 border-border hover:border-purple/30 hover:text-purple hover:shadow-[0_2px_12px_rgba(124,58,237,0.08)]'
                              }`}
                          >
                            {lvl.label}
                          </button>
                        ))}
                      </div>
                      {!experienceLevel && (
                        <p className="text-[11px] text-ink/40 font-medium mt-2 ml-1">
                          Please select one experience tier for matching.
                        </p>
                      )}
                    </div>
                  </div>
                </AnimatedSection>

                {/* Skills & Tags */}
                <AnimatedSection delay={250}>
                  <div className="bg-white rounded-[28px] border border-border/50 p-7 md:p-9 shadow-[0_4px_24px_rgba(0,0,0,0.04)] transition-all duration-300 hover:shadow-[0_8px_40px_rgba(0,0,0,0.07)]">
                    <div className="flex items-center gap-3 mb-7">
                      <div className="w-10 h-10 rounded-xl bg-coral/10 flex items-center justify-center">
                        <Tag size={18} className="text-coral" />
                      </div>
                      <div>
                        <h2 className="font-display font-bold text-ink text-lg tracking-normal">Skills & Tags</h2>
                        <p className="text-ink/50 text-sm font-medium">Help the right talent find your project</p>
                      </div>
                    </div>

                    <div className="space-y-5">
                      {/* Required Skills */}
                      <div>
                        <label className={labelClass}>
                          Required Skills <span className="text-coral">*</span>
                        </label>
                        <div className="relative">
                          <Tag size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/30" />
                          <input
                            type="text"
                            className={inputWithIcon}
                            placeholder="e.g. react, typescript, tailwind"
                            value={formData.tags}
                            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                            required
                          />
                        </div>
                        <p className="text-xs text-ink/40 font-medium mt-2 ml-1">Separate skills with commas (at least 1 required)</p>
                      </div>

                      {/* Additional Tags */}
                      <div>
                        <label className={labelClass}>Additional Tags (Optional)</label>
                        <input
                          type="text"
                          className={inputBase}
                          placeholder="e.g. urgent, startup, portfolio-piece"
                          value={additionalTags}
                          onChange={(e) => setAdditionalTags(e.target.value)}
                        />
                        <p className="text-xs text-ink/40 font-medium mt-2 ml-1">Optional tags to improve discoverability</p>
                      </div>
                    </div>

                    {/* Tag preview pills */}
                    {(formData.tags || additionalTags) && (
                      <div className="mt-5 flex flex-wrap gap-2">
                        {formData.tags.split(',').map((t) => t.trim()).filter(Boolean).map((tag) => (
                          <span
                            key={tag}
                            className="px-3 py-1 rounded-full bg-ink/8 text-ink text-xs font-semibold"
                          >
                            {tag}
                          </span>
                        ))}
                        {additionalTags.split(',').map((t) => t.trim()).filter(Boolean).map((tag) => (
                          <span
                            key={tag}
                            className="px-3 py-1 rounded-full bg-orange/10 text-orange text-xs font-semibold"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </AnimatedSection>

              </div>
            </div>

            {/* ── FULL-WIDTH: Attachments ── */}
            <div className="mt-7">
              <AnimatedSection delay={350}>
                <div
                  className={`bg-white rounded-[28px] border p-7 md:p-9 shadow-[0_4px_24px_rgba(0,0,0,0.04)] transition-all duration-300 hover:shadow-[0_8px_40px_rgba(0,0,0,0.07)] ${attachments.length === 0 ? 'border-border/60' : 'border-purple/30 ring-1 ring-purple/10'
                    }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-7">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-orange/10 flex items-center justify-center">
                        <Upload size={18} className="text-orange" />
                      </div>
                      <div>
                        <h2 className="font-display font-bold text-ink text-lg tracking-normal">
                          Attachments <span className="text-coral">*</span>
                        </h2>
                        <p className="text-ink/50 text-sm font-medium">Upload project brief, reference files, or assets</p>
                      </div>
                    </div>

                    {/* Compulsory Indicator Badge */}
                    <div className="flex items-center gap-2">
                      {attachments.length === 0 ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-coral/10 text-coral text-xs font-bold tracking-wide border border-coral/20">
                          <AlertCircle size={13} />
                          1 ATTACHMENT REQUIRED
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-lime/20 text-ink text-xs font-bold tracking-wide border border-lime/40">
                          ✓ {attachments.length} ATTACHED
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Drop zone */}
                  <label
                    className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed py-10 px-6 cursor-pointer transition-all duration-300 ${dragOver
                        ? 'border-purple bg-purple/5 shadow-[0_4px_24px_rgba(124,58,237,0.10)]'
                        : attachments.length === 0
                          ? 'border-border hover:border-purple/40 bg-soft/40 hover:bg-purple/[0.02]'
                          : 'border-purple/30 bg-purple/[0.02] hover:border-purple/50'
                      }`}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                  >
                    <input
                      type="file"
                      className="sr-only"
                      multiple
                      onChange={handleFileSelect}
                    />
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-3 transition-all duration-300 ${dragOver ? 'bg-purple/15 scale-110' : 'bg-purple/8'
                      }`}>
                      <Upload size={22} className={`transition-colors duration-300 ${dragOver ? 'text-purple' : 'text-ink/40'}`} />
                    </div>
                    <p className="text-sm font-semibold text-ink/80 mb-1 text-center">
                      <span className="text-purple font-bold">Click to browse</span> or drag & drop files here <span className="text-coral">*</span>
                    </p>
                    <p className="text-xs text-ink/45 font-medium text-center">
                      PDF, PNG, JPG, DOCX, ZIP — up to 10MB each (Compulsory for talent matching)
                    </p>
                  </label>

                  {/* File previews */}
                  {attachments.length > 0 && (
                    <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {attachments.map((file, i) => (
                        <div
                          key={`${file.name}-${i}`}
                          className="flex items-center gap-3 bg-soft/60 rounded-xl px-4 py-3 border border-border/40 group transition-all duration-200 hover:shadow-[0_2px_12px_rgba(0,0,0,0.04)]"
                        >
                          <div className="w-9 h-9 rounded-lg bg-purple/10 flex items-center justify-center shrink-0">
                            <FilePlus2 size={16} className="text-purple" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-ink truncate">{file.name}</p>
                            <p className="text-xs text-ink/40 font-medium">{formatFileSize(file.size)}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeAttachment(i)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-ink/30 hover:text-coral hover:bg-coral/10 transition-all duration-200 cursor-pointer opacity-80 group-hover:opacity-100"
                            aria-label={`Remove ${file.name}`}
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </AnimatedSection>
            </div>

            {/* ── ACTION BUTTONS ── */}
            <AnimatedSection delay={450}>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 mt-8">
                {/* Cancel */}
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="btn-secondary text-[0.9375rem] px-7 py-3 order-3 sm:order-1"
                >
                  Cancel
                </button>

                {/* Save Draft */}
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  className="inline-flex items-center justify-center gap-2 px-7 py-3 rounded-full bg-white text-ink/70 font-semibold text-[0.9375rem] border-1.5 border-border cursor-pointer transition-all duration-200 hover:text-purple hover:border-purple/30 hover:shadow-[0_4px_16px_rgba(124,58,237,0.08)] active:scale-[0.98] order-2"
                >
                  Save Draft
                </button>

                {/* Post Gig — mirrors homepage primary CTA exactly */}
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary text-[0.9375rem] px-8 py-3.5 order-1 sm:order-3 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
                >
                  <FilePlus2 size={16} />
                  {loading ? 'Publishing...' : 'Post Gig'}
                </button>
              </div>
            </AnimatedSection>

          </form>
        </div>
      </section>
    </div>
  );
}
