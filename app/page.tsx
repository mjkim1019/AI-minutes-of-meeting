'use client'

import { useState } from 'react'
import { Header } from "@/components/layout/header"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Clock } from "lucide-react"
import { SpeechToText } from "@/components/core/speech-to-text"
import { MeetingList } from "@/components/core/meeting-list"
import type { Meeting } from '@/lib/supabase'

export default function Home() {
  const [showMeetings, setShowMeetings] = useState(false)
  const [latestMeeting, setLatestMeeting] = useState<Meeting | null>(null)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="grid gap-6">
          <section className="text-center space-y-4">
            <h2 className="text-3xl font-bold">회의록 자동 작성 서비스</h2>
            <p className="text-muted-foreground">
              AI 음성 인식으로 회의 내용을 자동으로 기록하고 요약해드립니다
            </p>
          </section>
          
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-6">
              <div className="space-y-4">
                <FileText className="h-8 w-8" />
                <h3 className="text-xl font-semibold">최근 회의록</h3>
                {latestMeeting ? (
                  <div className="text-sm text-muted-foreground">
                    <p className="font-medium">{latestMeeting.title}</p>
                    <p>{formatDate(latestMeeting.created_at)}</p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">회의록을 확인해주세요.</p>
                )}
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setShowMeetings(!showMeetings)}
                >
                  {showMeetings ? '회의록 닫기' : '회의록 보기'}
                </Button>
              </div>
            </Card>
            
            <Card className="p-6">
              <div className="space-y-4">
                <Clock className="h-8 w-8" />
                <h3 className="text-xl font-semibold">예정된 회의</h3>
                <p className="text-sm text-muted-foreground">예정된 회의가 없습니다</p>
                <Button variant="outline" className="w-full">회의 예약</Button>
              </div>
            </Card>
          </div>

          {showMeetings ? (
            <MeetingList onLatestMeeting={setLatestMeeting} />
          ) : (
            <SpeechToText />
          )}
        </div>
      </main>
    </div>
  )
}
