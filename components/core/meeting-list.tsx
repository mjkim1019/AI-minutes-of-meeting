'use client'

import { useState, useEffect } from 'react'
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Pencil, Trash2, Save, X, ChevronDown, ChevronUp, Send } from "lucide-react"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { Meeting } from '@/lib/supabase'

interface MeetingListProps {
  onLatestMeeting?: (meeting: Meeting | null) => void
}

export function MeetingList({ onLatestMeeting }: MeetingListProps) {
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editSummary, setEditSummary] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [shareId, setShareId] = useState<string | null>(null)
  const [emailTo, setEmailTo] = useState('')


  const fetchMeetings = useCallback(async () => {
    try {
      const response = await fetch('/api/meetings')
      const data = await response.json()
      if (data.meetings) {
        setMeetings(data.meetings)
        if (data.meetings.length > 0) {
          onLatestMeeting?.(data.meetings[0])
        } else {
          onLatestMeeting?.(null)
        }
      }
    } catch (error) {
      console.error('Error fetching meetings:', error)
    } finally {
      setLoading(false)
    }
  }, [onLatestMeeting])

    useEffect(() => {
    fetchMeetings()
  }, [fetchMeetings])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id)
  }

  const handleEdit = (meeting: Meeting) => {
    setEditingId(meeting.id)
    setEditTitle(meeting.title)
    setEditSummary(meeting.summary)
  }

  const handleSave = async (id: string) => {
    try {
      const response = await fetch(`/api/meetings/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: editTitle,
          summary: editSummary,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update meeting')
      }

      toast.success('회의록이 수정되었습니다.')
      setEditingId(null)
      fetchMeetings() // 목록 새로고침
    } catch (error) {
      console.error('Error updating meeting:', error)
      toast.error('회의록 수정에 실패했습니다.')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/meetings/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete meeting')
      }

      toast.success('회의록이 삭제되었습니다.')
      setDeleteId(null)
      fetchMeetings() // 목록 새로고침
    } catch (error) {
      console.error('Error deleting meeting:', error)
      toast.error('회의록 삭제에 실패했습니다.')
    }
  }

  const handleShare = async (meeting: Meeting) => {
    setShareId(meeting.id)
  }

  const handleSendEmail = async (meeting: Meeting) => {
    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: emailTo,
          subject: meeting.title,
          content: `${meeting.title}\n\n요약:\n${meeting.summary}\n\n전체 내용:\n${meeting.diarized_text || ''}`
        }),
      })

      if (!response.ok) throw new Error('Failed to send email')
      
      toast.success('이메일이 전송되었습니다.')
      setShareId(null)
      setEmailTo('')
    } catch (error) {
      console.error('Error sending email:', error)
      toast.error('이메일 전송에 실패했습니다.')
    }
  }

  if (loading) {
    return <div className="text-center">로딩 중...</div>
  }

  if (meetings.length === 0) {
    return <div className="text-center">저장된 회의록이 없습니다.</div>
  }

  return (
    <>
      <div className="space-y-4">
        {meetings.map((meeting) => (
          <Card key={meeting.id} className="p-4">
            {editingId === meeting.id ? (
              <div className="space-y-4">
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="회의 제목"
                />
                <textarea
                  value={editSummary}
                  onChange={(e) => setEditSummary(e.target.value)}
                  className="w-full min-h-[100px] p-2 border rounded"
                  placeholder="회의록 내용"
                />
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingId(null)}
                  >
                    <X className="h-4 w-4 mr-2" />
                    취소
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleSave(meeting.id)}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    저장
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-medium">{meeting.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {formatDate(meeting.created_at)}
                    </p>
                  </div>
                  <div className="flex gap-2 ml-4 items-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleShare(meeting)}
                      title="공유하기"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(meeting)}
                      title="수정하기"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteId(meeting.id)}
                      title="삭제하기"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleExpand(meeting.id)}
                      className="p-0 h-auto hover:bg-transparent"
                      title={expandedId === meeting.id ? "접기" : "펼치기"}
                    >
                      {expandedId === meeting.id ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                {expandedId === meeting.id && (
                  <div className="mt-4">
                    <div className="text-sm text-gray-600 whitespace-pre-line">
                      {meeting.summary}
                    </div>
                    {meeting.diarized_text && (
                      <div className="mt-4">
                        <h4 className="text-sm font-medium mb-2">전체 회의내용:</h4>
                        <div className="text-sm text-gray-600 whitespace-pre-line">
                          {meeting.diarized_text}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </Card>
        ))}

        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>회의록 삭제</AlertDialogTitle>
              <AlertDialogDescription>
                정말로 이 회의록을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>취소</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteId && handleDelete(deleteId)}
              >
                삭제
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <Dialog open={!!shareId} onOpenChange={() => setShareId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>이메일로 공유하기</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              type="email"
              placeholder="받는 사람 이메일"
              value={emailTo}
              onChange={(e) => setEmailTo(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && emailTo.trim() && emailTo.includes('@')) {
                  const meeting = meetings.find(m => m.id === shareId)
                  if (meeting) handleSendEmail(meeting)
                }
              }}
            />
            <Button
              onClick={() => {
                const meeting = meetings.find(m => m.id === shareId)
                if (meeting) handleSendEmail(meeting)
              }}
              disabled={!emailTo.trim() || !emailTo.includes('@')}
            >
              전송
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
} 