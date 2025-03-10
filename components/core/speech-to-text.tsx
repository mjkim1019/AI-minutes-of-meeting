'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { FileText, Loader2, Upload, Download, Save } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"  
import { MeetingSummary } from "./meeting-summary"

interface SpeechToTextProps {
  onTranscriptUpdate?: (transcript: string) => void
}

export function SpeechToText({ onTranscriptUpdate }: SpeechToTextProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [transcript, setTranscript] = useState<string>('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [audioDuration, setAudioDuration] = useState<string>('')
  const [processTime, setProcessTime] = useState<string>('')
  const [diarizedText, setDiarizedText] = useState<string>('')
  const [speakerCount, setSpeakerCount] = useState<number>(2)
  const [summary, setSummary] = useState<string>('')

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
        setDiarizedText(text) // 텍스트 파일의 경우 바로 diarizedText 설정
        // 바로 화자 구분 시작
        await diarizeText(text)
      } else {
        // 기존 오디오 파일 처리 로직
        if (file.size > 25 * 1024 * 1024) {
          setTranscript('파일 크기는 25MB를 초과할 수 없습니다.')
          return
        }

        // 오디오 길이 확인
        const audio = new Audio()
        audio.src = URL.createObjectURL(file)
        audio.onloadedmetadata = () => {
          const duration = audio.duration
          setAudioDuration(formatDuration(duration))
          
          // 10분(600초) 제한
          if (duration > 600) {
            setTranscript('오디오 길이는 10분을 초과할 수 없습니다.')
            setSelectedFile(null)
            return
          }
          
          setSelectedFile(file)
          setProcessTime('')
          setTranscript('')
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

  const getSupportedMimeType = () => {
    const types = [
      'audio/wav',
      'audio/mp3',
      'audio/ogg',
      'audio/webm'
    ]
    return types.find(type => MediaRecorder.isTypeSupported(type)) || 'audio/wav'
  }

  const convertToWav = async (audioBlob: Blob): Promise<Blob> => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
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

  const diarizeText = async (text: string) => {
    try {
      const response = await fetch('/api/diarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          text,
          speakerCount 
        })
      })

      if (!response.ok) {
        throw new Error('Diarization failed')
      }

      const data = await response.json()
      setDiarizedText(data.diarizedText)
    } catch (error) {
      console.error('Error diarizing text:', error)
      toast.error('화자 구분에 실패했습니다.')
      setDiarizedText(text) // 실패 시 원본 텍스트 사용
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

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.details || 'Transcription failed')
      }
      
      const data = await response.json()
      setTranscript(data.text)
      onTranscriptUpdate?.(data.text)

      // 텍스트 변환 후 화자 구분 시작
      await diarizeText(data.text)
      
      // 자동으로 텍스트 파일 다운로드
      downloadText()
    } catch (error) {
      console.error('Error transcribing audio:', error)
      setTranscript('오류가 발생했습니다: ' + (error as Error).message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveComplete = () => {
    setTranscript('')
    setDiarizedText('')
    setSelectedFile(null)
  }

  const generateSummary = async () => {
    if (!diarizedText) return
    
    try {
      setIsLoading(true)
      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: diarizedText })
      })

      if (!response.ok) {
        throw new Error('Summary generation failed')
      }

      const data = await response.json()
      setSummary(data.summary)

      // 회의록 다운로드
      const element = document.createElement('a')
      const file = new Blob([data.summary], { type: 'text/plain' })
      element.href = URL.createObjectURL(file)
      element.download = `meeting_summary_${new Date().toISOString().slice(0,10)}.txt`
      document.body.appendChild(element)
      element.click()
      document.body.removeChild(element)
    } catch (error) {
      console.error('Error generating summary:', error)
      toast.error('요약 생성에 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
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

        <div className="flex items-center gap-2">
          <Label htmlFor="speaker-count" className="text-sm">화자 수:</Label>
          <Input
            id="speaker-count"
            type="number"
            min={1}
            max={10}
            value={speakerCount}
            onChange={(e) => setSpeakerCount(Number(e.target.value))}
            className="w-20"
          />
        </div>

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
          diarizedText={transcript}
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

      {diarizedText && (
        <Card className="p-4 bg-muted">
          <div className="space-y-4">
            <h3 className="font-medium">화자 구분된 내용:</h3>
            <div className="text-sm text-gray-600 whitespace-pre-line">
              {diarizedText}
            </div>
          </div>
        </Card>
      )}
    </div>
  )
} 