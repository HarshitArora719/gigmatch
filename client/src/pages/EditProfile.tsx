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
  Edit3,
  Globe,
  FileText,
  Award,
  Languages,
  Check,
  DollarSign,
  CreditCard,
  Wallet,
} from 'lucide-react';
import { Github, Linkedin } from '../components/icons/BrandIcons';
import { toast } from 'sonner';
import { Skeleton } from '../components/ui/skeleton';

interface PortfolioItem {
  _id?: string;
  title: string;
  url?: string;
  description?: string;
  projectLink?: string;
  githubLink?: string;
  duration?: string;
  roleInProject?: string;
  technologies?: string[];
  status?: string;
  freelancersHired?: number;
}

interface CertificationItem {
  name: string;
  issuer: string;
  issueDate?: string;
  credentialUrl?: string;
}

export default function EditProfile() {
  const { user, fetchMe, updateUser } = useAuthStore();
  const navigate = useNavigate();
  const isClient = user?.role === 'client' || (!user?.role || user?.role !== 'freelancer');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [avatar, setAvatar] = useState('');
  const [avatarColor, setAvatarColor] = useState('#22D3EE');
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [certifications, setCertifications] = useState<CertificationItem[]>([]);
  const [uploadingResume, setUploadingResume] = useState(false);

  // New / Edit portfolio item state
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [newProject, setNewProject] = useState({
    title: '',
    description: '',
    projectLink: '',
    githubLink: '',
    duration: '',
    roleInProject: '',
    technologies: '',
    url: '',
    status: 'Completed',
    freelancersHired: '',
  });
  const [showAddPortfolio, setShowAddPortfolio] = useState(false);
  const [addingPortfolio, setAddingPortfolio] = useState(false);

  // Certification state
  const [showAddCert, setShowAddCert] = useState(false);
  const [newCert, setNewCert] = useState<CertificationItem>({
    name: '',
    issuer: '',
    issueDate: '',
    credentialUrl: '',
  });

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
    // Freelancer-specific fields
    githubUrl: '',
    linkedinUrl: '',
    portfolioUrl: '',
    resumeUrl: '',
    languages: '',
    availabilityStatus: 'Available Now',
    preferredWorkTypes: [] as string[],
    // Payout details for direct automated milestone disbursements
    payoutMethod: 'upi' as 'upi' | 'bank_transfer',
    upiId: '',
    accountHolderName: '',
    accountNumber: '',
    ifscCode: '',
    bankName: '',
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
      setCertifications(p.certifications || []);

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
        experience: p.experience !== undefined && p.experience !== null ? String(p.experience) : '',
        githubUrl: p.githubUrl || '',
        linkedinUrl: p.linkedinUrl || '',
        portfolioUrl: p.portfolioUrl || '',
        resumeUrl: p.resumeUrl || '',
        languages: Array.isArray(p.languages) ? p.languages.join(', ') : (p.languages || ''),
        availabilityStatus: p.availabilityStatus || 'Available Now',
        preferredWorkTypes: Array.isArray(p.preferredWorkTypes) ? p.preferredWorkTypes : [],
        payoutMethod: (p.payoutDetails?.payoutMethod as 'upi' | 'bank_transfer') || 'upi',
        upiId: p.payoutDetails?.upiId || '',
        accountHolderName: p.payoutDetails?.accountHolderName || '',
        accountNumber: p.payoutDetails?.accountNumber || '',
        ifscCode: p.payoutDetails?.ifscCode || '',
        bankName: p.payoutDetails?.bankName || '',
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

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

    try {
      const formDataUpload = new FormData();
      formDataUpload.append('avatar', file);
      toast.loading('Uploading avatar photo...', { id: 'avatar-upload' });
      const res = await api.post('/api/uploads/avatar', formDataUpload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const newUrl = res.data.data.avatarUrl;
      setAvatar(newUrl);
      updateUser({ avatar: newUrl });
      await fetchMe();
      try { sessionStorage.removeItem('gm_profile_me'); } catch {}
      toast.success('Avatar photo uploaded successfully!', { id: 'avatar-upload' });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to upload avatar photo', { id: 'avatar-upload' });
    }
  };

  const handleRemoveAvatar = () => {
    setAvatar('');
    updateUser({ avatar: '' });
    try { sessionStorage.removeItem('gm_profile_me'); } catch {}
    toast.info('Custom photo removed. Default initials avatar will be used.');
  };

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
      toast.error('Please upload a PDF document (.pdf)');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Resume PDF file must be smaller than 10MB');
      return;
    }

    setUploadingResume(true);
    try {
      const data = new FormData();
      data.append('resume', file);
      const res = await api.post('/api/uploads/resume', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const url = res.data.data.resumeUrl;
      setFormData(prev => ({ ...prev, resumeUrl: url }));
      toast.success('Resume PDF uploaded successfully!');
    } catch (err) {
      console.warn('Backend resume upload fallback to local data URI', err);
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setFormData(prev => ({ ...prev, resumeUrl: reader.result as string }));
          toast.success('Resume attached successfully!');
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setUploadingResume(false);
    }
  };

  const handleToggleWorkType = (type: string) => {
    setFormData(prev => {
      const current = prev.preferredWorkTypes || [];
      const updated = current.includes(type)
        ? current.filter(t => t !== type)
        : [...current, type];
      return { ...prev, preferredWorkTypes: updated };
    });
  };

  const handleAddCert = () => {
    if (!newCert.name.trim() || !newCert.issuer.trim()) {
      toast.error('Please enter certification name and issuing organization');
      return;
    }
    setCertifications(prev => [...prev, { ...newCert }]);
    setNewCert({ name: '', issuer: '', issueDate: '', credentialUrl: '' });
    setShowAddCert(false);
    toast.success('Certification added!');
  };

  const handleDeleteCert = (idx: number) => {
    setCertifications(prev => prev.filter((_, i) => i !== idx));
    toast.info('Certification removed');
  };

  // Dynamic Profile Credibility Score Calculation
  const calculateScore = () => {
    if (isClient) {
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
    }

    // Freelancer Dynamic Completeness Score (6 Sections)
    let score = 0;

    // 1. Personal Information (Name, Professional Title, Location, Avatar) - 15 pts
    let s1 = 0;
    if (formData.name.trim().length > 0) s1 += 4;
    if (formData.roleTitle.trim().length > 0) s1 += 4;
    if (formData.location.trim().length > 0) s1 += 4;
    if (avatar) s1 += 3;
    score += s1;

    // 2. About Me (Bio, Skills, Experience, Languages) - 15 pts
    let s2 = 0;
    if (formData.bio.trim().length >= 10) s2 += 4;
    if (formData.skills.trim().length > 0) s2 += 4;
    if (formData.experience !== '' && Number(formData.experience) >= 0) s2 += 4;
    if (formData.languages.trim().length > 0) s2 += 3;
    score += s2;

    // 3. Professional Links (GitHub, LinkedIn, Portfolio, Resume) - 15 pts
    let s3 = 0;
    if (formData.githubUrl.trim().length > 0) s3 += 4;
    if (formData.linkedinUrl.trim().length > 0) s3 += 4;
    if (formData.portfolioUrl.trim().length > 0) s3 += 4;
    if (formData.resumeUrl.trim().length > 0) s3 += 3;
    score += s3;

    // 4. Portfolio Projects (At least 1 project) - 20 pts
    if (portfolio.length > 0) {
      score += 20;
    }

    // 5. Work Preferences (Availability Status, Hourly Rate, Preferred Work Types) - 15 pts
    let s5 = 0;
    if (formData.availabilityStatus.trim().length > 0) s5 += 5;
    if (Number(formData.hourlyRate) > 0) s5 += 5;
    if (formData.preferredWorkTypes && formData.preferredWorkTypes.length > 0) s5 += 5;
    score += s5;

    // 6. Payout & Escrow Destination (UPI ID or Bank Details) - 20 pts
    const hasUpi = Boolean(formData.upiId && formData.upiId.trim().length > 0);
    const hasBank = Boolean(formData.accountNumber && formData.accountNumber.trim().length > 0);
    if (hasUpi || hasBank) {
      score += 20;
    }

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

      const languagesArray = formData.languages
        .split(',')
        .map((l) => l.trim())
        .filter(Boolean);

      await api.post('/api/users/profile', {
        name: formData.name,
        avatar,
        avatarColor,
        bio: formData.bio,
        roleTitle: formData.roleTitle,
        company: isClient ? formData.company : undefined,
        website: isClient ? formData.website : undefined,
        teamSize: isClient ? formData.teamSize : undefined,
        industry: isClient ? formData.industry : undefined,
        location: formData.location,
        responseTime: formData.responseTime,
        skills: skillsArray,
        hourlyRate: Number(formData.hourlyRate) || 0,
        experience: Number(formData.experience) || 0,
        portfolio,
        // Freelancer-specific fields
        githubUrl: formData.githubUrl,
        linkedinUrl: formData.linkedinUrl,
        portfolioUrl: formData.portfolioUrl,
        resumeUrl: formData.resumeUrl,
        languages: languagesArray,
        availabilityStatus: formData.availabilityStatus,
        preferredWorkTypes: formData.preferredWorkTypes,
        certifications,
        payoutDetails: !isClient ? {
          payoutMethod: formData.payoutMethod,
          upiId: formData.upiId?.trim(),
          accountHolderName: formData.accountHolderName?.trim(),
          accountNumber: formData.accountNumber?.trim(),
          ifscCode: formData.ifscCode?.trim()?.toUpperCase(),
          bankName: formData.bankName?.trim(),
        } : undefined,
      });

      updateUser({
        name: formData.name.trim(),
        avatar,
        avatarColor,
      });
      await fetchMe();
      try {
        sessionStorage.removeItem('gm_profile_me');
        if (user?.id) sessionStorage.removeItem(`gm_profile_${user.id}`);
      } catch {}
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
      githubLink: item.githubLink || '',
      duration: item.duration || '',
      roleInProject: item.roleInProject || '',
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
        githubLink: newProject.githubLink,
        duration: newProject.duration,
        roleInProject: newProject.roleInProject,
        url: newProject.url,
        status: newProject.status || 'Completed',
        freelancersHired: Number(newProject.freelancersHired) || 0,
        technologies: techArray,
      };

      let res;
      if (editingItemId) {
        res = await api.put(`/api/users/portfolio/${editingItemId}`, payload);
        toast.success(isClient ? 'Past project updated!' : 'Portfolio project updated!');
      } else {
        res = await api.post('/api/users/portfolio', payload);
        toast.success(isClient ? 'Past project added!' : 'Portfolio project added!');
      }

      setPortfolio(res.data.data.portfolio);
      try {
        sessionStorage.removeItem('gm_profile_me');
        if (user?.id) sessionStorage.removeItem(`gm_profile_${user.id}`);
      } catch {}
      setNewProject({
        title: '',
        description: '',
        projectLink: '',
        githubLink: '',
        duration: '',
        roleInProject: '',
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
      try {
        sessionStorage.removeItem('gm_profile_me');
        if (user?.id) sessionStorage.removeItem(`gm_profile_${user.id}`);
      } catch {}
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
              {isClient ? 'Editing Hirer Credentials & Organization' : 'Editing Freelancer Profile & Credentials'}
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
          <span className="eyebrow text-purple">
            {isClient ? 'HIRER PROFILE CONFIGURATION' : 'FREELANCER PROFILE CONFIGURATION'}
          </span>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-ink tracking-tight">
            {isClient ? 'Edit Hirer Profile & Credentials' : 'Edit Freelancer Profile'}
          </h1>
          <p className="text-sm text-ink/60 font-medium">
            {isClient
              ? 'Customize how your company, verified projects, and credibility appear to collaborators.'
              : 'Showcase your skills, portfolio projects, experience, and work preferences to marketplace hirers.'}
          </p>
        </div>

        <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* ====================================================
              LEFT COLUMN: FORM FIELDS (8 cols)
              ==================================================== */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* 1. PERSONAL INFORMATION */}
            <section className="bg-white rounded-[28px] p-6 sm:p-8 border border-border/70 shadow-[0_4px_24px_rgba(0,0,0,0.04)] space-y-6">
              <div className="flex items-center justify-between border-b border-border/60 pb-4">
                <div>
                  <h2 className="font-display text-xl font-bold text-ink">
                    1. Personal Information
                  </h2>
                  <p className="text-xs text-ink/50 font-medium mt-0.5">
                    {isClient
                      ? 'Your name and leadership role presented to applicants.'
                      : 'Your personal photo, identity, and professional title shown to clients.'}
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
                      <span className="text-xs font-bold text-ink block">Theme Color</span>
                      <span className="text-[11px] text-ink/50 font-medium">
                        {avatar ? 'Used as avatar accent & border' : 'Displayed behind your initials'}
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
                    {isClient ? 'Your Role / Title' : 'Professional Title'}{' '}
                    <span className="text-coral">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.roleTitle}
                    onChange={(e) => setFormData({ ...formData, roleTitle: e.target.value })}
                    placeholder={
                      isClient
                        ? 'e.g. Product Lead & Full-Stack Architect'
                        : 'e.g. Full Stack Developer, UI/UX Designer, AI/ML Engineer'
                    }
                    className="w-full bg-soft border border-border rounded-2xl px-4 py-3 text-sm font-semibold text-ink focus:outline-none focus:border-purple focus:bg-white transition-all"
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold uppercase tracking-wider text-ink/70">
                      Location
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
                      placeholder={isClient ? 'e.g. Bengaluru, Karnataka, India / Remote' : 'e.g. Bengaluru, India / Remote (UTC+5:30)'}
                      className="w-full bg-soft border border-border rounded-2xl pl-10 pr-4 py-3 text-sm font-semibold text-ink focus:outline-none focus:border-purple focus:bg-white transition-all"
                    />
                    <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/40 pointer-events-none" />
                  </div>
                </div>
              </div>
            </section>

            {/* ====================================================
                HIRER ONLY: SECTION 2 (COMPANY & BRAND INFORMATION)
                ==================================================== */}
            {isClient && (
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
                </div>
              </section>
            )}

            {/* 2. ABOUT ME (FREELANCER) / 3. ABOUT & HIRING PHILOSOPHY (HIRER) */}
            <section className="bg-white rounded-[28px] p-6 sm:p-8 border border-border/70 shadow-[0_4px_24px_rgba(0,0,0,0.04)] space-y-6">
              <div className="flex items-center justify-between border-b border-border/60 pb-4">
                <div>
                  <h2 className="font-display text-xl font-bold text-ink">
                    {isClient ? '3. About Company & Hiring Philosophy' : '2. About Me'}
                  </h2>
                  <p className="text-xs text-ink/50 font-medium mt-0.5">
                    {isClient
                      ? 'Share your organization’s mission, project scope, and how you collaborate with talent.'
                      : 'Detail your background, core domain skills, languages, and experience.'}
                  </p>
                </div>
                <Sparkles size={20} className="text-orange" />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-ink/70">
                  {isClient ? 'Company / Hirer Overview' : 'Professional Bio'}
                </label>
                <textarea
                  rows={4}
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder={
                    isClient
                      ? 'Share a concise overview of your company mission, ongoing initiatives, and engineering/design culture...'
                      : 'Introduce yourself, your engineering or design philosophy, past deliverables, and the value you bring to clients...'
                  }
                  className="w-full bg-soft border border-border rounded-2xl p-4 text-sm font-medium text-ink focus:outline-none focus:border-purple focus:bg-white transition-all leading-relaxed"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-ink/70">
                  {isClient ? 'Technologies Used in Projects or Preferred Tech Stack' : 'Core Skills & Technologies'}
                </label>
                <input
                  type="text"
                  value={formData.skills}
                  onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                  placeholder="e.g. React, Next.js, TypeScript, Node.js, Python, Figma, TailwindCSS"
                  className="w-full bg-soft border border-border rounded-2xl px-4 py-3 text-sm font-semibold text-ink focus:outline-none focus:border-purple focus:bg-white transition-all"
                />
                <p className="text-[11px] text-ink/50 font-medium">
                  Separate each skill with a comma (e.g. React, TypeScript, GraphQL).
                </p>
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

                {!isClient ? (
                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-ink/70">
                      Languages Spoken
                    </label>
                    <input
                      type="text"
                      value={formData.languages}
                      onChange={(e) => setFormData({ ...formData, languages: e.target.value })}
                      placeholder="e.g. English (Fluent), Spanish (Conversational), Hindi (Native)"
                      className="w-full bg-soft border border-border rounded-2xl px-4 py-3 text-sm font-semibold text-ink focus:outline-none focus:border-purple focus:bg-white transition-all"
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-ink/70">
                      Typical Budget Benchmark (₹ / hr)
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
                )}
              </div>
            </section>

            {/* ====================================================
                FREELANCER ONLY: SECTION 3 (PROFESSIONAL LINKS & RESUME)
                ==================================================== */}
            {!isClient && (
              <section className="bg-white rounded-[28px] p-6 sm:p-8 border border-border/70 shadow-[0_4px_24px_rgba(0,0,0,0.04)] space-y-6">
                <div className="flex items-center justify-between border-b border-border/60 pb-4">
                  <div>
                    <h2 className="font-display text-xl font-bold text-ink">
                      3. Professional Links & Resume
                    </h2>
                    <p className="text-xs text-ink/50 font-medium mt-0.5">
                      Connect your GitHub, LinkedIn, external portfolio, and upload your verified PDF resume.
                    </p>
                  </div>
                  <Globe size={20} className="text-purple" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-ink/70 flex items-center gap-1.5">
                      <Github size={13} className="text-ink" />
                      <span>GitHub Profile URL</span>
                    </label>
                    <input
                      type="url"
                      value={formData.githubUrl}
                      onChange={(e) => setFormData({ ...formData, githubUrl: e.target.value })}
                      placeholder="https://github.com/yourhandle"
                      className="w-full bg-soft border border-border rounded-2xl px-4 py-3 text-sm font-semibold text-ink focus:outline-none focus:border-purple focus:bg-white transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-ink/70 flex items-center gap-1.5">
                      <Linkedin size={13} className="text-[#0077B5]" />
                      <span>LinkedIn Profile URL</span>
                    </label>
                    <input
                      type="url"
                      value={formData.linkedinUrl}
                      onChange={(e) => setFormData({ ...formData, linkedinUrl: e.target.value })}
                      placeholder="https://linkedin.com/in/yourprofile"
                      className="w-full bg-soft border border-border rounded-2xl px-4 py-3 text-sm font-semibold text-ink focus:outline-none focus:border-purple focus:bg-white transition-all"
                    />
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-ink/70 flex items-center gap-1.5">
                      <Globe size={13} className="text-cyan" />
                      <span>Portfolio Website URL</span>
                    </label>
                    <input
                      type="url"
                      value={formData.portfolioUrl}
                      onChange={(e) => setFormData({ ...formData, portfolioUrl: e.target.value })}
                      placeholder="https://yourportfolio.dev"
                      className="w-full bg-soft border border-border rounded-2xl px-4 py-3 text-sm font-semibold text-ink focus:outline-none focus:border-purple focus:bg-white transition-all"
                    />
                  </div>

                  {/* Resume / CV PDF Upload */}
                  <div className="space-y-3 sm:col-span-2 p-5 rounded-2xl bg-soft/60 border border-border/60">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText size={18} className="text-purple" />
                        <div>
                          <span className="text-xs font-bold text-ink block">Resume / CV Document (PDF)</span>
                          <span className="text-[11px] text-ink/50 font-medium">
                            Clients can preview or download your verified resume directly.
                          </span>
                        </div>
                      </div>
                      {formData.resumeUrl && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-200">
                          <Check size={11} />
                          <span>PDF Attached</span>
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 pt-2">
                      <label className="btn-secondary !py-2 !px-4 !text-xs cursor-pointer inline-flex items-center gap-2 hover:border-purple/40">
                        <Upload size={14} className="text-purple" />
                        <span>{uploadingResume ? 'Uploading...' : formData.resumeUrl ? 'Replace PDF' : 'Upload Resume PDF'}</span>
                        <input
                          type="file"
                          accept=".pdf,application/pdf"
                          onChange={handleResumeUpload}
                          disabled={uploadingResume}
                          className="hidden"
                        />
                      </label>

                      {formData.resumeUrl && (
                        <>
                          <a
                            href={formData.resumeUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="btn-secondary !py-2 !px-3.5 !text-xs inline-flex items-center gap-1.5 text-purple hover:underline"
                          >
                            <ExternalLink size={13} />
                            <span>Preview Attached PDF</span>
                          </a>
                          <button
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({ ...prev, resumeUrl: '' }));
                              toast.info('Resume attachment removed');
                            }}
                            className="text-xs font-semibold text-coral hover:text-coral/80 bg-transparent border-0 cursor-pointer inline-flex items-center gap-1"
                          >
                            <Trash2 size={13} />
                            <span>Remove</span>
                          </button>
                        </>
                      )}
                    </div>

                    <div className="pt-2">
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-ink/50 mb-1">
                        Or enter direct Resume Link
                      </label>
                      <input
                        type="url"
                        value={formData.resumeUrl.startsWith('data:') ? 'Embedded PDF Document (Uploaded)' : formData.resumeUrl}
                        onChange={(e) => {
                          if (!e.target.value.startsWith('Embedded PDF')) {
                            setFormData({ ...formData, resumeUrl: e.target.value });
                          }
                        }}
                        placeholder="https://drive.google.com/... or https://domain.com/resume.pdf"
                        className="w-full bg-white border border-border rounded-xl px-3.5 py-2 text-xs font-semibold text-ink focus:outline-none focus:border-purple"
                      />
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* 4. PORTFOLIO PROJECTS */}
            <section className="bg-white rounded-[28px] p-6 sm:p-8 border border-border/70 shadow-[0_4px_24px_rgba(0,0,0,0.04)] space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-4">
                <div>
                  <h2 className="font-display text-xl font-bold text-ink">
                    {isClient ? '4. Past Projects & Hiring History' : '4. Portfolio Projects'}
                  </h2>
                  <p className="text-xs text-ink/50 font-medium mt-0.5">
                    {isClient
                      ? 'Showcase products, ventures, and previous projects to help freelancers understand your work and build trust.'
                      : 'Highlight your best engineering deliverables, live demos, tech stacks, and project roles.'}
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
                        githubLink: '',
                        duration: '',
                        roleInProject: '',
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
                      : (isClient ? 'Add Past Project' : 'Add Portfolio Project')}
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
                        placeholder={isClient ? 'e.g. AI Resume Analyzer' : 'e.g. Enterprise Microservices Architecture'}
                        className="w-full bg-white border border-border rounded-xl px-3.5 py-2.5 text-xs font-semibold text-ink focus:outline-none focus:border-purple"
                      />
                    </div>

                    {!isClient ? (
                      <>
                        <div className="space-y-1.5">
                          <label className="block text-xs font-bold text-ink/70">Role in Project</label>
                          <input
                            type="text"
                            value={newProject.roleInProject}
                            onChange={(e) => setNewProject({ ...newProject, roleInProject: e.target.value })}
                            placeholder="e.g. Lead Frontend Architect / Full-Stack Engineer"
                            className="w-full bg-white border border-border rounded-xl px-3.5 py-2.5 text-xs font-semibold text-ink focus:outline-none focus:border-purple"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-xs font-bold text-ink/70">Duration</label>
                          <input
                            type="text"
                            value={newProject.duration}
                            onChange={(e) => setNewProject({ ...newProject, duration: e.target.value })}
                            placeholder="e.g. 3 Months / Jan 2024 - Apr 2024"
                            className="w-full bg-white border border-border rounded-xl px-3.5 py-2.5 text-xs font-semibold text-ink focus:outline-none focus:border-purple"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-xs font-bold text-ink/70">GitHub Repository Link</label>
                          <input
                            type="url"
                            value={newProject.githubLink}
                            onChange={(e) => setNewProject({ ...newProject, githubLink: e.target.value })}
                            placeholder="https://github.com/yourhandle/project"
                            className="w-full bg-white border border-border rounded-xl px-3.5 py-2.5 text-xs font-semibold text-ink focus:outline-none focus:border-purple"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-xs font-bold text-ink/70">Live Demo / Production URL</label>
                          <input
                            type="url"
                            value={newProject.projectLink}
                            onChange={(e) => setNewProject({ ...newProject, projectLink: e.target.value })}
                            placeholder="https://yourprojectdemo.com"
                            className="w-full bg-white border border-border rounded-xl px-3.5 py-2.5 text-xs font-semibold text-ink focus:outline-none focus:border-purple"
                          />
                        </div>
                      </>
                    ) : (
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

                        <div className="space-y-1.5 sm:col-span-2">
                          <label className="block text-xs font-bold text-ink/70">Project / Live URL</label>
                          <input
                            type="url"
                            value={newProject.projectLink}
                            onChange={(e) => setNewProject({ ...newProject, projectLink: e.target.value })}
                            placeholder="https://example.com"
                            className="w-full bg-white border border-border rounded-xl px-3.5 py-2.5 text-xs font-semibold text-ink focus:outline-none focus:border-purple"
                          />
                        </div>
                      </>
                    )}

                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="block text-xs font-bold text-ink/70">Project Cover Image URL</label>
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
                        Tech Stack (Comma Separated)
                      </label>
                      <input
                        type="text"
                        value={newProject.technologies}
                        onChange={(e) => setNewProject({ ...newProject, technologies: e.target.value })}
                        placeholder="e.g. Next.js, TypeScript, PostgreSQL, TailwindCSS, Docker"
                        className="w-full bg-white border border-border rounded-xl px-3.5 py-2.5 text-xs font-semibold text-ink focus:outline-none focus:border-purple"
                      />
                    </div>

                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="block text-xs font-bold text-ink/70">
                        Project Description
                      </label>
                      <textarea
                        rows={2}
                        value={newProject.description}
                        onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                        placeholder="What problem did you solve, what was the technical architecture, and what was the outcome?"
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
                          githubLink: '',
                          duration: '',
                          roleInProject: '',
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
                      : 'Showcase your best engineering and design projects with live demo links and technical architecture.'}
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
                              {item.roleInProject && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple/10 text-purple">
                                  {item.roleInProject}
                                </span>
                              )}
                              {item.duration && (
                                <span className="text-[10px] font-medium text-ink/50 bg-white px-2 py-0.5 rounded-full border border-border/40">
                                  {item.duration}
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

                      <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-border/30 text-[11px] font-bold">
                        {item.projectLink && (
                          <a
                            href={item.projectLink}
                            target="_blank"
                            rel="noreferrer"
                            className="text-purple hover:underline inline-flex items-center gap-1"
                          >
                            <span>Live Demo</span>
                            <ExternalLink size={11} />
                          </a>
                        )}
                        {item.githubLink && (
                          <a
                            href={item.githubLink}
                            target="_blank"
                            rel="noreferrer"
                            className="text-ink/70 hover:text-ink inline-flex items-center gap-1"
                          >
                            <Github size={11} />
                            <span>Repository</span>
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* ====================================================
                FREELANCER ONLY: SECTION 5 (WORK PREFERENCES)
                ==================================================== */}
            {!isClient && (
              <section className="bg-white rounded-[28px] p-6 sm:p-8 border border-border/70 shadow-[0_4px_24px_rgba(0,0,0,0.04)] space-y-6">
                <div className="flex items-center justify-between border-b border-border/60 pb-4">
                  <div>
                    <h2 className="font-display text-xl font-bold text-ink">
                      5. Work Preferences
                    </h2>
                    <p className="text-xs text-ink/50 font-medium mt-0.5">
                      Define your engagement terms, hourly billing rate, and project types.
                    </p>
                  </div>
                  <DollarSign size={20} className="text-emerald-600" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-ink/70">
                      Availability Status
                    </label>
                    <select
                      value={formData.availabilityStatus}
                      onChange={(e) => setFormData({ ...formData, availabilityStatus: e.target.value })}
                      className="w-full bg-soft border border-border rounded-2xl px-4 py-3 text-sm font-semibold text-ink focus:outline-none focus:border-purple focus:bg-white transition-all cursor-pointer"
                    >
                      <option value="Available Now">Available Now</option>
                      <option value="Part-Time">Part-Time</option>
                      <option value="Full-Time Freelance">Full-Time Freelance</option>
                      <option value="Unavailable">Unavailable</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-ink/70">
                      Hourly Rate (₹ / hr)
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-ink/50 text-sm">₹</span>
                      <input
                        type="number"
                        min="0"
                        step="100"
                        value={formData.hourlyRate}
                        onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
                        placeholder="2500"
                        className="w-full bg-soft border border-border rounded-2xl pl-8 pr-4 py-3 text-sm font-semibold text-ink focus:outline-none focus:border-purple focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-2 sm:col-span-2 pt-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-ink/70 mb-2">
                      Preferred Work Types
                    </label>
                    <div className="flex flex-wrap gap-2.5">
                      {[
                        'Short-Term Projects',
                        'Long-Term Projects',
                        'Contract Work',
                        'Internship Opportunities',
                      ].map((type) => {
                        const isSelected = formData.preferredWorkTypes.includes(type);
                        return (
                          <button
                            key={type}
                            type="button"
                            onClick={() => handleToggleWorkType(type)}
                            className={`px-4 py-2 rounded-2xl text-xs font-bold border transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                              isSelected
                                ? 'bg-purple text-white border-purple shadow-sm'
                                : 'bg-soft text-ink/70 border-border/60 hover:bg-white hover:border-purple/30'
                            }`}
                          >
                            {isSelected && <Check size={13} className="stroke-[3]" />}
                            <span>{type}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* ====================================================
                FREELANCER ONLY: SECTION 6 (CERTIFICATIONS & ACHIEVEMENTS)
                ==================================================== */}
            {!isClient && (
              <section className="bg-white rounded-[28px] p-6 sm:p-8 border border-border/70 shadow-[0_4px_24px_rgba(0,0,0,0.04)] space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-4">
                  <div>
                    <h2 className="font-display text-xl font-bold text-ink">
                      6. Certifications & Achievements
                    </h2>
                    <p className="text-xs text-ink/50 font-medium mt-0.5">
                      Add verified professional credentials, degrees, or industry badges.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAddCert(!showAddCert)}
                    className="btn-secondary !py-2 !px-3.5 !text-xs self-start sm:self-auto inline-flex items-center gap-1.5"
                  >
                    <Plus size={14} />
                    <span>{showAddCert ? 'Cancel' : 'Add Certification'}</span>
                  </button>
                </div>

                {/* Add Certification Form */}
                {showAddCert && (
                  <div className="bg-soft/70 rounded-2xl p-5 border border-purple/20 space-y-4">
                    <h4 className="text-xs font-bold text-ink uppercase tracking-wider">New Certification</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-ink/70">Certification Name *</label>
                        <input
                          type="text"
                          value={newCert.name}
                          onChange={(e) => setNewCert({ ...newCert, name: e.target.value })}
                          placeholder="e.g. AWS Certified Solutions Architect"
                          className="w-full bg-white border border-border rounded-xl px-3.5 py-2.5 text-xs font-semibold text-ink focus:outline-none focus:border-purple"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-ink/70">Issuing Organization *</label>
                        <input
                          type="text"
                          value={newCert.issuer}
                          onChange={(e) => setNewCert({ ...newCert, issuer: e.target.value })}
                          placeholder="e.g. Amazon Web Services, Google, Meta"
                          className="w-full bg-white border border-border rounded-xl px-3.5 py-2.5 text-xs font-semibold text-ink focus:outline-none focus:border-purple"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-ink/70">Issue Date</label>
                        <input
                          type="text"
                          value={newCert.issueDate}
                          onChange={(e) => setNewCert({ ...newCert, issueDate: e.target.value })}
                          placeholder="e.g. Nov 2024"
                          className="w-full bg-white border border-border rounded-xl px-3.5 py-2.5 text-xs font-semibold text-ink focus:outline-none focus:border-purple"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-ink/70">Credential URL</label>
                        <input
                          type="url"
                          value={newCert.credentialUrl}
                          onChange={(e) => setNewCert({ ...newCert, credentialUrl: e.target.value })}
                          placeholder="https://credly.com/badges/..."
                          className="w-full bg-white border border-border rounded-xl px-3.5 py-2.5 text-xs font-semibold text-ink focus:outline-none focus:border-purple"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowAddCert(false)}
                        className="btn-secondary !py-1.5 !px-3 !text-xs"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleAddCert}
                        className="btn-primary !py-1.5 !px-4 !text-xs"
                      >
                        Save Certification
                      </button>
                    </div>
                  </div>
                )}

                {/* List of certifications */}
                {certifications.length === 0 ? (
                  <div className="text-center py-8 px-4 rounded-2xl bg-soft/40 border border-border/50 space-y-2">
                    <Award size={28} className="mx-auto text-ink/30" />
                    <p className="text-xs font-bold text-ink/70">No certifications added yet</p>
                    <p className="text-[11px] text-ink/45 max-w-md mx-auto">
                      Add industry certifications or credentials to verify your expertise and rank higher for gigs.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {certifications.map((cert, idx) => (
                      <div
                        key={idx}
                        className="bg-soft/50 rounded-2xl p-4 border border-border/50 hover:bg-white transition-all flex items-start justify-between gap-3"
                      >
                        <div className="min-w-0 space-y-1">
                          <h4 className="font-bold text-sm text-ink truncate">{cert.name}</h4>
                          <p className="text-xs text-ink/60 font-medium">{cert.issuer}</p>
                          {cert.issueDate && (
                            <p className="text-[11px] text-ink/45">Issued: {cert.issueDate}</p>
                          )}
                          {cert.credentialUrl && (
                            <a
                              href={cert.credentialUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] font-bold text-purple hover:underline inline-flex items-center gap-1 pt-1"
                            >
                              <span>View Credential</span>
                              <ExternalLink size={11} />
                            </a>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteCert(idx)}
                          className="text-ink/40 hover:text-coral transition-colors p-1"
                          title="Remove Certification"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* SECTION: AVAILABILITY & RESPONSE TIME (SECTION 8) */}
            <section className="bg-white rounded-[28px] p-6 sm:p-8 border border-border/70 shadow-[0_4px_24px_rgba(0,0,0,0.04)] space-y-6">
              <div className="flex items-center justify-between border-b border-border/60 pb-4">
                <div>
                  <h2 className="font-display text-xl font-bold text-ink">
                    {isClient ? '5. Response Time & Communication Cadence' : '7. Availability & Response Time'}
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

            {/* SECTION: DIRECT PAYOUT & ESCROW DISBURSEMENT (SECTION 8 - FREELANCERS) */}
            {!isClient && (
              <section className="bg-white rounded-[28px] p-6 sm:p-8 border border-border/70 shadow-[0_4px_24px_rgba(0,0,0,0.04)] space-y-6">
                <div className="flex items-center justify-between border-b border-border/60 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-display text-xl font-bold text-ink">
                        8. Payout & Bank Details
                      </h2>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                        Automated Payouts (90% Net)
                      </span>
                    </div>
                    <p className="text-xs text-ink/50 font-medium mt-1">
                      Set your automated payout destination. When clients approve your milestone deliverables, your 90% net earnings are immediately transferred here via Razorpay Route / IMPS without manual delays.
                    </p>
                  </div>
                  <Wallet size={22} className="text-emerald-600 shrink-0" />
                </div>

                {/* Payout Method Selector */}
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, payoutMethod: 'upi' })}
                      className={`w-full sm:flex-1 py-3 px-4 rounded-2xl text-xs font-bold border transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        formData.payoutMethod === 'upi'
                          ? 'bg-purple/10 border-purple text-purple shadow-sm'
                          : 'bg-soft border-border text-ink/60 hover:text-ink'
                      }`}
                    >
                      <Sparkles size={14} />
                      <span>UPI ID (Instant IMPS Payout)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, payoutMethod: 'bank_transfer' })}
                      className={`w-full sm:flex-1 py-3 px-4 rounded-2xl text-xs font-bold border transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        formData.payoutMethod === 'bank_transfer'
                          ? 'bg-purple/10 border-purple text-purple shadow-sm'
                          : 'bg-soft border-border text-ink/60 hover:text-ink'
                      }`}
                    >
                      <CreditCard size={14} />
                      <span>Bank Account (NEFT / IMPS)</span>
                    </button>
                  </div>

                  {formData.payoutMethod === 'upi' ? (
                    <div className="space-y-2">
                      <label className="block text-xs font-bold uppercase tracking-wider text-ink/70">
                        Virtual Payment Address / UPI ID
                      </label>
                      <input
                        type="text"
                        value={formData.upiId}
                        onChange={(e) => setFormData({ ...formData, upiId: e.target.value })}
                        placeholder="e.g. yourname@okhdfcbank or 9876543210@paytm"
                        className="w-full bg-soft border border-border rounded-2xl px-4 py-3 text-sm font-semibold text-ink focus:outline-none focus:border-purple focus:bg-white transition-all font-mono"
                      />
                      <p className="text-[11px] text-ink/40">
                        Funds are dispatched directly to your UPI-linked bank account within seconds of milestone approval.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="block text-xs font-bold uppercase tracking-wider text-ink/70">
                          Account Holder Name
                        </label>
                        <input
                          type="text"
                          value={formData.accountHolderName}
                          onChange={(e) => setFormData({ ...formData, accountHolderName: e.target.value })}
                          placeholder="e.g. John Doe"
                          className="w-full bg-soft border border-border rounded-2xl px-4 py-3 text-sm font-semibold text-ink focus:outline-none focus:border-purple focus:bg-white transition-all"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-xs font-bold uppercase tracking-wider text-ink/70">
                          Bank Name
                        </label>
                        <input
                          type="text"
                          value={formData.bankName}
                          onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                          placeholder="e.g. HDFC Bank, ICICI Bank, SBI"
                          className="w-full bg-soft border border-border rounded-2xl px-4 py-3 text-sm font-semibold text-ink focus:outline-none focus:border-purple focus:bg-white transition-all"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-xs font-bold uppercase tracking-wider text-ink/70">
                          Account Number
                        </label>
                        <input
                          type="text"
                          value={formData.accountNumber}
                          onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                          placeholder="e.g. 50100234567890"
                          className="w-full bg-soft border border-border rounded-2xl px-4 py-3 text-sm font-semibold text-ink focus:outline-none focus:border-purple focus:bg-white transition-all font-mono"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-xs font-bold uppercase tracking-wider text-ink/70">
                          IFSC Code
                        </label>
                        <input
                          type="text"
                          value={formData.ifscCode}
                          onChange={(e) => setFormData({ ...formData, ifscCode: e.target.value.toUpperCase() })}
                          placeholder="e.g. HDFC0001234"
                          className="w-full bg-soft border border-border rounded-2xl px-4 py-3 text-sm font-semibold text-ink focus:outline-none focus:border-purple focus:bg-white transition-all font-mono uppercase"
                        />
                      </div>
                    </div>
                  )}

                  <div className="p-3 bg-emerald-50/70 rounded-2xl border border-emerald-200/60 flex items-center gap-2.5 text-xs text-emerald-800 font-medium">
                    <ShieldCheck size={16} className="text-emerald-700 shrink-0" />
                    <span>Vault Protected: Your payment details are encrypted and securely used for automated escrow milestone disbursements.</span>
                  </div>
                </div>
              </section>
            )}

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
                  {isClient ? 'Verified Employer' : 'Verified Freelancer'}
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
                    {formData.roleTitle || (isClient ? 'Marketplace Client' : 'Independent Specialist')}
                  </p>
                  {isClient && formData.company && (
                    <p className="text-xs text-purple font-bold truncate">
                      {formData.company}
                    </p>
                  )}
                  {!isClient && formData.hourlyRate && (
                    <p className="text-xs text-emerald-700 font-bold">
                      ₹{Number(formData.hourlyRate).toLocaleString('en-IN')} / hr
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
                {!isClient && (
                  <div className="flex items-center gap-1.5 pt-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-bold text-emerald-800">{formData.availabilityStatus}</span>
                  </div>
                )}
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
                <span className="font-bold text-xs text-ink">
                  {isClient ? 'Hirer Credibility' : 'Profile Completeness'}
                </span>
                <span className="text-xs font-bold text-purple">{score}% Complete</span>
              </div>
              <div className="w-full h-2 bg-white rounded-full overflow-hidden border border-purple/10">
                <div className="h-full gradient-primary rounded-full transition-all duration-300" style={{ width: `${score}%` }} />
              </div>

              {isClient ? (
                /* Hirer Checklist */
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
              ) : (
                /* Freelancer Dynamic Checklist */
                <ul className="space-y-2 text-xs text-ink/70 font-medium pt-1">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={14} className={formData.name && formData.roleTitle && formData.location ? 'text-emerald-600 shrink-0' : 'text-ink/30 shrink-0'} />
                    <span>Section 1: Personal Info & Title</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={14} className={formData.bio && formData.skills ? 'text-emerald-600 shrink-0' : 'text-ink/30 shrink-0'} />
                    <span>Section 2: Bio, Skills & Languages</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={14} className={formData.githubUrl || formData.linkedinUrl || formData.resumeUrl ? 'text-emerald-600 shrink-0' : 'text-ink/30 shrink-0'} />
                    <span>Section 3: Professional Links & CV</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={14} className={portfolio.length > 0 ? 'text-emerald-600 shrink-0' : 'text-ink/30 shrink-0'} />
                    <span>Section 4: Portfolio Projects</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={14} className={formData.hourlyRate && formData.availabilityStatus ? 'text-emerald-600 shrink-0' : 'text-ink/30 shrink-0'} />
                    <span>Section 5: Work Preferences</span>
                  </li>
                </ul>
              )}
            </div>

          </aside>

        </form>

      </div>

    </div>
  );
}
