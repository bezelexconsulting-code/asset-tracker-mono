import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function OrgLanding() {
  const navigate = useNavigate();
  const [slug, setSlug] = useState('');
  return (
    <div className="max-w-md mx-auto mt-16 bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
      <div className="flex items-center justify-center">
        <img src="/branding/promoimage.png" alt="App" className="w-48 h-48 object-contain" />
      </div>
      <div>
        <h1 className="text-2xl font-bold">Welcome</h1>
        <p className="mt-2 text-gray-600">Enter your organization to sign in.</p>
      </div>
      <div>
        <label className="text-sm text-gray-700">Organization Slug</label>
        <input className="mt-1 w-full border border-gray-300 rounded px-3 py-2" value={slug} onChange={(e)=> setSlug(e.target.value)} placeholder="e.g. acme-co" />
      </div>
      <button className="w-full px-3 py-2 rounded bg-blue-600 text-white" onClick={()=>{ if(!slug) return; navigate(`/${slug}/login`); }}>Continue</button>
    </div>
  );
}
