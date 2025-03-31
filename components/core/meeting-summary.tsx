'use client'

import { useState } from 'react'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Loader2, Save, FileText } from "lucide-react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface MeetingSummaryProps {
  diarizedText: string
  onSummaryGenerated?: (summary: string) => void
  onSaveComplete?: () => void
}

export function MeetingSummary({ 
  diarizedText,
  onSummaryGenerated,
  onSaveComplete,
}: MeetingSummaryProps) {
  const [summary, setSummary] = useState<string>('')
  const [title, setTitle] = useState<string>('')
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

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
      setTitle(data.title)
      setIsOpen(true)
      onSummaryGenerated?.(data.summary)

      // 회의록 다운로드
      const element = document.createElement('a')
      const file = new Blob([`${data.title}\n\n${data.summary}`], { type: 'text/plain' })
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

  const saveMeeting = async () => {
    if (!diarizedText || !summary) {
      toast.error('회의록 내용이 없습니다.')
      return
    }

    if (!title.trim()) {
      toast.error('회의 제목을 입력하세요.')
      return
    }

    try {
      setIsSaving(true)
      const response = await fetch('/api/meetings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title.trim(),
          original_text: diarizedText,
          diarized_text: diarizedText,
          summary
        })
      })

      if (!response.ok) {
        throw new Error('Failed to save meeting')
      }

      toast.success('회의록이 저장되었습니다.')
      setTitle('')
      setSummary('')
      setIsOpen(false)
      onSaveComplete?.()
    } catch (error) {
      console.error('Error saving meeting:', error)
      toast.error('회의록 저장에 실패했습니다.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <>
      <Button
        variant="secondary"
        onClick={generateSummary}
        disabled={isLoading || !diarizedText}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <FileText className="h-4 w-4 mr-2" />
        )}
        {isLoading ? "생성 중..." : "회의록 생성"}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>회의록 요약</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Input
                placeholder="회의 제목"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="flex-1"
              />
              <Button
                variant="default"
                onClick={saveMeeting}
                disabled={isSaving || !summary || !title.trim()}
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                저장
              </Button>
              <Button
                variant="secondary"
                onClick={generateSummary}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <FileText className="h-4 w-4 mr-2" />
                )}
                다시 생성
              </Button>
            </div>

            <div className="text-sm text-gray-600 whitespace-pre-line">
              {summary}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
} 