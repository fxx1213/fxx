import React, { useMemo } from 'react';
import { Note, NoteType } from '../types';

interface NoteItemProps {
  note: Note;
}

const NoteItem: React.FC<NoteItemProps> = ({ note }) => {
  const formattedDate = useMemo(() => {
    return new Date(note.createdAt).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, [note.createdAt]);

  const typeColor = useMemo(() => {
    switch (note.type) {
      case NoteType.SUMMARY: return 'bg-blue-100 text-blue-700';
      case NoteType.ACTION_ITEMS: return 'bg-green-100 text-green-700';
      case NoteType.JOURNAL: return 'bg-purple-100 text-purple-700';
      case NoteType.IDEA: return 'bg-amber-100 text-amber-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  }, [note.type]);

  const typeLabel = useMemo(() => {
    switch (note.type) {
      case NoteType.ACTION_ITEMS: return 'Action Items';
      default: return note.type.charAt(0) + note.type.slice(1).toLowerCase();
    }
  }, [note.type]);

  if (note.isLoading) {
    return (
      <div className="w-full p-6 bg-white rounded-2xl shadow-sm border border-slate-100 animate-pulse">
        <div className="h-4 bg-slate-200 rounded w-1/4 mb-4"></div>
        <div className="h-3 bg-slate-100 rounded w-full mb-2"></div>
        <div className="h-3 bg-slate-100 rounded w-5/6 mb-2"></div>
        <div className="h-3 bg-slate-100 rounded w-4/6"></div>
      </div>
    );
  }

  return (
    <div className="w-full bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition duration-300">
      <div className="p-5">
        <div className="flex justify-between items-start mb-3">
          <div className="flex flex-col">
             <span className="text-xs font-medium text-slate-400 mb-1">{formattedDate}</span>
             <h3 className="text-lg font-bold text-slate-800 leading-tight">{note.title}</h3>
          </div>
          <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-full tracking-wide ${typeColor}`}>
            {typeLabel}
          </span>
        </div>
        
        <div className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">
          {note.processedContent}
        </div>
        
        {note.type !== NoteType.RAW && note.originalText !== note.processedContent && (
           <details className="mt-4 group">
             <summary className="text-xs text-slate-400 cursor-pointer hover:text-slate-600 list-none flex items-center gap-1">
               <span>Show original transcript</span>
               <svg className="w-3 h-3 transition group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
             </summary>
             <p className="mt-2 text-xs text-slate-400 italic bg-slate-50 p-3 rounded-lg">
               "{note.originalText}"
             </p>
           </details>
        )}
      </div>
    </div>
  );
};

export default NoteItem;
