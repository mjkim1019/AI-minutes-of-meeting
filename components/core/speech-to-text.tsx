'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { FileText, Loader2, Upload, Download } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { MeetingSummary } from "./meeting-summary"
import { GlossaryButton } from './glossary-button'

interface SpeechToTextProps {
  onTranscriptUpdate?: (transcript: string) => void
}

declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext;
  }
}

// 응답 타입 정의
interface TranscriptionSuccess {
  text: string;
  summary: string;
  title: string;
  success: true;
}

interface TranscriptionError {
  details: string;
  success: false;
}

type TranscriptionResponse = TranscriptionSuccess | TranscriptionError;

export function SpeechToText({ onTranscriptUpdate }: SpeechToTextProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [transcript, setTranscript] = useState<string>('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [audioDuration, setAudioDuration] = useState<string>('')
  const [processTime, setProcessTime] = useState<string>('')
  const [glossary, setGlossary] = useState<string>('')

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      if (file.type === 'text/plain') {
        // 텍스트 파일 처리
        const text = await file.text()
        setTranscript(text)
        setSelectedFile(file)
      } else {
        // 기존 오디오 파일 처리 로직
        if (file.size > 25 * 1024 * 1024) {
          setTranscript("파일 크기는 25MB를 초과할 수 없습니다.")
          return
        }

        // 오디오 길이 확인
        const audio = new Audio()
        const objectUrl = URL.createObjectURL(file)
        audio.src = objectUrl

        // WebM 파일의 경우 AudioContext를 사용하여 길이 계산
        if (file.type === 'video/webm') {
          const audioContext = new (window.AudioContext || window.webkitAudioContext)()
          const arrayBuffer = await file.arrayBuffer()
          const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
          const duration = audioBuffer.duration
          setAudioDuration(formatDuration(duration))
          setSelectedFile(file)
          setProcessTime('')
          setTranscript('')
          URL.revokeObjectURL(objectUrl)
        } else {
          // 일반 오디오 파일 처리
          audio.onloadedmetadata = () => {
            const duration = audio.duration
            setAudioDuration(formatDuration(duration))
            setSelectedFile(file)
            setProcessTime('')
            setTranscript('')
            URL.revokeObjectURL(objectUrl)
          }
        }
      }
    } catch (error) {
      console.error('Error handling file:', error)
      setTranscript('파일 처리 중 오류가 발생했습니다.')
    }
  }

  const handleExtract = async () => {
    if (!selectedFile) {
      setTranscript('먼저 오디오 파일을 업로드해주세요.')
      return
    }

    try {
      setIsLoading(true)
      const startTime = Date.now()
      await processAudioFile(selectedFile)
      const endTime = Date.now()
      setProcessTime(((endTime - startTime) / 1000).toFixed(1))
    } catch (error) {
      console.error('Error processing file:', error)
      setTranscript('오류가 발생했습니다: ' + (error as Error).message)
    } finally {
      setIsLoading(false)
    }
  }

  const convertToWav = async (audioBlob: Blob): Promise<Blob> => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)()
    const arrayBuffer = await audioBlob.arrayBuffer()
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
    
    // 샘플링 레이트를 16kHz로 낮춤 (파일 크기 감소)
    const targetSampleRate = 16000
    const offlineContext = new OfflineAudioContext(
      1, // 모노 채널
      Math.ceil(audioBuffer.duration * targetSampleRate),
      targetSampleRate
    )
    
    const source = offlineContext.createBufferSource()
    source.buffer = audioBuffer
    source.connect(offlineContext.destination)
    source.start()

    const renderedBuffer = await offlineContext.startRendering()
    const wavBlob = await new Promise<Blob>(resolve => {
      const interleaved = renderedBuffer.getChannelData(0)
      const dataview = encodeWAV(interleaved, targetSampleRate)
      resolve(new Blob([dataview], { type: 'audio/wav' }))
    })

    // 파일 크기 로깅
    console.log('Converted file size:', Math.round(wavBlob.size / 1024 / 1024), 'MB')
    
    return wavBlob
  }

  const encodeWAV = (samples: Float32Array, sampleRate: number): DataView => {
    const buffer = new ArrayBuffer(44 + samples.length * 2)
    const view = new DataView(buffer)

    writeString(view, 0, 'RIFF')
    view.setUint32(4, 36 + samples.length * 2, true)
    writeString(view, 8, 'WAVE')
    writeString(view, 12, 'fmt ')
    view.setUint32(16, 16, true)
    view.setUint16(20, 1, true) // 모노
    view.setUint16(22, 1, true)
    view.setUint32(24, sampleRate, true)
    view.setUint32(28, sampleRate * 2, true)
    view.setUint16(32, 2, true)
    view.setUint16(34, 16, true)
    writeString(view, 36, 'data')
    view.setUint32(40, samples.length * 2, true)

    floatTo16BitPCM(view, 44, samples)

    return view
  }

  const writeString = (view: DataView, offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i))
    }
  }

  const floatTo16BitPCM = (output: DataView, offset: number, input: Float32Array) => {
    for (let i = 0; i < input.length; i++, offset += 2) {
      const s = Math.max(-1, Math.min(1, input[i]))
      output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true)
    }
  }

  const downloadText = () => {
    if (!transcript) return
    
    const element = document.createElement('a')
    const file = new Blob([transcript], { type: 'text/plain' })
    element.href = URL.createObjectURL(file)
    element.download = `transcript_${new Date().toISOString().slice(0,10)}.txt`
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  const processAudioFile = async (audioBlob: Blob) => {
    try {
      setIsLoading(true)
      const wavBlob = await convertToWav(audioBlob)
      
      const formData = new FormData()
      formData.append('file', wavBlob, 'audio.wav')
      formData.append('model', 'whisper-1')
      formData.append('language', 'ko')
      formData.append('glossary', glossary)

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json() as TranscriptionResponse

      if (!response.ok) {
        const errorMessage = 'details' in data ? data.details : 'Transcription failed'
        throw new Error(errorMessage)
      }
      
      if ('text' in data && 'summary' in data && 'title' in data) {
        setTranscript(data.text)
        onTranscriptUpdate?.(data.text)
        
        // 자동으로 텍스트 파일 다운로드
        downloadText()
      } else {
        throw new Error('Invalid response format')
      }
    } catch (error) {
      console.error('Error transcribing audio:', error)
      setTranscript('오류가 발생했습니다: ' + (error as Error).message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveComplete = () => {
    setTranscript('')
    setSelectedFile(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative">
          <Input
            type="file"
            accept="audio/*,text/plain"
            className="hidden"
            id="audio-upload"
            onChange={handleFileSelect}
          />
          <Button
            variant="outline"
            onClick={() => document.getElementById('audio-upload')?.click()}
            disabled={isLoading}
          >
            <Upload className="h-4 w-4 mr-2" />
            파일 업로드 (.txt, 오디오)
          </Button>
        </div>

        <GlossaryButton onGlossaryUpdate={setGlossary} />

        {selectedFile && selectedFile.type !== 'text/plain' && (
          <Button 
            variant="default"
            onClick={handleExtract}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <FileText className="h-4 w-4 mr-2" />
            )}
            {isLoading ? "변환 중..." : "음성 추출"}
          </Button>
        )}

        <MeetingSummary 
          transcript={transcript}
          onSaveComplete={handleSaveComplete}
        />
      </div>

      {selectedFile && (
        <div className="text-sm text-muted-foreground space-y-1">
          <p>선택된 파일: {selectedFile.name}</p>
          <p>파일 형식: {selectedFile.type || '알 수 없음'}</p>
          {audioDuration && <p>파일 길이: {audioDuration}</p>}
          {processTime && <p>처리 시간: {processTime}초</p>}
        </div>
      )}

      <Card className="p-4">
        <div className="flex justify-between items-start mb-2">
          <p className="text-sm text-gray-600">
            {transcript || "음성을 텍스트로 변환한 내용이 여기에 표시됩니다..."}
          </p>
          {transcript && (
            <Button
              variant="ghost"
              size="sm"
              onClick={downloadText}
              className="ml-2"
              title="텍스트 파일 다운로드"
            >
              <Download className="h-4 w-4" />
            </Button>
          )}
        </div>
      </Card>
    </div>
  )
} 