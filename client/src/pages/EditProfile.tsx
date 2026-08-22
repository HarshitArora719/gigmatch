import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api from '../lib/axios';
import {
  ArrowLeft,
  Save,
  Building2,
  User,
  MapPin,
  Globe,
  Users,
  Briefcase,
  Sparkles,
  ShieldCheck,
  Check,
  Calendar,
  Clock,
  AlertCircle,
  HelpCircle,
  Eye,
  CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '../components/ui/skeleton';

export default function EditProfile() {
  const { user, fetchMe } = useAuthStore();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarColor, setAvatarColor] = useState('#22D3EE');

  const avatarColorOptions = ['#22D3EE', '#7C3AED', '#FF6B6B', '#A3E635', '#FFB347', '#D8B4FE', '#F9A8D4'];

  const [formData, setFormData] = useState({
    name: '',
    roleTitle: '',
    company: '',
    location: '',
    website: '',
    teamSize: '10–50 Employees',
    industry: 'Digital Products & SaaS',
    bio: '',
    skills: '',
    responseTime: '< 2 Hours',
    hourlyRate: '2500',
    experience: '5',
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/users/me');
      const u = res.data.data.user;
      setFormData({
        name: u.name || user?.name || '',
        roleTitle: u.roleTitle || 'Founder & Product Lead',
        company: u.company || 'Morrow Studio & Labs',
        location: u.location || 'New Delhi, India / Remote',
        website: u.website || 'https://morrow.design',
        teamSize: u.teamSize || '10–50 Employees',
        industry: u.industry || 'Digital Products & SaaS',
        bio:
          u.bio ||
          'Building innovative digital products and collaborating with top-tier independent creators across design, engineering, and product strategy.',
        skills: u.skills?.join(', ') || 'Product Strategy, UI/UX Direction, Full-Stack Architecture, Brand Identity',
        responseTime: u.responseTime || '< 2 Hours',
        hourlyRate: String(u.hourlyRate || '2500'),
        experience: String(u.experience || '5'),
      });
    } catch (error) {
      console.error(error);
      if (user) {
        setFormData(prev => ({
          ...prev,
          name: user.name || '',
        }));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Please enter your full name');
      return;
    }

    setSaving(true);
    try {
      const skillsArray = formData.skills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      await api.post('/api/users/profile', {
        bio: formData.bio,
        skills: skillsArray,
        location: formData.location,
        hourlyRate: Number(formData.hourlyRate) || 0,
        experience: Number(formData.experience) || 0,
      });

      await fetchMe();
      toast.success('Employer profile updated successfully!');
      navigate('/profile');
    } catch (err) {
      console.error(err);
      toast.error('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const displayName = formData.name || user?.name || 'Harshit Arora';
  const displayInitials = displayName
    .split(' ')
    .filter(Boolean)
    .map((n: string) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'HA';

  if (loading) {
    return (
      <div className="min-h-screen bg-paper py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-6">
          <Skeleton className="h-10 w-48 rounded-xl" />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-6">
              <Skeleton className="h-64 rounded-[28px]" />
              <Skeleton className="h-72 rounded-[28px]" />
            </div>
            <div className="lg:col-span-4">
              <Skeleton className="h-96 rounded-[28px]" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper text-ink pb-24 antialiased selection:bg-purple/15 selection:text-ink">
      
      {/* ====================================================
          TOP STICKY ACTION HEADER
          ==================================================== */}
      <header className="sticky top-0 z-30 bg-white/85 backdrop-blur-md border-b border-border/70 px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
        <div className="max-w-7xl w-full mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/profile')}
              className="p-2 rounded-xl text-ink/70 hover:text-ink hover:bg-soft transition-colors cursor-pointer border-0 bg-transparent inline-flex items-center gap-1.5 text-xs font-bold"
            >
              <ArrowLeft size={16} />
              <span>Back to Profile</span>
            </button>
            <div className="h-4 w-px bg-border hidden sm:block" />
            <span className="text-xs font-semibold text-ink/50 hidden sm:inline">
              Editing Employer & Organization Credentials
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/profile')}
              className="btn-secondary !py-2 !px-4 !text-xs"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => handleSave()}
              disabled={saving}
              className="btn-primary !py-2 !px-6 !text-xs shadow-md shadow-purple/20 disabled:opacity-50 inline-flex items-center gap-1.5"
            >
              <Save size={14} />
              <span>{saving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* ====================================================
          MAIN EDITING CANVAS (2 Columns)
          ==================================================== */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        
        {/* Page Title & Intro */}
        <div className="mb-8 space-y-1">
          <span className="eyebrow text-purple">PROFILE CONFIGURATION</span>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-ink tracking-tight">
            Edit Employer Profile
          </h1>
          <p className="text-sm text-ink/60 font-medium">
            Customize how your organization appears to creators across the platform.
          </p>
        </div>

        <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* ====================================================
              LEFT COLUMN: FORM FIELDS (8 cols)
              ==================================================== */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* 1. PERSONAL IDENTITY & ROLE */}
            <section className="bg-white rounded-[28px] p-6 sm:p-8 border border-border/70 shadow-[0_4px_24px_rgba(0,0,0,0.04)] space-y-6">
              <div className="flex items-center justify-between border-b border-border/60 pb-4">
                <div>
                  <h2 className="font-display text-xl font-bold text-ink">
                    1. Personal Identity & Avatar
                  </h2>
                  <p className="text-xs text-ink/50 font-medium mt-0.5">
                    Your name and leadership role presented to applicants.
                  </p>
                </div>
                <User size={20} className="text-purple" />
              </div>

              {/* Avatar Accent Color Picker */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 p-4 rounded-2xl bg-soft/50 border border-border/50">
                <div
                  className="w-16 h-16 rounded-[20px] font-clash font-bold text-xl text-ink flex items-center justify-center shadow-md ring-4 ring-white shrink-0 transition-colors"
                  style={{ backgroundColor: avatarColor }}
                >
                  {displayInitials}
                </div>
                <div className="space-y-2">
                  <span className="text-xs font-bold text-ink block">Avatar Theme Color</span>
                  <div className="flex flex-wrap gap-2">
                    {avatarColorOptions.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setAvatarColor(c)}
                        className={`w-7 h-7 rounded-full transition-transform cursor-pointer border-2 ${
                          avatarColor === c ? 'scale-110 border-ink shadow-sm' : 'border-transparent hover:scale-105'
                        }`}
                        style={{ backgroundColor: c }}
                        title={c}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink/70">
                    Full Name <span className="text-coral">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Harshit Arora"
                    className="w-full bg-soft border border-border rounded-2xl px-4 py-3 text-sm font-semibold text-ink focus:outline-none focus:border-purple focus:bg-white transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink/70">
                    Your Role / Title <span className="text-coral">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.roleTitle}
                    onChange={(e) => setFormData({ ...formData, roleTitle: e.target.value })}
                    placeholder="e.g. Founder & Product Lead"
                    className="w-full bg-soft border border-border rounded-2xl px-4 py-3 text-sm font-semibold text-ink focus:outline-none focus:border-purple focus:bg-white transition-all"
                  />
                </div>
              </div>
            </section>

            {/* 2. COMPANY & ORGANIZATION DETAILS */}
            <section className="bg-white rounded-[28px] p-6 sm:p-8 border border-border/70 shadow-[0_4px_24px_rgba(0,0,0,0.04)] space-y-6">
              <div className="flex items-center justify-between border-b border-border/60 pb-4">
                <div>
                  <h2 className="font-display text-xl font-bold text-ink">
                    2. Company & Brand Information
                  </h2>
                  <p className="text-xs text-ink/50 font-medium mt-0.5">
                    Build credibility by displaying your studio, agency, or startup details.
                  </p>
                </div>
                <Building2 size={20} className="text-cyan" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink/70">
                    Company / Studio Name
                  </label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    placeholder="e.g. Morrow Studio & Labs"
                    className="w-full bg-soft border border-border rounded-2xl px-4 py-3 text-sm font-semibold text-ink focus:outline-none focus:border-purple focus:bg-white transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink/70">
                    Industry / Vertical
                  </label>
                  <input
                    type="text"
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                    placeholder="e.g. Digital Products & Design Systems"
                    className="w-full bg-soft border border-border rounded-2xl px-4 py-3 text-sm font-semibold text-ink focus:outline-none focus:border-purple focus:bg-white transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink/70">
                    Team Size
                  </label>
                  <select
                    value={formData.teamSize}
                    onChange={(e) => setFormData({ ...formData, teamSize: e.target.value })}
                    className="w-full bg-soft border border-border rounded-2xl px-4 py-3 text-sm font-semibold text-ink focus:outline-none focus:border-purple focus:bg-white transition-all cursor-pointer"
                  >
                    <option value="Solo Founder / 1 Person">Solo Founder / 1 Person</option>
                    <option value="2–10 Employees">2–10 Employees</option>
                    <option value="10–50 Employees">10–50 Employees</option>
                    <option value="50–200 Employees">50–200 Employees</option>
                    <option value="200+ Enterprise">200+ Enterprise</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink/70">
                    Official Website URL
                  </label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    placeholder="https://morrow.design"
                    className="w-full bg-soft border border-border rounded-2xl px-4 py-3 text-sm font-semibold text-ink focus:outline-none focus:border-purple focus:bg-white transition-all"
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink/70">
                    HQ Location & Work Preference
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g. New Delhi, India / Remote (UTC+5:30)"
                    className="w-full bg-soft border border-border rounded-2xl px-4 py-3 text-sm font-semibold text-ink focus:outline-none focus:border-purple focus:bg-white transition-all"
                  />
                </div>
              </div>
            </section>

            {/* 3. ABOUT & HIRING PHILOSOPHY (BIO) */}
            <section className="bg-white rounded-[28px] p-6 sm:p-8 border border-border/70 shadow-[0_4px_24px_rgba(0,0,0,0.04)] space-y-6">
              <div className="flex items-center justify-between border-b border-border/60 pb-4">
                <div>
                  <h2 className="font-display text-xl font-bold text-ink">
                    3. About & Collaboration Philosophy
                  </h2>
                  <p className="text-xs text-ink/50 font-medium mt-0.5">
                    Share your company's mission and what you value when working with independent creators.
                  </p>
                </div>
                <Sparkles size={20} className="text-orange" />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-ink/70">
                  Company / Employer Bio Description
                </label>
                <textarea
                  rows={5}
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Tell creators about your company, the ambitious projects you build, and your commitment to transparent milestone escrow..."
                  className="w-full bg-soft border border-border rounded-2xl p-4 text-sm font-medium text-ink focus:outline-none focus:border-purple focus:bg-white transition-all leading-relaxed"
                />
                <span className="text-[11px] text-ink/45 block">
                  Recommended: 80–200 words explaining your product direction and workflow expectations.
                </span>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-ink/70">
                  Core Skills & Technologies Frequently Hired
                </label>
                <input
                  type="text"
                  value={formData.skills}
                  onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                  placeholder="e.g. React, TypeScript, Figma Design Systems, WebGL, Brand Identity"
                  className="w-full bg-soft border border-border rounded-2xl px-4 py-3 text-sm font-semibold text-ink focus:outline-none focus:border-purple focus:bg-white transition-all"
                />
                <span className="text-[11px] text-ink/45 block">
                  Comma separated. These will be highlighted as badges on your public profile.
                </span>
              </div>
            </section>

            {/* 4. AVAILABILITY & RESPONSE TIME */}
            <section className="bg-white rounded-[28px] p-6 sm:p-8 border border-border/70 shadow-[0_4px_24px_rgba(0,0,0,0.04)] space-y-6">
              <div className="flex items-center justify-between border-b border-border/60 pb-4">
                <div>
                  <h2 className="font-display text-xl font-bold text-ink">
                    4. Response Time & Communication Cadence
                  </h2>
                  <p className="text-xs text-ink/50 font-medium mt-0.5">
                    Setting clear communication expectations helps creators submit timely proposals.
                  </p>
                </div>
                <Clock size={20} className="text-lime" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink/70">
                    Typical Response Time
                  </label>
                  <select
                    value={formData.responseTime}
                    onChange={(e) => setFormData({ ...formData, responseTime: e.target.value })}
                    className="w-full bg-soft border border-border rounded-2xl px-4 py-3 text-sm font-semibold text-ink focus:outline-none focus:border-purple focus:bg-white transition-all cursor-pointer"
                  >
                    <option value="< 1 Hour">&lt; 1 Hour (Ultra Fast)</option>
                    <option value="< 2 Hours">&lt; 2 Hours (Standard)</option>
                    <option value="Within 24 Hours">Within 24 Hours</option>
                    <option value="1–2 Business Days">1–2 Business Days</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink/70">
                    Escrow Vault Preference
                  </label>
                  <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200/50 flex items-center gap-2 text-xs font-semibold text-emerald-800">
                    <ShieldCheck size={16} className="text-emerald-700 shrink-0" />
                    <span>100% Guaranteed Milestone Protection Active</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Bottom Save Action Bar */}
            <div className="flex items-center justify-between p-6 bg-white rounded-[28px] border border-border/70 shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
              <button
                type="button"
                onClick={() => navigate('/profile')}
                className="btn-secondary !py-3 !px-6 !text-sm"
              >
                Cancel & Discard
              </button>

              <button
                type="submit"
                disabled={saving}
                className="btn-primary !py-3 !px-8 !text-sm inline-flex items-center gap-2 shadow-lg shadow-purple/20 disabled:opacity-50"
              >
                <Save size={16} />
                <span>{saving ? 'Saving Profile...' : 'Save Employer Profile'}</span>
              </button>
            </div>

          </div>

          {/* ====================================================
              RIGHT COLUMN: LIVE PROFILE PREVIEW & TIPS (4 cols)
              ==================================================== */}
          <aside className="lg:col-span-4 lg:sticky lg:top-24 space-y-6">
            
            {/* Live Profile Card Preview */}
            <div className="bg-white rounded-[28px] p-6 border border-border/70 shadow-[0_4px_24px_rgba(0,0,0,0.04)] space-y-4">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <span className="eyebrow text-purple flex items-center gap-1">
                  <Eye size={12} />
                  <span>LIVE APPLICANT PREVIEW</span>
                </span>
                <span className="text-[10px] font-bold uppercase bg-lime text-ink px-2 py-0.5 rounded-full">
                  Verified
                </span>
              </div>

              <div className="flex items-center gap-3.5">
                <div
                  className="w-14 h-14 rounded-2xl font-clash font-bold text-lg text-ink flex items-center justify-center shadow-md ring-2 ring-white shrink-0 transition-colors"
                  style={{ backgroundColor: avatarColor }}
                >
                  {displayInitials}
                </div>
                <div className="min-w-0">
                  <h4 className="font-display font-bold text-base text-ink truncate">
                    {displayName}
                  </h4>
                  <p className="text-xs text-ink/60 font-medium truncate">
                    {formData.roleTitle}
                  </p>
                  <p className="text-xs text-purple font-bold truncate">
                    {formData.company}
                  </p>
                </div>
              </div>

              <p className="text-xs text-ink/75 leading-relaxed line-clamp-3 italic pt-1">
                "{formData.bio}"
              </p>

              <div className="space-y-1.5 pt-2 border-t border-border/50 text-xs text-ink/60">
                <div className="flex items-center gap-1.5">
                  <MapPin size={13} className="text-ink/40" />
                  <span className="truncate">{formData.location}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock size={13} className="text-emerald-600" />
                  <span className="text-emerald-700 font-medium">Responds {formData.responseTime}</span>
                </div>
              </div>

              {/* Skills badges */}
              {formData.skills && (
                <div className="flex flex-wrap gap-1 pt-2">
                  {formData.skills
                    .split(',')
                    .slice(0, 4)
                    .map((s, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] font-bold bg-soft text-ink/80 px-2 py-0.5 rounded-full border border-border/50"
                      >
                        {s.trim()}
                      </span>
                    ))}
                </div>
              )}
            </div>

            {/* Profile Strength Card */}
            <div className="bg-gradient-to-br from-purple/5 to-cyan/5 rounded-[28px] p-6 border border-purple/20 space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-ink">Profile Credibility</span>
                <span className="text-xs font-bold text-purple">95% Complete</span>
              </div>
              <div className="w-full h-2 bg-white rounded-full overflow-hidden border border-purple/10">
                <div className="h-full gradient-primary rounded-full w-[95%]" />
              </div>
              <ul className="space-y-2 text-xs text-ink/70 font-medium pt-1">
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                  <span>Company name & industry specified</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                  <span>HQ location & timezone set</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                  <span>Collaboration philosophy detailed</span>
                </li>
              </ul>
            </div>

          </aside>

        </form>

      </div>

    </div>
  );
}
