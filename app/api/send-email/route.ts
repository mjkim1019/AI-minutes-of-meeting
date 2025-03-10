import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

// Gmail SMTP 설정
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD // Gmail 앱 비밀번호
  }
})

export async function POST(request: Request) {
  try {
    const { to, subject, content } = await request.json()

    // 이메일 전송
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      text: content,
    })

    return NextResponse.json({ message: '이메일이 전송되었습니다.' })
  } catch (error) {
    console.error('Error sending email:', error)
    return NextResponse.json(
      { error: '이메일 전송에 실패했습니다.' },
      { status: 500 }
    )
  }
} 