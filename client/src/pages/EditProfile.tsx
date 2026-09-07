import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api from '../lib/axios';
import {
  ArrowLeft,
  Save,
  Building2,
  User,
  MapPin,
  Sparkles,
  ShieldCheck,
  Clock,
  Eye,
  CheckCircle2,
  Briefcase,
  Plus,
  Trash2,
  ExternalLink,
  Upload,
  Image as ImageIcon,
  Navigation,
  Users,
  Edit3
} from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '../components/ui/skeleton';

interface PortfolioItem {
  _id?: string;
  title: string;
  url?: string;
  description?: string;
  projectLink?: string;
  technologies?: string[];
  status?: string;
  freelancersHired?: number;
}

export default function EditProfile() {
  const { user, fetchMe } = useAuthStore();
  const navigate = useNavigate();
  const isClient = user?.role === 'client' || (!user?.role || user?.role !== 'freelancer');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [avatar, setAvatar] = useState('');
  const [avatarColor, setAvatarColor] = useState('#22D3EE');
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  
  // New / Edit portfolio item state
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [newProject, setNewProject] = useState({
    title: '',
    description: '',
    projectLink: '',
    technologies: '',
    url: '',
    status: 'Completed',
    freelancersHired: '',
  });
  const [showAddPortfolio, setShowAddPortfolio] = useState(false);
  const [addingPortfolio, setAddingPortfolio] = useState(false);

  const avatarColorOptions = ['#22D3EE', '#7C3AED', '#FF6B6B', '#A3E635', '#FFB347', '#D8B4FE', '#F9A8D4'];

  const [formData, setFormData] = useState({
    name: '',
    roleTitle: '',
    company: '',
    location: '',
    website: '',
    teamSize: 'Solo Creator / Founder',
    industry: '',
    bio: '',
    skills: '',
    responseTime: '< 2 Hours',
    hourlyRate: '',
    experience: '',
  });

  const detectCurrentLocation = async (showToast = true) => {
    setDetectingLocation(true);

    const tryIpLocation = async () => {
      try {
        const response = await fetch('https://ipapi.co/json/');
        if (response.ok) {
          const data = await response.json();
          if (data.city && data.country_name) {
            const locString = `${data.city}, ${data.region ? data.region + ', ' : ''}${data.country_name}`;
            setFormData(prev => ({ ...prev, location: locString }));
            if (showToast) toast.success(`Location detected: ${locString}`);
            return true;
          }
        }
      } catch {
        try {
          const res2 = await fetch('https://ipwho.is/');
          if (res2.ok) {
            const data2 = await res2.json();
            if (data2.city && data2.country) {
              const locString = `${data2.city}, ${data2.region ? data2.region + ', ' : ''}${data2.country}`;
              setFormData(prev => ({ ...prev, location: locString }));
              if (showToast) toast.success(`Location detected: ${locString}`);
              return true;
            }
          }
        } catch {
          // Ignore
        }
      }
      return false;
    };

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10`
            );
            if (res.ok) {
              const data = await res.json();
              const address = data.address || {};
              const city = address.city || address.town || address.village || address.county || address.state_district || '';
              const state = address.state || '';
              const country = address.country || '';
              
              const parts = [city, state, country].filter(Boolean);
              if (parts.length > 0) {
                const locString = parts.join(', ');
                setFormData(prev => ({ ...prev, location: locString }));
                if (showToast) toast.success(`Location detected: ${locString}`);
                setDetectingLocation(false);
                return;
              }
            }
          } catch (e) {
            console.warn('Reverse geocoding failed, trying IP fallback', e);
          }
          
          const ipSuccess = await tryIpLocation();
          if (!ipSuccess && showToast) {
            toast.error('Could not determine exact location. You can enter it manually.');
          }
          setDetectingLocation(false);
        },
        async (err) => {
          console.warn('Browser geolocation failed/denied, falling back to IP', err);
          const ipSuccess = await tryIpLocation();
          if (!ipSuccess && showToast) {
            toast.error('Could not auto-detect location. Please type your location.');
          }
          setDetectingLocation(false);
        },
        { timeout: 8000, enableHighAccuracy: true }
      );
    } else {
      const ipSuccess = await tryIpLocation();
      if (!ipSuccess && showToast) {
        toast.error('Geolocation is not supported by your browser.');
      }
      setDetectingLocation(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/users/profile/me');
      const data = res.data.data;
      const u = data.user;
      const p = data.profile;

      setAvatar(u.avatar || p.avatar || '');
      setAvatarColor(p.avatarColor || u.avatarColor || '#22D3EE');
      setPortfolio(p.portfolio || []);

      const initialLocation = p.location || '';

      setFormData({
        name: u.name || '',
        roleTitle: p.roleTitle || '',
        company: p.company || '',
        location: initialLocation,
        website: p.website || '',
        teamSize: p.teamSize || 'Solo Creator / Founder',
        industry: p.industry || '',
        bio: p.bio || '',
        skills: Array.isArray(p.skills) ? p.skills.join(', ') : '',
        responseTime: p.responseTime || '< 2 Hours',
        hourlyRate: p.hourlyRate ? String(p.hourlyRate) : '',
        experience: p.experience ? String(p.experience) : '',
      });

      // Automatically fetch current location for hirers/clients if location is empty
      if (!initialLocation && isClient) {
        detectCurrentLocation(false);
      }
    } catch (error) {
      console.error('Failed to load profile', error);
      if (user) {
        setFormData(prev => ({
          ...prev,
          name: user.name || '',
        }));
        if (isClient) {
          detectCurrentLocation(false);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file (JPEG, PNG, WebP, GIF)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Avatar image must be smaller than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAvatar(reader.result);
        toast.success('Avatar photo loaded! Click Save Changes to apply.');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = () => {
    setAvatar('');
    toast.info('Custom photo removed. Default initials avatar will be used.');
  };

  // Dynamic Profile Credibility Score Calculation
  const calculateScore = () => {
    let score = 0;
    if (formData.name.trim().length > 0) score += 15;
    if (formData.bio.trim().length >= 10) score += 15;
    if (formData.roleTitle.trim().length > 0) score += 15;
    if (formData.skills.trim().length > 0) score += 15;
    if (formData.location.trim().length > 0) score += 10;
    if (formData.company.trim().length > 0 || (Number(formData.experience) > 0)) score += 10;
    if (formData.website.trim().length > 0 || formData.industry.trim().length > 0) score += 10;
    if (portfolio.length > 0) score += 10;
    return Math.min(100, Math.max(score, 15));
  };

  const score = calculateScore();

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
        name: formData.name,
        avatar,
        avatarColor,
        bio: formData.bio,
        roleTitle: formData.roleTitle,
        company: formData.company,
        website: formData.website,
        teamSize: formData.teamSize,
        industry: formData.industry,
        location: formData.location,
        responseTime: formData.responseTime,
        skills: skillsArray,
        hourlyRate: Number(formData.hourlyRate) || 0,
        experience: Number(formData.experience) || 0,
        portfolio,
      });

      await fetchMe();
      toast.success('Profile updated successfully!');
      navigate('/profile');
    } catch (err) {
      console.error(err);
      toast.error('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleStartEditProject = (item: PortfolioItem) => {
    setEditingItemId(item._id || null);
    setNewProject({
      title: item.title || '',
      description: item.description || '',
      projectLink: item.projectLink || '',
      url: item.url || '',
      status: item.status || 'Completed',
      freelancersHired: item.freelancersHired !== undefined ? String(item.freelancersHired) : '',
      technologies: Array.isArray(item.technologies) ? item.technologies.join(', ') : '',
    });
    setShowAddPortfolio(true);
  };

  const handleAddPortfolioItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProject.title.trim()) {
      toast.error('Please enter a project title');
      return;
    }

    setAddingPortfolio(true);
    try {
      const techArray = newProject.technologies
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);

      const payload = {
        title: newProject.title,
        description: newProject.description,
        projectLink: newProject.projectLink,
        url: newProject.url,
        status: newProject.status || 'Completed',
        freelancersHired: Number(newProject.freelancersHired) || 0,
        technologies: techArray,
      };

      let res;
      if (editingItemId) {
        res = await api.put(`/api/users/portfolio/${editingItemId}`, payload);
        toast.success(isClient ? 'Past project updated!' : 'Portfolio item updated!');
      } else {
        res = await api.post('/api/users/portfolio', payload);
        toast.success(isClient ? 'Past project added!' : 'Portfolio item added!');
      }

      setPortfolio(res.data.data.portfolio);
      setNewProject({
        title: '',
        description: '',
        projectLink: '',
        technologies: '',
        url: '',
        status: 'Completed',
        freelancersHired: '',
      });
      setEditingItemId(null);
      setShowAddPortfolio(false);
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || (isClient ? 'Failed to save project' : 'Failed to save portfolio item'));
    } finally {
      setAddingPortfolio(false);
    }
  };

  const handleDeletePortfolioItem = async (itemId?: string) => {
    if (!itemId) return;
    try {
      const res = await api.delete(`/api/users/portfolio/${itemId}`);
      setPortfolio(res.data.data.portfolio);
      toast.success('Portfolio item removed');
    } catch (error) {
      console.error(error);
      toast.error('Failed to remove portfolio item');
    }
  };

  const displayName = formData.name || user?.name || 'User Profile';
  const displayInitials = displayName
    .split(' ')
    .filter(Boolean)
    .map((n: string) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'GM';

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
              Editing Credentials & Marketplace Profile
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
            Edit Profile & Credentials
          </h1>
          <p className="text-sm text-ink/60 font-medium">
            Customize how your profile, verified portfolio, and credibility appear to collaborators.
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

              {/* Avatar Image & Accent Color Picker */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 p-5 rounded-2xl bg-soft/50 border border-border/50">
                {/* Live Preview Container */}
                <div className="relative group shrink-0">
                  <div
                    className="w-20 h-20 rounded-[22px] font-clash font-bold text-2xl text-ink flex items-center justify-center shadow-md ring-4 ring-white overflow-hidden transition-all"
                    style={{ backgroundColor: avatarColor }}
                  >
                    {avatar ? (
                      <img
                        src={avatar}
                        alt={formData.name || 'Avatar Preview'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      displayInitials
                    )}
                  </div>
                  {avatar && (
                    <button
                      type="button"
                      onClick={handleRemoveAvatar}
                      className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-coral text-white flex items-center justify-center shadow-md hover:scale-110 transition-transform cursor-pointer border-2 border-white"
                      title="Remove custom photo"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>

                <div className="space-y-4 flex-1 w-full">
                  {/* Photo upload action buttons */}
                  <div className="space-y-1.5">
                    <span className="text-xs font-bold text-ink block">Profile Photo</span>
                    <div className="flex flex-wrap items-center gap-3">
                      <label className="btn-secondary !py-2 !px-4 !text-xs cursor-pointer inline-flex items-center gap-2 hover:border-purple/40">
                        <Upload size={14} className="text-purple" />
                        <span>{avatar ? 'Change Photo' : 'Upload Photo'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarFileChange}
                          className="hidden"
                        />
                      </label>
                      {avatar && (
                        <button
                          type="button"
                          onClick={handleRemoveAvatar}
                          className="text-xs font-semibold text-coral hover:text-coral/80 bg-transparent border-0 cursor-pointer inline-flex items-center gap-1"
                        >
                          <Trash2 size={13} />
                          <span>Remove Photo</span>
                        </button>
                      )}
                      <span className="text-[11px] text-ink/50 font-medium">
                        JPG, PNG, GIF or WebP (max 5MB)
                      </span>
                    </div>
                  </div>

                  {/* Avatar Accent Color Picker */}
                  <div className="space-y-2 pt-2 border-t border-border/40">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-ink block">Avatar Theme Color</span>
                      <span className="text-[11px] text-ink/50 font-medium">
                        {avatar ? 'Used as avatar border & fallback' : 'Displayed behind your initials'}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {avatarColorOptions.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setAvatarColor(c)}
                          className={`w-7 h-7 rounded-full transition-transform cursor-pointer border-2 ${
                            avatarColor === c ? 'scale-110 border-ink shadow-sm ring-2 ring-purple/20' : 'border-transparent hover:scale-105'
                          }`}
                          style={{ backgroundColor: c }}
                          title={c}
                        />
                      ))}
                    </div>
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
                    placeholder="e.g. Product Lead & Full-Stack Architect"
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
                    <option value="Solo Creator / Founder">Solo Creator / Founder</option>
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
                    placeholder="https://example.com"
                    className="w-full bg-soft border border-border rounded-2xl px-4 py-3 text-sm font-semibold text-ink focus:outline-none focus:border-purple focus:bg-white transition-all"
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold uppercase tracking-wider text-ink/70">
                      {isClient ? 'HQ / Primary Company Location' : 'Location & Timezone'}
                    </label>
                    <button
                      type="button"
                      onClick={() => detectCurrentLocation(true)}
                      disabled={detectingLocation}
                      className="text-xs font-bold text-purple hover:text-purple/80 cursor-pointer inline-flex items-center gap-1.5 transition-colors bg-transparent border-0 disabled:opacity-50"
                    >
                      <Navigation size={13} className={detectingLocation ? 'animate-spin' : ''} />
                      <span>{detectingLocation ? 'Detecting Location...' : 'Auto-Detect Current Location'}</span>
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder={isClient ? 'e.g. Bengaluru, Karnataka, India / Remote' : 'e.g. New Delhi, India / Remote (UTC+5:30)'}
                      className="w-full bg-soft border border-border rounded-2xl pl-10 pr-4 py-3 text-sm font-semibold text-ink focus:outline-none focus:border-purple focus:bg-white transition-all"
                    />
                    <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/40 pointer-events-none" />
                  </div>
                  {isClient && (
                    <p className="text-[11px] text-ink/50 font-medium">
                      Automatically detected from your current location or network. You can also customize or refine it manually.
                    </p>
                  )}
                </div>
              </div>
            </section>

            {/* 3. ABOUT & BIO */}
            <section className="bg-white rounded-[28px] p-6 sm:p-8 border border-border/70 shadow-[0_4px_24px_rgba(0,0,0,0.04)] space-y-6">
              <div className="flex items-center justify-between border-b border-border/60 pb-4">
                <div>
                  <h2 className="font-display text-xl font-bold text-ink">
                    {isClient ? '3. About Company & Hiring Philosophy' : '3. About & Collaboration Philosophy'}
                  </h2>
                  <p className="text-xs text-ink/50 font-medium mt-0.5">
                    {isClient
                      ? 'Share your organization’s mission, project scope, and how you collaborate with talent.'
                      : 'Share your experience, vision, and how you approach projects.'}
                  </p>
                </div>
                <Sparkles size={20} className="text-orange" />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-ink/70">
                  {isClient ? 'Company / Hirer Overview' : 'Bio Description'}
                </label>
                <textarea
                  rows={4}
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder={
                    isClient
                      ? 'Share a concise overview of your company mission, ongoing initiatives, and engineering/design culture...'
                      : 'Share a concise overview of your domain expertise, previous deliverables, and collaboration cadence...'
                  }
                  className="w-full bg-soft border border-border rounded-2xl p-4 text-sm font-medium text-ink focus:outline-none focus:border-purple focus:bg-white transition-all leading-relaxed"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-ink/70">
                  {isClient ? 'Technologies Used in Projects or Preferred Tech Stack' : 'Core Skills & Technologies (Comma Separated)'}
                </label>
                <input
                  type="text"
                  value={formData.skills}
                  onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                  placeholder={
                    isClient
                      ? 'e.g. React, Next.js, TypeScript, Python, PostgreSQL, AWS, Figma'
                      : 'e.g. React, TypeScript, UI/UX, Next.js, Node.js, Figma'
                  }
                  className="w-full bg-soft border border-border rounded-2xl px-4 py-3 text-sm font-semibold text-ink focus:outline-none focus:border-purple focus:bg-white transition-all"
                />
                {isClient && (
                  <p className="text-[11px] text-ink/50 font-medium">
                    Specify the tech stack your company/projects commonly use so matched freelancers understand your technical requirements.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink/70">
                    {isClient ? 'Years in Industry / Operation' : 'Years of Experience'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.experience}
                    onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                    placeholder="e.g. 5"
                    className="w-full bg-soft border border-border rounded-2xl px-4 py-3 text-sm font-semibold text-ink focus:outline-none focus:border-purple focus:bg-white transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink/70">
                    {isClient ? 'Typical Budget Benchmark (₹ / hr)' : 'Hourly Rate (₹)'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={formData.hourlyRate}
                    onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
                    placeholder="e.g. 2500"
                    className="w-full bg-soft border border-border rounded-2xl px-4 py-3 text-sm font-semibold text-ink focus:outline-none focus:border-purple focus:bg-white transition-all"
                  />
                </div>
              </div>
            </section>

            {/* 4. PAST PROJECTS & HIRING HISTORY (HIRER) / PORTFOLIO (FREELANCER) */}
            <section className="bg-white rounded-[28px] p-6 sm:p-8 border border-border/70 shadow-[0_4px_24px_rgba(0,0,0,0.04)] space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-4">
                <div>
                  <h2 className="font-display text-xl font-bold text-ink">
                    {isClient ? '4. Past Projects & Hiring History' : '4. Portfolio & Project Showcases'}
                  </h2>
                  <p className="text-xs text-ink/50 font-medium mt-0.5">
                    {isClient
                      ? 'Showcase products, ventures, and previous projects to help freelancers understand your work and build trust.'
                      : 'Add verified projects to demonstrate quality and build marketplace trust.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (showAddPortfolio) {
                      setEditingItemId(null);
                      setNewProject({
                        title: '',
                        description: '',
                        projectLink: '',
                        technologies: '',
                        url: '',
                        status: 'Completed',
                        freelancersHired: '',
                      });
                    }
                    setShowAddPortfolio(!showAddPortfolio);
                  }}
                  className="btn-secondary !py-2 !px-3.5 !text-xs self-start sm:self-auto inline-flex items-center gap-1.5"
                >
                  <Plus size={14} />
                  <span>
                    {showAddPortfolio
                      ? 'Close Form'
                      : (isClient ? 'Add Past Project' : 'Add Project Item')}
                  </span>
                </button>
              </div>

              {/* Add / Edit Project Form (Expandable) */}
              {showAddPortfolio && (
                <div className="bg-soft/70 rounded-2xl p-5 border border-purple/20 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm text-ink flex items-center gap-1.5">
                      {editingItemId && <Edit3 size={14} className="text-purple" />}
                      <span>
                        {editingItemId
                          ? (isClient ? 'Edit Past Project' : 'Edit Portfolio Project')
                          : (isClient ? 'Add Past Project' : 'Add New Portfolio Project')}
                      </span>
                    </h3>
                    {editingItemId && (
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-purple/10 text-purple px-2 py-0.5 rounded-full">
                        Editing Mode
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="block text-xs font-bold text-ink/70">Project Title *</label>
                      <input
                        type="text"
                        value={newProject.title}
                        onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                        placeholder={isClient ? 'e.g. AI Resume Analyzer' : 'e.g. SaaS Design System & React UI Kit'}
                        className="w-full bg-white border border-border rounded-xl px-3.5 py-2.5 text-xs font-semibold text-ink focus:outline-none focus:border-purple"
                      />
                    </div>

                    {isClient && (
                      <>
                        <div className="space-y-1.5">
                          <label className="block text-xs font-bold text-ink/70">Project Status</label>
                          <select
                            value={newProject.status}
                            onChange={(e) => setNewProject({ ...newProject, status: e.target.value })}
                            className="w-full bg-white border border-border rounded-xl px-3.5 py-2.5 text-xs font-semibold text-ink focus:outline-none focus:border-purple cursor-pointer"
                          >
                            <option value="Completed">Completed</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Planned">Planned</option>
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-xs font-bold text-ink/70">Freelancers Hired</label>
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={newProject.freelancersHired}
                            onChange={(e) => setNewProject({ ...newProject, freelancersHired: e.target.value })}
                            placeholder="e.g. 5"
                            className="w-full bg-white border border-border rounded-xl px-3.5 py-2.5 text-xs font-semibold text-ink focus:outline-none focus:border-purple"
                          />
                        </div>
                      </>
                    )}

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-ink/70">Project / Live URL</label>
                      <input
                        type="url"
                        value={newProject.projectLink}
                        onChange={(e) => setNewProject({ ...newProject, projectLink: e.target.value })}
                        placeholder="https://example.com"
                        className="w-full bg-white border border-border rounded-xl px-3.5 py-2.5 text-xs font-semibold text-ink focus:outline-none focus:border-purple"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-ink/70">Cover Image URL</label>
                      <input
                        type="url"
                        value={newProject.url}
                        onChange={(e) => setNewProject({ ...newProject, url: e.target.value })}
                        placeholder="https://images.unsplash.com/..."
                        className="w-full bg-white border border-border rounded-xl px-3.5 py-2.5 text-xs font-semibold text-ink focus:outline-none focus:border-purple"
                      />
                    </div>

                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="block text-xs font-bold text-ink/70">
                        {isClient ? 'Project Technologies (Comma Separated)' : 'Technologies Used (Comma Separated)'}
                      </label>
                      <input
                        type="text"
                        value={newProject.technologies}
                        onChange={(e) => setNewProject({ ...newProject, technologies: e.target.value })}
                        placeholder={isClient ? 'e.g. React, Node.js, MongoDB, AI' : 'e.g. Figma, React, TailwindCSS, TypeScript'}
                        className="w-full bg-white border border-border rounded-xl px-3.5 py-2.5 text-xs font-semibold text-ink focus:outline-none focus:border-purple"
                      />
                    </div>

                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="block text-xs font-bold text-ink/70">
                        {isClient ? 'Project Overview' : 'Brief Description'}
                      </label>
                      <textarea
                        rows={2}
                        value={newProject.description}
                        onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                        placeholder={isClient ? 'AI-powered platform for resume analysis and career readiness assessment.' : 'What problem did you solve and what was the outcome?'}
                        className="w-full bg-white border border-border rounded-xl p-3 text-xs font-medium text-ink focus:outline-none focus:border-purple"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingItemId(null);
                        setNewProject({
                          title: '',
                          description: '',
                          projectLink: '',
                          technologies: '',
                          url: '',
                          status: 'Completed',
                          freelancersHired: '',
                        });
                        setShowAddPortfolio(false);
                      }}
                      className="btn-secondary !py-1.5 !px-3 !text-xs"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleAddPortfolioItem}
                      disabled={addingPortfolio}
                      className="btn-primary !py-1.5 !px-4 !text-xs"
                    >
                      {addingPortfolio
                        ? 'Saving...'
                        : (editingItemId
                          ? (isClient ? 'Update Past Project' : 'Update Project')
                          : (isClient ? 'Save Past Project' : 'Add to Portfolio'))}
                    </button>
                  </div>
                </div>
              )}

              {/* Portfolio / Past Projects Items List */}
              {portfolio.length === 0 ? (
                <div className="text-center py-8 px-4 rounded-2xl bg-soft/40 border border-border/50 space-y-2">
                  <Briefcase size={28} className="mx-auto text-ink/30" />
                  <p className="text-xs font-bold text-ink/70">
                    {isClient ? 'No past projects added yet' : 'No portfolio projects added yet'}
                  </p>
                  <p className="text-[11px] text-ink/45 max-w-md mx-auto">
                    {isClient
                      ? 'Add previous products, ventures, or completed projects to build credibility and help freelancers understand the type of work you create.'
                      : 'Add project links or cases to showcase previous work on your profile.'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {portfolio.map((item, idx) => (
                    <div
                      key={item._id || idx}
                      className={`bg-soft/40 rounded-2xl p-4 border transition-all flex flex-col justify-between space-y-3 ${
                        editingItemId === item._id
                          ? 'border-purple ring-2 ring-purple/20 bg-white'
                          : 'border-border/50 hover:bg-white hover:border-purple/30'
                      }`}
                    >
                      <div>
                        {item.url && (
                          <div className="h-28 w-full rounded-xl overflow-hidden mb-2.5 bg-paper border border-border/40">
                            <img
                              src={item.url}
                              alt={item.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-1.5 mb-1">
                              <h4 className="font-bold text-sm text-ink truncate">{item.title}</h4>
                              {item.status && (
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                                  item.status === 'Completed'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : item.status === 'In Progress'
                                    ? 'bg-purple/10 text-purple'
                                    : 'bg-sky-100 text-sky-800'
                                }`}>
                                  {item.status}
                                </span>
                              )}
                            </div>
                            {isClient && item.freelancersHired !== undefined && item.freelancersHired > 0 && (
                              <div className="text-[11px] font-semibold text-ink/60 mb-1.5 flex items-center gap-1">
                                <Users size={12} className="text-purple" />
                                <span>
                                  {item.freelancersHired} Freelancer{item.freelancersHired === 1 ? '' : 's'} Hired
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleStartEditProject(item)}
                              className="text-ink/40 hover:text-purple transition-colors p-1"
                              title={isClient ? 'Edit Past Project' : 'Edit Project'}
                            >
                              <Edit3 size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeletePortfolioItem(item._id)}
                              className="text-ink/40 hover:text-coral transition-colors p-1"
                              title="Remove Project"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                        {item.description && (
                          <p className="text-xs text-ink/70 line-clamp-2 leading-relaxed mb-2">
                            {item.description}
                          </p>
                        )}
                        {item.technologies && item.technologies.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {item.technologies.map((t, tidx) => (
                              <span
                                key={tidx}
                                className="text-[9px] font-bold bg-white text-ink/70 px-2 py-0.5 rounded-full border border-border/50"
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {item.projectLink && (
                        <a
                          href={item.projectLink}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] font-bold text-purple hover:underline inline-flex items-center gap-1 pt-2 border-t border-border/30"
                        >
                          <span>View Project</span>
                          <ExternalLink size={11} />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* 5. AVAILABILITY & RESPONSE TIME */}
            <section className="bg-white rounded-[28px] p-6 sm:p-8 border border-border/70 shadow-[0_4px_24px_rgba(0,0,0,0.04)] space-y-6">
              <div className="flex items-center justify-between border-b border-border/60 pb-4">
                <div>
                  <h2 className="font-display text-xl font-bold text-ink">
                    5. Response Time & Communication Cadence
                  </h2>
                  <p className="text-xs text-ink/50 font-medium mt-0.5">
                    Setting clear communication expectations helps collaborators engage efficiently.
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
                    Escrow & Security Status
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
                <span>{saving ? 'Saving Profile...' : 'Save Profile'}</span>
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
                  <span>LIVE PROFILE PREVIEW</span>
                </span>
                <span className="text-[10px] font-bold uppercase bg-lime text-ink px-2 py-0.5 rounded-full">
                  Verified
                </span>
              </div>

              <div className="flex items-center gap-3.5">
                <div
                  className="w-14 h-14 rounded-2xl font-clash font-bold text-lg text-ink flex items-center justify-center shadow-md ring-2 ring-white shrink-0 overflow-hidden transition-colors"
                  style={{ backgroundColor: avatarColor }}
                >
                  {avatar ? (
                    <img
                      src={avatar}
                      alt={displayName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    displayInitials
                  )}
                </div>
                <div className="min-w-0">
                  <h4 className="font-display font-bold text-base text-ink truncate">
                    {displayName}
                  </h4>
                  <p className="text-xs text-ink/60 font-medium truncate">
                    {formData.roleTitle || 'Member'}
                  </p>
                  {formData.company && (
                    <p className="text-xs text-purple font-bold truncate">
                      {formData.company}
                    </p>
                  )}
                </div>
              </div>

              {formData.bio && (
                <p className="text-xs text-ink/75 leading-relaxed line-clamp-3 italic pt-1">
                  "{formData.bio}"
                </p>
              )}

              <div className="space-y-1.5 pt-2 border-t border-border/50 text-xs text-ink/60">
                {formData.location && (
                  <div className="flex items-center gap-1.5">
                    <MapPin size={13} className="text-ink/40" />
                    <span className="truncate">{formData.location}</span>
                  </div>
                )}
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
                <span className="text-xs font-bold text-purple">{score}% Complete</span>
              </div>
              <div className="w-full h-2 bg-white rounded-full overflow-hidden border border-purple/10">
                <div className="h-full gradient-primary rounded-full transition-all duration-300" style={{ width: `${score}%` }} />
              </div>
              <ul className="space-y-2 text-xs text-ink/70 font-medium pt-1">
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className={formData.roleTitle ? 'text-emerald-600 shrink-0' : 'text-ink/30 shrink-0'} />
                  <span>Role & Title specified</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className={formData.location ? 'text-emerald-600 shrink-0' : 'text-ink/30 shrink-0'} />
                  <span>Location & Timezone set</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className={formData.bio ? 'text-emerald-600 shrink-0' : 'text-ink/30 shrink-0'} />
                  <span>Bio & philosophy detailed</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className={portfolio.length > 0 ? 'text-emerald-600 shrink-0' : 'text-ink/30 shrink-0'} />
                  <span>Verified portfolio projects added</span>
                </li>
              </ul>
            </div>

          </aside>

        </form>

      </div>

    </div>
  );
}
