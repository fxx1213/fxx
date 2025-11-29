export enum NoteType {
  RAW = 'RAW',
  SUMMARY = 'SUMMARY',
  ACTION_ITEMS = 'ACTION_ITEMS',
  JOURNAL = 'JOURNAL',
  IDEA = 'IDEA'
}

export interface Note {
  id: string;
  title: string;
  originalText: string;
  processedContent: string;
  createdAt: number; // timestamp
  type: NoteType;
  isLoading?: boolean;
}

export interface SiliconFlowConfig {
  token: string;
}

export interface TranscriptionResponse {
  text: string;
}
