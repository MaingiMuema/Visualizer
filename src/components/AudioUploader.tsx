'use client';

import React, { useCallback, useState } from 'react';
import { Upload, Music, X, AlertCircle } from 'lucide-react';

interface AudioFile {
  file: File;
  name: string;
  size: number;
  duration?: number;
  audioBuffer?: AudioBuffer;
}

interface AudioUploaderProps {
  onFileSelect: (audioFile: AudioFile) => void;
  onFileRemove: () => void;
  selectedFile: AudioFile | null;
  isProcessing: boolean;
}

const SUPPORTED_FORMATS = [
  'audio/mpeg',
  'audio/wav',
  'audio/ogg',
  'audio/mp4',
  'audio/aac',
  'audio/flac',
  'audio/webm',
];

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export default function AudioUploader({
  onFileSelect,
  onFileRemove,
  selectedFile,
  isProcessing,
}: AudioUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateFile = (file: File): string | null => {
    if (!SUPPORTED_FORMATS.includes(file.type)) {
      return `Unsupported file format. Please use: ${SUPPORTED_FORMATS.map(f => f.split('/')[1]).join(', ')}`;
    }
    
    if (file.size > MAX_FILE_SIZE) {
      return `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB`;
    }
    
    return null;
  };

  const processAudioFile = async (file: File): Promise<AudioFile> => {
    return new Promise((resolve, reject) => {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const fileReader = new FileReader();

      fileReader.onload = async (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
          
          const audioFile: AudioFile = {
            file,
            name: file.name,
            size: file.size,
            duration: audioBuffer.duration,
            audioBuffer,
          };
          
          resolve(audioFile);
        } catch (error) {
          reject(new Error('Failed to decode audio file'));
        }
      };

      fileReader.onerror = () => {
        reject(new Error('Failed to read file'));
      };

      fileReader.readAsArrayBuffer(file);
    });
  };

  const handleFile = async (file: File) => {
    setError(null);
    
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      const audioFile = await processAudioFile(file);
      onFileSelect(audioFile);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to process audio file');
    }
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {!selectedFile ? (
        <div
          className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive
              ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20'
              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            accept={SUPPORTED_FORMATS.join(',')}
            onChange={handleChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={isProcessing}
          />
          
          <div className="flex flex-col items-center space-y-4">
            <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full">
              <Upload className="w-8 h-8 text-gray-600 dark:text-gray-400" />
            </div>
            
            <div>
              <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
                Drop your audio file here
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                or click to browse
              </p>
            </div>
            
            <div className="text-xs text-gray-400 dark:text-gray-500">
              <p>Supported formats: MP3, WAV, OGG, MP4, AAC, FLAC, WebM</p>
              <p>Maximum file size: 50MB</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Music className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              
              <div>
                <h3 className="font-medium text-gray-900 dark:text-gray-100">
                  {selectedFile.name}
                </h3>
                <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400 mt-1">
                  <span>{formatFileSize(selectedFile.size)}</span>
                  {selectedFile.duration && (
                    <span>{formatDuration(selectedFile.duration)}</span>
                  )}
                </div>
              </div>
            </div>
            
            <button
              onClick={onFileRemove}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              disabled={isProcessing}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        </div>
      )}

      {isProcessing && (
        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <p className="text-sm text-blue-700 dark:text-blue-300">Processing audio file...</p>
          </div>
        </div>
      )}
    </div>
  );
}
