import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const audioFile = formData.get('file') as Blob
    const glossary = formData.get('glossary') as string
    
    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      )
    }

    // 파일 타입 로깅
    console.log('File type:', audioFile.type)
    console.log('File size:', audioFile.size)
    
    // 용어집 내용 콘솔에 출력
    console.log('Glossary:', glossary)

    const file = new File([audioFile], 'audio.wav', { 
      type: 'audio/wav'  // 강제로 WAV 형식 지정
    })

    const response = await openai.audio.transcriptions.create({
      file: file,
      model: 'gpt-4o-transcribe',
      language: 'ko',
      prompt: `다음은 회의에서 자주 사용되는 용어와 이름입니다: ${glossary || ''}`
    })

    // 요약 생성 시 용어집 내용을 프롬프트에 포함
    const summaryPrompt = `다음 회의 내용을 요약해주세요. 다음 전문 용어들을 참고해주세요:\n${glossary}\n\n회의 내용:\n${response.text}`

    // 요약 생성 API 호출
    const summaryResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/summarize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        text: summaryPrompt 
      })
    })

    if (!summaryResponse.ok) {
      throw new Error('Failed to generate summary')
    }

    const summaryData = await summaryResponse.json()

    return NextResponse.json({
      text: response.text,
      summary: summaryData.summary,
      title: summaryData.title,
      success: true
    })
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
      { 
        details: message,
        success: false
      },
      { status }
    )
  }
} 