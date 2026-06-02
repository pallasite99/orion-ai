'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { MarkdownMessage } from '@/components/chat/markdown-message';
import { AutomationService } from '@/services/automation.service';
import { LearningService } from '@/services/learning.service';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sourceUserContent?: string;
}

export default function ChatPage() {
  const [chatId] = useState(() => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    return `chat-${Date.now()}`;
  });
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hello! I'm ORION, your personal AI assistant. How can I help you today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState('Voice ready');
  const [feedbackTargetId, setFeedbackTargetId] = useState<string | null>(null);
  const [feedbackRating, setFeedbackRating] = useState<'helpful' | 'needs_work'>('helpful');
  const [feedbackNote, setFeedbackNote] = useState('');
  const [learningStatus, setLearningStatus] = useState('Learning idle');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    return () => {
      mediaRecorderRef.current?.stream.getTracks().forEach((track) => track.stop());
      mediaRecorderRef.current = null;
    };
  }, []);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };
    const submittedText = input.trim();

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: chatId,
          messages: [...messages, userMessage].map((message) => ({
            role: message.role,
            content: message.content,
          })),
          system_prompt: 'You are ORION, a concise personal AI operating system assistant.',
        }),
      });

      const payload = await response.json();

      if (!response.ok || !payload?.success) {
        throw new Error(payload?.message || 'Failed to generate a response.');
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: payload.data?.response || 'No response returned.',
        timestamp: new Date(),
        sourceUserContent: submittedText,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setFeedbackTargetId(assistantMessage.id);
      setFeedbackRating('helpful');
      setFeedbackNote('');

      void LearningService.captureSelfReflection(submittedText, assistantMessage.content, chatId)
        .then((result) => {
          if (result?.memory) {
            setLearningStatus(`Learning updated: ${result.memory.title}`);
          }
        })
        .catch((learningError) => {
          console.error('Learning reflection error:', learningError);
        });

      const automationResult = AutomationService.processConversation(submittedText);
      if (automationResult.ok) {
        console.log('Automation action completed:', automationResult.action);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'The chat endpoint is unavailable right now. Check server logs and API keys.',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const startRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setVoiceStatus('Microphone unavailable');
      return;
    }

    try {
      setVoiceStatus('Requesting microphone...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        try {
          setVoiceStatus('Transcribing...');
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const response = await fetch('/api/voice/transcribe', {
            method: 'POST',
            body: audioBlob,
          });
          const payload = await response.json();

          if (!response.ok || !payload?.success) {
            throw new Error(payload?.message || 'Failed to transcribe audio.');
          }

          const transcript = payload.data?.transcript?.trim();
          if (transcript) {
            setInput((current) => `${current}${current ? ' ' : ''}${transcript}`);
            setVoiceStatus('Transcript inserted');
          } else {
            setVoiceStatus('No speech detected');
          }
        } catch (error) {
          console.error('Voice transcription error:', error);
          setVoiceStatus('Voice transcription failed');
        } finally {
          audioChunksRef.current = [];
        }
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecording(true);
      setVoiceStatus('Listening...');
    } catch (error) {
      console.error('Voice recording error:', error);
      setVoiceStatus('Microphone unavailable');
      setRecording(false);
    }
  };

  const stopRecording = () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder) return;

    recorder.stop();
    recorder.stream.getTracks().forEach((track) => track.stop());
    mediaRecorderRef.current = null;
    setRecording(false);
  };

  const submitFeedback = async () => {
    const target = messages.find((message) => message.id === feedbackTargetId && message.role === 'assistant');
    if (!target) return;

    try {
      const result = LearningService.recordFeedback('user-placeholder', {
        chat_id: chatId,
        message_id: target.id,
        user_message: target.sourceUserContent,
        assistant_message: target.content,
        rating: feedbackRating,
        note: feedbackNote.trim() || undefined,
      });

      if (result?.feedback) {
        setLearningStatus(`Feedback saved: ${result.feedback.rating}`);
        setFeedbackNote('');
        setFeedbackTargetId(null);
      }
    } catch (error) {
      console.error('Feedback save error:', error);
      setLearningStatus('Feedback save failed');
    }
  };

  const selectedFeedbackMessage = messages.find(
    (message) => message.id === feedbackTargetId && message.role === 'assistant'
  );

  return (
    <div className="mx-auto flex h-full max-w-4xl flex-col">
      <div className="mb-4 flex-1 space-y-4 overflow-y-auto">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-xs rounded-lg px-4 py-3 lg:max-w-md ${
                message.role === 'user'
                  ? 'bg-cyan-600 text-white'
                  : 'border border-gray-700 bg-gray-900 text-gray-200'
              }`}
            >
              {message.role === 'assistant' ? (
                <>
                  <MarkdownMessage content={message.content} />
                  <div className="mt-3 flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setFeedbackTargetId(message.id)}
                    >
                      Teach Orion
                    </Button>
                  </div>
                </>
              ) : (
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
              )}
              <p className="mt-1 text-xs opacity-50">
                {message.timestamp.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="rounded-lg border border-gray-700 bg-gray-900 px-4 py-3">
              <div className="flex gap-2">
                <div className="h-2 w-2 animate-bounce rounded-full bg-gray-500"></div>
                <div className="h-2 w-2 animate-bounce rounded-full bg-gray-500 delay-100"></div>
                <div className="h-2 w-2 animate-bounce rounded-full bg-gray-500 delay-200"></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {selectedFeedbackMessage ? (
        <section className="mb-4 rounded-2xl border border-gray-800 bg-gray-950/80 p-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <div className="text-[10px] uppercase tracking-[0.35em] text-cyan-300">Teach Orion</div>
              <h2 className="mt-1 text-base font-semibold text-white">Rate the reply</h2>
              <p className="mt-1 text-xs text-gray-400">
                Orion will turn this into a lesson and remember the pattern.
              </p>
            </div>
            <div className="text-[10px] uppercase tracking-[0.25em] text-gray-500">{learningStatus}</div>
          </div>

          <div className="mt-3 rounded-xl border border-gray-800 bg-black/40 p-3">
            <p className="text-xs leading-5 text-gray-300">
              {selectedFeedbackMessage.content.slice(0, 220)}
              {selectedFeedbackMessage.content.length > 220 ? '...' : ''}
            </p>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              type="button"
              variant={feedbackRating === 'helpful' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFeedbackRating('helpful')}
            >
              Helpful
            </Button>
            <Button
              type="button"
              variant={feedbackRating === 'needs_work' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFeedbackRating('needs_work')}
            >
              Needs work
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setFeedbackTargetId(null)}>
              Dismiss
            </Button>
          </div>

          <textarea
            value={feedbackNote}
            onChange={(e) => setFeedbackNote(e.target.value)}
            placeholder="Optional note for Orion, for example: be more concise, include next steps, ask fewer questions."
            rows={2}
            className="mt-3 w-full rounded-xl border border-gray-800 bg-black/50 px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:border-cyan-500 focus:outline-none"
          />

          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              className="bg-cyan-600 font-semibold text-black hover:bg-cyan-700"
              onClick={submitFeedback}
            >
              Save feedback
            </Button>
          </div>
        </section>
      ) : null}

      <form onSubmit={handleSendMessage} className="flex gap-3">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Message ORION..."
          className="flex-1 rounded border border-gray-700 bg-gray-900 px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
          disabled={loading}
        />
        <Button
          type="submit"
          disabled={loading || !input.trim()}
          className="bg-cyan-600 font-semibold text-black hover:bg-cyan-700"
        >
          Send
        </Button>
        <Button
          type="button"
          variant="outline"
          className="px-4"
          title="Voice input"
          onClick={recording ? stopRecording : startRecording}
          disabled={loading}
        >
          {recording ? 'Stop' : '🎤'}
        </Button>
      </form>

      <div className="mt-3 text-center text-xs text-gray-500">
        ORION v0.1.0 · API-backed chat · {voiceStatus}
      </div>
    </div>
  );
}
