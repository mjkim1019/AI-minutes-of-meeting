import { VoiceRecorder } from "@/components/core/voice-recorder"

export function Header() {
  return (
    <header className="border-b">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <h1 className="text-2xl font-bold">EchoNote</h1>
        <div className="flex items-center gap-4">
          <VoiceRecorder />
        </div>
      </div>
    </header>
  )
}