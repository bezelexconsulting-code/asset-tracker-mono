import { useState } from 'react';
import { supabase, SUPABASE_CONFIGURED } from '../lib/supabase';

interface Props {
  orgId: string;
  assetId: string;
  initialUrl?: string;
  onUploaded?: (url: string) => void;
  className?: string;
}

export default function AssetImageUploader({ orgId, assetId, initialUrl, onUploaded, className = '' }: Props) {
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(initialUrl);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setError(null);
    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);
    if (!SUPABASE_CONFIGURED) return;
    setUploading(true);
    const path = `${orgId}/${assetId}/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage.from('assets').upload(path, file, { upsert: true });
    if (uploadError) {
      setError(uploadError.message);
      setUploading(false);
      return;
    }
    const { data } = supabase.storage.from('assets').getPublicUrl(path);
    const url = data.publicUrl;
    const { error: updateError } = await supabase
      .from('assets')
      .update({ image_url: url })
      .eq('id', assetId);
    if (updateError) {
      setError(updateError.message);
    }
    setPreviewUrl(url);
    setUploading(false);
    onUploaded?.(url);
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center space-x-4">
        <div className="w-32 h-32 bg-gray-100 border border-gray-200 rounded overflow-hidden flex items-center justify-center">
          {previewUrl ? (
            <img src={previewUrl} alt="Asset" className="w-full h-full object-cover" />
          ) : (
            <span className="text-gray-400 text-xs">No Image</span>
          )}
        </div>
        <div>
          <label className="inline-flex items-center px-3 py-2 rounded-md bg-blue-600 text-white cursor-pointer">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />
            {uploading ? 'Uploading...' : 'Upload Image'}
          </label>
          {!SUPABASE_CONFIGURED && (
            <div className="mt-2 text-xs text-yellow-700">Storage requires Supabase configuration.</div>
          )}
          {error && <div className="mt-2 text-xs text-red-700">{error}</div>}
        </div>
      </div>
    </div>
  );
}
