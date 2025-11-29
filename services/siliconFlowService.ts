import { TranscriptionResponse } from '../types';

const BASE_URL = 'https://api.siliconflow.cn/v1/audio/transcriptions';
const MODEL = 'TeleAI/TeleSpeechASR';

export const transcribeAudio = async (
  audioBlob: Blob,
  token: string
): Promise<string> => {
  if (!token) {
    throw new Error("SiliconFlow API Token is missing. Please check settings.");
  }

  const formData = new FormData();
  // SiliconFlow likely expects a filename with extension
  formData.append('file', audioBlob, 'recording.webm');
  formData.append('model', MODEL);

  try {
    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Transcription failed: ${response.status} ${JSON.stringify(errorData)}`);
    }

    const data: TranscriptionResponse = await response.json();
    return data.text;
  } catch (error) {
    console.error("SiliconFlow API Error:", error);
    throw error;
  }
};
