import { Button } from "@/components/ui/button"
import { Mic, Settings } from "lucide-react"
import { VoiceRecorder } from "@/components/core/voice-recorder"

export function Header() {
  return (
    <header className="border-b">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <h1 className="text-2xl font-bold">EchoNote</h1>
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon">
            <Settings className="h-4 w-4" />
          </Button>
          <VoiceRecorder />
        </div>
      </div>
    </header>
  )
}