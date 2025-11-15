"use client";

import { useState, useRef, KeyboardEvent, useEffect } from "react";
import { Paperclip, Search, Mic, MicOff, X, FileText } from "lucide-react";
import { processFile, formatFileSize, type FileAttachment } from "@/lib/utils/file-handler";

interface ComposerSectionProps {
  onSendMessage: (message: string, files?: FileAttachment[]) => void;
  isLoading?: boolean;
  enableSearch?: boolean;
  onToggleSearch?: (enabled: boolean) => void;
}

export default function ComposerSection({
  onSendMessage,
  isLoading = false,
  enableSearch = false,
  onToggleSearch
}: ComposerSectionProps) {
  const [input, setInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<FileAttachment[]>([]);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Initialize Speech Recognition
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'en-US';

        recognitionRef.current.onresult = (event: any) => {
          let interimTranscript = '';
          let finalTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript + ' ';
            } else {
              interimTranscript += transcript;
            }
          }

          setInput((prev) => {
            const newText = prev + finalTranscript;
            return newText;
          });

          // Auto-resize textarea
          if (textareaRef.current && finalTranscript) {
            setTimeout(() => {
              if (textareaRef.current) {
                textareaRef.current.style.height = "auto";
                textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 208)}px`;
              }
            }, 0);
          }
        };

        recognitionRef.current.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          setIsRecording(false);
          setIsListening(false);
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
        };
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const toggleVoiceRecording = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsRecording(true);
        setIsListening(true);
      } catch (error) {
        console.error('Failed to start speech recognition:', error);
      }
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsProcessingFile(true);
    const newAttachments: FileAttachment[] = [];

    for (const file of files) {
      try {
        const attachment = await processFile(file);
        newAttachments.push(attachment);
      } catch (error) {
        alert(error instanceof Error ? error.message : 'Failed to process file');
      }
    }

    setAttachedFiles((prev) => [...prev, ...newAttachments]);
    setIsProcessingFile(false);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (fileId: string) => {
    setAttachedFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input.trim(), attachedFiles.length > 0 ? attachedFiles : undefined);
      setInput("");
      setAttachedFiles([]);
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 208)}px`;
    }
  };

  return (
    <div className="w-full max-w-[48rem]">
      <div className="relative rounded-3xl bg-[#F7F7F8] shadow-sm">
        {/* Attached Files Display */}
        {attachedFiles.length > 0 &&
        <div className="border-b border-[#D9D9E3] p-3">
            <div className="flex flex-wrap gap-2">
              {attachedFiles.map((file) =>
            <div
              key={file.id}
              className="flex items-center gap-2 rounded-lg border border-[#D9D9E3] bg-white px-3 py-2 text-sm">

                  <FileText className="h-4 w-4 text-[#6E6E80]" />
                  <span className="max-w-[150px] truncate text-[#0D0D0D]">{file.name}</span>
                  <span className="text-[#6E6E80]">({formatFileSize(file.size)})</span>
                  <button
                onClick={() => removeFile(file.id)}
                className="ml-1 rounded-full p-1 hover:bg-[#ECECF1]"
                aria-label="Remove file">

                    <X className="h-3 w-3 text-[#6E6E80]" />
                  </button>
                </div>
            )}
            </div>
          </div>
        }

        <div className="flex items-end gap-2 p-2.5">
          {/* Text Input Area */}
          <div className="flex-1 flex items-center min-h-[56px]">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              placeholder="Ask anything"
              rows={1}
              className="w-full resize-none bg-transparent px-4 py-3 text-[16px] leading-[1.5] text-[#0D0D0D] placeholder:text-[#ACACBE] focus:outline-none disabled:opacity-50 !whitespace-pre-line !whitespace-pre-line"
              style={{
                maxHeight: "208px",
                overflowY: "auto"
              }} />

          </div>

          {/* Send Button */}
          {input.trim() && !isLoading &&
          <button
            onClick={() => handleSubmit()}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#0D0D0D] text-white transition-opacity hover:opacity-80 disabled:opacity-50"
            disabled={isLoading}
            aria-label="Send message">

              <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg">

                <path
                d="M3.33331 10H16.6666M16.6666 10L11.6666 5M16.6666 10L11.6666 15"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round" />

              </svg>
            </button>
          }
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between gap-2 px-3 pb-3">
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              accept=".txt,.html,.js,.css,.json,.md,.xml,.csv,.zip,.tar,.gz,.tar.gz,.rar,.pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.webp,.svg,.mp3,.mp4,.wav,.avi,.mov,.ts,.tsx,.jsx,.py,.java,.c,.cpp,.h,.hpp,.sh,.bat,.yaml,.yml,.toml,.ini,.conf" />

            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex h-9 items-center gap-2 rounded-full border border-[#D9D9E3] bg-transparent px-3 text-[13px] font-semibold text-[#6E6E80] transition-colors hover:bg-[#ECECF1] disabled:opacity-50"
              disabled={isLoading || isProcessingFile}
              aria-label="Attach file">

              <Paperclip className="h-5 w-5" />
              <span className="hidden sm:inline">{isProcessingFile ? 'Processing...' : 'Attach'}</span>
            </button>

            <button
              onClick={() => onToggleSearch?.(!enableSearch)}
              className={`flex h-9 items-center gap-2 rounded-full border px-3 text-[13px] font-semibold transition-colors disabled:opacity-50 ${
              enableSearch ?
              'border-blue-500 bg-blue-50 text-blue-600 hover:bg-blue-100' :
              'border-[#D9D9E3] bg-transparent text-[#6E6E80] hover:bg-[#ECECF1]'}`
              }
              disabled={isLoading}
              aria-label={enableSearch ? "Disable web search" : "Enable web search"}
              title={enableSearch ? "Web search enabled" : "Web search disabled"}>

              <Search className="h-5 w-5" />
              <span className="hidden sm:inline">Search</span>
            </button>
          </div>

          <button
            onClick={toggleVoiceRecording}
            className={`flex h-9 items-center gap-2 rounded-full border px-3 text-[13px] font-semibold transition-colors disabled:opacity-50 ${
            isRecording ?
            'border-red-500 bg-red-50 text-red-600 hover:bg-red-100' :
            'border-[#D9D9E3] bg-transparent text-[#6E6E80] hover:bg-[#ECECF1]'}`
            }
            disabled={isLoading}
            aria-label={isRecording ? "Stop recording" : "Voice input"}>

            {isRecording ?
            <>
                <MicOff className="h-5 w-5 animate-pulse" />
                <span className="hidden sm:inline">Recording...</span>
              </> :

            <>
                <Mic className="h-5 w-5" />
                <span className="hidden sm:inline">Voice</span>
              </>
            }
          </button>
        </div>
      </div>
    </div>);

}