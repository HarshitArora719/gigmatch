import { useState } from 'react';
import api from '../lib/axios';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Upload } from 'lucide-react';
import { toast } from 'sonner';

export default function PortfolioUpload({ onUploadSuccess }: { onUploadSuccess?: () => void }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('image', file);

    try {
      await api.post('/api/users/portfolio', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Portfolio item uploaded successfully!');
      setTitle('');
      setDescription('');
      setFile(null);
      onUploadSuccess?.();
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="glass-card p-6">
      <h3 className="font-display mb-5 flex items-center gap-2 font-semibold">
        <Upload size={18} className="text-[var(--accent-teal)]" />
        Add Portfolio Work
      </h3>

      <form onSubmit={handleUpload} className="space-y-4">
        <div>
          <label className="gm-label">Project Title</label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="E.g. YouTube Thumbnail Design"
            required
          />
        </div>

        <div>
          <label className="gm-label">Description</label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of the project..."
            rows={3}
          />
        </div>

        <div>
          <label className="gm-label">Upload Image / Work</label>
          <Input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            required
          />
        </div>

        <Button type="submit" className="w-full" disabled={uploading}>
          {uploading ? 'Uploading...' : 'Upload to Portfolio'}
        </Button>
      </form>
    </div>
  );
}
