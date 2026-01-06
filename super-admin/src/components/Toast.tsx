import React from 'react';

export default function Toast({ message, onClose }: { message: string; onClose: ()=>void }) {
  if (!message) return null as any;
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-blue-600 text-white px-4 py-3 rounded shadow flex items-center space-x-3">
        <span>{message}</span>
        <button className="bg-white/20 px-2 py-1 rounded" onClick={onClose}>Dismiss</button>
      </div>
    </div>
  );
}
