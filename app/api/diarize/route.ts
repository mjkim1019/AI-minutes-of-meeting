import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI()

export async function POST(request: Request) {
  try {
    const { text, speakerCount } = await request.json()

    // 화자 구분 프롬프트
    const prompt = `
다음 텍스트를 ${speakerCount}명의 화자로 구분해주세요.
각 화자를 [화자1], [화자2] 등으로 표시해주세요.

텍스트:
${text}
`

    const response = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-3.5-turbo",
    })

    return NextResponse.json({
      diarizedText: response.choices[0].message.content
    })
  } catch (error) {
    console.error('Error in diarize:', error)
    return NextResponse.json(
      { error: 'Failed to diarize text' },
      { status: 500 }
    )
  }
} 