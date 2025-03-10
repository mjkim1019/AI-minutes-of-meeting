import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI()

export async function POST(request: Request) {
  try {
    const { text } = await request.json()
    
    const prompt = `
다음 회의 내용을 바탕으로:
1. 10자에서 20자 사이의 간단한 회의 제목을 생성해주세요.
2. 주요 내용을 3-4줄로 요약해주세요.

회의 내용:
${text}

형식:
제목: [회의 제목]
요약:
# 회의록 요약

## 주요 논의 사항
- (핵심 내용 정리)

## 의사결정 사항
- (결정된 사항들)

## 후속 조치
- (필요한 사항)

## 각 참석자 발언 요약
- (각 참석자별 주요 발언 내용)

## 특이사항
`

    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-3.5-turbo",
    })

    const result = completion.choices[0].message.content || ''
    const [titlePart, summaryPart] = result.split('요약:')
    const title = titlePart.replace('제목:', '').trim()
    const summary = summaryPart.trim()

    return NextResponse.json({ title, summary })
  } catch (error) {
    console.error('Error in summarize:', error)
    return NextResponse.json(
      { error: 'Failed to generate summary' },
      { status: 500 }
    )
  }
} 