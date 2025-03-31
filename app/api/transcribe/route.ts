import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

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
    console.error('회의 녹음 중 에러 발생:', error)

    let status = 500
    let message = 'Error transcribing audio:'

    if (error instanceof Error) {
      message = error.message
    }

    // SupabaseError나 특정 에러 객체 구조가 있다면 여기서 추가로 처리
    if (typeof error === 'object' && error !== null && 'status' in error) {
      status = (error as { status?: number }).status || 500
    }

    return NextResponse.json(
      { error: message },
      { status }
    )
  }
} 