import React, { useState, useEffect, useRef } from 'react';
import { Note, NoteType } from './types';
import { transcribeAudio } from './services/siliconFlowService';
import { processNoteContent } from './services/geminiService';
import { MicIcon, StopIcon, SettingsIcon, CheckIcon } from './components/Icons';
import SettingsModal from './components/SettingsModal';
import NoteItem from './components/NoteItem';

const STORAGE_KEY_TOKEN = 'voice_note_siliconflow_token';
const STORAGE_KEY_NOTES = 'voice_note_history';

const PROMPT_OPTIONS = [
  { id: NoteType.RAW, label: 'Transcribe Only', color: 'bg-slate-100 text-slate-600' },
  { id: NoteType.SUMMARY, label: 'Summary', color: 'bg-blue-100 text-blue-600' },
  { id: NoteType.ACTION_ITEMS, label: 'Action Items', color: 'bg-green-100 text-green-600' },
  { id: NoteType.JOURNAL, label: 'Journal', color: 'bg-purple-100 text-purple-600' },
  { id: NoteType.IDEA, label: 'Idea', color: 'bg-amber-100 text-amber-600' },
];

const App: React.FC = () => {
  // State
  const [notes, setNotes] = useState<Note[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [siliconFlowToken, setSiliconFlowToken] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState<NoteType>(NoteType.RAW);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Initialization
  useEffect(() => {
    const savedToken = localStorage.getItem(STORAGE_KEY_TOKEN);
    if (savedToken) setSiliconFlowToken(savedToken);

    const savedNotes = localStorage.getItem(STORAGE_KEY_NOTES);
    if (savedNotes) {
      try {
        setNotes(JSON.parse(savedNotes));
      } catch (e) {
        console.error("Failed to load notes", e);
      }
    }
  }, []);

  // Persist notes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_NOTES, JSON.stringify(notes));
  }, [notes]);

  // Handlers
  const handleSaveSettings = (token: string) => {
    setSiliconFlowToken(token);
    localStorage.setItem(STORAGE_KEY_TOKEN, token);
    setIsSettingsOpen(false);
  };

  const startRecording = async () => {
    if (!siliconFlowToken) {
      setIsSettingsOpen(true);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = handleRecordingStop;
      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert("Could not access microphone. Please check permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      // Stop all tracks to release microphone
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const handleRecordingStop = async () => {
    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
    const tempId = Date.now().toString();

    // Create a temporary "Loading" note
    const tempNote: Note = {
      id: tempId,
      title: "Processing audio...",
      originalText: "",
      processedContent: "",
      createdAt: Date.now(),
      type: selectedPrompt,
      isLoading: true
    };

    setNotes(prev => [tempNote, ...prev]);
    setIsProcessing(true);

    try {
      // 1. Transcribe (SiliconFlow)
      const transcript = await transcribeAudio(audioBlob, siliconFlowToken);
      
      // 2. Process (Gemini)
      const processed = await processNoteContent(transcript, selectedPrompt);

      // 3. Update Note
      setNotes(prev => prev.map(n => {
        if (n.id === tempId) {
          return {
            ...n,
            title: processed.title,
            originalText: transcript,
            processedContent: processed.content,
            isLoading: false
          };
        }
        return n;
      }));

    } catch (error: any) {
      console.error("Pipeline failed", error);
      // Remove temp note and alert
      setNotes(prev => prev.filter(n => n.id !== tempId));
      alert(`Error: ${error.message || "Failed to process audio"}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center relative max-w-md mx-auto shadow-2xl overflow-hidden md:min-h-[800px] md:max-h-[900px] md:rounded-[3rem] md:my-10 border border-slate-200 md:border-slate-100">
      
      {/* Header */}
      <header className="w-full pt-12 pb-4 px-6 bg-white/80 backdrop-blur-md sticky top-0 z-30 border-b border-slate-100 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
            VoiceNote AI
          </h1>
          <p className="text-xs text-slate-400 font-medium">Capture & Transform</p>
        </div>
        <button 
          onClick={() => setIsSettingsOpen(true)} 
          className="p-2 bg-slate-50 hover:bg-slate-100 rounded-full transition"
        >
          <SettingsIcon className={`w-6 h-6 ${!siliconFlowToken ? 'text-red-500 animate-pulse' : 'text-slate-600'}`} />
        </button>
      </header>

      {/* Main Content Area (Scrollable) */}
      <main className="flex-1 w-full overflow-y-auto px-4 py-6 scroll-smooth no-scrollbar">
        {notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-slate-400 mt-20">
            <div className="w-32 h-32 mb-6 bg-slate-100 rounded-full flex items-center justify-center">
              <MicIcon className="w-12 h-12 opacity-20" />
            </div>
            <p className="text-lg font-medium text-slate-500">No notes yet</p>
            <p className="text-sm max-w-xs mt-2">
              Select a template below and tap the microphone to start recording.
            </p>
          </div>
        ) : (
          <div className="space-y-4 pb-32">
            {notes.map(note => (
              <NoteItem key={note.id} note={note} />
            ))}
          </div>
        )}
      </main>

      {/* Bottom Controls */}
      <div className="w-full bg-white/90 backdrop-blur-xl border-t border-slate-100 p-6 absolute bottom-0 z-40 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        
        {/* Prompt Selector */}
        <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar mb-2 mask-linear-fade">
          {PROMPT_OPTIONS.map((option) => (
            <button
              key={option.id}
              onClick={() => !isRecording && setSelectedPrompt(option.id)}
              disabled={isRecording}
              className={`
                px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 border
                ${selectedPrompt === option.id 
                  ? `${option.color} border-transparent scale-105 shadow-sm` 
                  : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}
                ${isRecording ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              {option.label}
              {selectedPrompt === option.id && <CheckIcon className="w-3 h-3 inline ml-1 mb-[1px]" />}
            </button>
          ))}
        </div>

        {/* Record Button */}
        <div className="flex justify-center items-center">
          <button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isProcessing}
            className={`
              relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl
              ${isRecording 
                ? 'bg-red-500 shadow-red-200 scale-110' 
                : 'bg-gradient-to-tr from-primary to-secondary shadow-indigo-200 hover:scale-105'}
              ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            {isRecording ? (
              <>
                <span className="absolute w-full h-full rounded-full border-4 border-red-500/30 animate-ping"></span>
                <StopIcon className="w-8 h-8 text-white relative z-10" />
              </>
            ) : (
              <MicIcon className="w-8 h-8 text-white relative z-10" />
            )}
          </button>
        </div>
        
        <p className="text-center text-[10px] text-slate-400 mt-4 font-medium uppercase tracking-wider">
          {isRecording ? "Recording..." : isProcessing ? "Processing..." : "Tap to Speak"}
        </p>
      </div>

      {/* Settings Modal */}
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)}
        onSave={handleSaveSettings}
        initialToken={siliconFlowToken}
      />
    </div>
  );
};

export default App;
