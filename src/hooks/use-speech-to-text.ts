import { useState, useRef, useEffect, useCallback } from 'react';
import { transcribeAudio } from '@/actions/transcribe';

interface UseSpeechToTextProps {
    onResult?: (transcript: string) => void;
    onError?: (error: string) => void;
}

export function useSpeechToText({ onResult, onError }: UseSpeechToTextProps = {}) {
    const [isListening, setIsListening] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false); // For fallback mode
    const [error, setError] = useState<string | null>(null);
    const recognitionRef = useRef<any>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    const hasNativeSupport = typeof window !== 'undefined' &&
        ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

    const startListening = useCallback(() => {
        setError(null);

        if (hasNativeSupport) {
            // NATIVE MODE
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            const recognition = new SpeechRecognition();
            recognitionRef.current = recognition;

            recognition.continuous = true; // Changed to true for better flow
            recognition.interimResults = true;
            recognition.lang = 'en-US';

            recognition.onstart = () => setIsListening(true);
            recognition.onend = () => setIsListening(false);
            recognition.onerror = (event: any) => {
                const msg = event.error === 'not-allowed' ? 'Microphone denied' : event.error;
                setError(msg);
                onError?.(msg);
                setIsListening(false);
            };

            recognition.onresult = (event: any) => {
                let finalTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript;
                    }
                }
                if (finalTranscript) {
                    onResult?.(finalTranscript.trim());
                }
            };

            recognition.start();

        } else {
            // FALLBACK MODE (MediaRecorder -> Whisper)
            navigator.mediaDevices.getUserMedia({ audio: true })
                .then(stream => {
                    const mediaRecorder = new MediaRecorder(stream);
                    mediaRecorderRef.current = mediaRecorder;
                    audioChunksRef.current = [];

                    mediaRecorder.ondataavailable = (event) => {
                        if (event.data.size > 0) {
                            audioChunksRef.current.push(event.data);
                        }
                    };

                    mediaRecorder.onstop = async () => {
                        setIsProcessing(true);
                        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                        const formData = new FormData();
                        formData.append('file', audioBlob, 'audio.webm');

                        try {
                            const result = await transcribeAudio(formData);
                            if (result.text) {
                                onResult?.(result.text.trim());
                            } else if (result.error) {
                                throw new Error(result.error);
                            }
                        } catch (err: any) {
                            console.error("Transcription failed", err);
                            const msg = err.message || "Failed to transcribe";
                            setError(msg);
                            onError?.(msg);
                        } finally {
                            setIsProcessing(false);
                            setIsListening(false); // Ensure state sync
                        }
                    };

                    mediaRecorder.start();
                    setIsListening(true);
                })
                .catch(err => {
                    const msg = "Microphone access denied or not supported.";
                    console.error(err);
                    setError(msg);
                    onError?.(msg);
                });
        }
    }, [hasNativeSupport, onResult, onError]);

    const stopListening = useCallback(() => {
        if (hasNativeSupport && recognitionRef.current) {
            recognitionRef.current.stop();
        } else if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
            // Stop tracks
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
        }
        setIsListening(false); // Optimistic update
    }, [hasNativeSupport]);

    // Cleanup
    useEffect(() => {
        return () => {
            if (recognitionRef.current) recognitionRef.current.stop();
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
                mediaRecorderRef.current.stop();
            }
        };
    }, []);

    return {
        isListening,
        isProcessing,
        error,
        startListening,
        stopListening,
        hasNativeSupport
    };
}
