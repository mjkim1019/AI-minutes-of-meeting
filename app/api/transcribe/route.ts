import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

interface ErrorResponse {
  status: number;
  details?: string;
  message: string;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const audioFile = formData.get('file') as Blob
    
    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      )
    }

    // 파일 타입 로깅
    console.log('File type:', audioFile.type)
    console.log('File size:', audioFile.size)

    const file = new File([audioFile], 'audio.wav', { 
      type: 'audio/wav'  // 강제로 WAV 형식 지정
    })

    const response = await openai.audio.transcriptions.create({
      file: file,
      model: 'whisper-1',
      language: 'ko',
    })

    return NextResponse.json(response)
  } catch (error: unknown) {
    const err = error as ErrorResponse;
    // 자세한 에러 로깅
    console.error('Transcription error details:', {
      message: err.message,
      status: err.status,
      response: err.details
    })

    return NextResponse.json(
      { error: err.message || 'Transcription failed' },
      { status: 500 }
    )
  }
} 