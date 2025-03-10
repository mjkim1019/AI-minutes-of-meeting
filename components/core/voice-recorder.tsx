'use client'

import { useState, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Mic, MicOff, Loader2, Play, Square, Download } from "lucide-react"  
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"

export function VoiceRecorder() {
  const [isRecording, setIsRecording] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const [audioChunks, setAudioChunks] = useState<Blob[]>([])
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [permissionDenied, setPermissionDenied] = useState(false)
  const [showPermissionDialog, setShowPermissionDialog] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const checkPermission = async () => {
    try {
      const result = await navigator.permissions.query({ name: 'microphone' as PermissionName })
      if (result.state === 'denied') {
        setPermissionDenied(true)
        setShowPermissionDialog(true)
        return false
      }
      return true
    } catch (err) {
      // 브라우저가 permissions API를 지원하지 않는 경우
      return true
    }
  }

  const getSupportedMimeType = () => {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/mp4'
    ]
    return types.find(type => MediaRecorder.isTypeSupported(type)) || 'audio/webm'
  }

  const setupRecorder = async () => {
    setIsLoading(true)
    
    const hasPermission = await checkPermission()
    if (!hasPermission) {
      setIsLoading(false)
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mimeType = getSupportedMimeType()
      console.log('Supported MIME type:', mimeType)  // 디버깅용
      
      const recorder = new MediaRecorder(stream, {
        mimeType: mimeType
      })
      
      const chunks: Blob[] = []  // 로컬 변수로 청크 관리
      
      recorder.ondataavailable = (e) => {
        chunks.push(e.data)
      }

      recorder.onstop = () => {
        const audioBlob = new Blob(chunks, { type: mimeType })
        const url = URL.createObjectURL(audioBlob)
        setAudioUrl(url)
        setAudioChunks(chunks)
      }

      setMediaRecorder(recorder)
      recorder.start()
      setIsRecording(true)
      setPermissionDenied(false)
    } catch (err) {
      console.error('마이크 접근 권한이 필요합니다:', err)
      setPermissionDenied(true)
      setShowPermissionDialog(true)
    } finally {
      setIsLoading(false)
    }
  }

  const startRecording = () => {
    setAudioChunks([])
    setAudioUrl(null)
    if (mediaRecorder) {
      mediaRecorder.start()
      setIsRecording(true)
    } else {
      setupRecorder()
    }
  }

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state === "recording") {
      mediaRecorder.stop()
      setIsRecording(false)
    }
  }

  const togglePlayback = () => {
    if (!audioRef.current || !audioUrl) return

    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      audioRef.current.play()
      setIsPlaying(true)
    }
  }

  const downloadRecording = () => {
    if (!audioUrl) return
    
    const a = document.createElement('a')
    a.href = audioUrl
    a.download = `회의녹음_${new Date().toISOString()}.webm`  // 파일명에 현재 시간 추가
    a.click()
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <Button 
          variant={isRecording ? "destructive" : permissionDenied ? "secondary" : "default"}
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : isRecording ? (
            <MicOff className="h-4 w-4 mr-2" />
          ) : (
            <Mic className="h-4 w-4 mr-2" />
          )}
          {isLoading ? "권한 요청 중..." : 
           permissionDenied ? "마이크 권한 필요" :
           isRecording ? "녹음 중지" : "회의 시작"}
        </Button>

         {audioUrl && (
          <>
            <Button
              variant="outline"
              size="icon"
              onClick={togglePlayback}
            >
              {isPlaying ? <Square className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={downloadRecording}
            >
              <Download className="h-4 w-4" />
            </Button>
            <audio 
              ref={audioRef} 
              src={audioUrl}
              onEnded={() => setIsPlaying(false)}
              className="hidden"
            />
          </>
        )}
      </div>

      <Dialog open={showPermissionDialog} onOpenChange={setShowPermissionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>마이크 권한이 필요합니다</DialogTitle>
            <DialogDescription className="space-y-3">
              브라우저 설정에서 마이크 권한을 허용해주세요:
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>브라우저 주소 표시줄의 자물쇠/설정 아이콘을 클릭하세요</li>
                <li>사이트 설정 또는 권한 설정을 찾으세요</li>
                <li>마이크 권한을 "허용"으로 변경하세요</li>
                <li>페이지를 새로고침하세요</li>
              </ol>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </>
  )
}