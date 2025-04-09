'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { BookOpen } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface GlossaryButtonProps {
  onGlossaryUpdate?: (glossary: string) => void
}

export function GlossaryButton({ onGlossaryUpdate }: GlossaryButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [glossary, setGlossary] = useState('')

  const handleSave = () => {
    onGlossaryUpdate?.(glossary)
    setIsOpen(false)
  }

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setIsOpen(true)}
      >
        <BookOpen className="h-4 w-4 mr-2" />
        용어집
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>용어집 설정</DialogTitle>
            <DialogDescription>
              회의록 요약 시 사용할 전문 용어와 키워드를 입력하세요.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="glossary">용어집 내용</Label>
              <Textarea
                id="glossary"
                value={glossary}
                onChange={(e) => setGlossary(e.target.value)}
                placeholder="예시:&#10;API: Application Programming Interface&#10;SDK: Software Development Kit&#10;CI/CD: Continuous Integration/Continuous Deployment"
                className="min-h-[200px]"
              />
            </div>
            
            <div className="flex justify-end">
              <Button onClick={handleSave}>
                저장
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
} 