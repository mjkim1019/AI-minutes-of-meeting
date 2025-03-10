import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { google } from 'googleapis'
import { OAuth2Client } from 'google-auth-library'

const oauth2Client = new OAuth2Client({
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  redirectUri: process.env.GOOGLE_REDIRECT_URI
})

// Gmail API 범위 설정
const SCOPES = ['https://www.googleapis.com/auth/gmail.send']

export async function GET(request: Request) {
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent'
  })

  return NextResponse.json({ url })
}

export async function POST(request: Request) {
  try {
    const { code } = await request.json()
    const { tokens } = await oauth2Client.getToken(code)
    
    // 토큰을 Supabase에 저장
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    const { error } = await supabase
      .from('user_tokens')
      .upsert({
        user_id: (await supabase.auth.getUser()).data.user?.id,
        google_access_token: tokens.access_token,
        google_refresh_token: tokens.refresh_token,
        expires_at: new Date(tokens.expiry_date!).toISOString()
      })

    if (error) throw error

    return NextResponse.json({ message: 'Gmail connected successfully' })
  } catch (error) {
    console.error('Error connecting Gmail:', error)
    return NextResponse.json(
      { error: 'Failed to connect Gmail' },
      { status: 500 }
    )
  }
} 