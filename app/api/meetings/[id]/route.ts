import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'

// DELETE /api/meetings/[id]
export async function DELETE(
  request: NextRequest
) {
  try {
    // URL에서 id 추출
    const id = request.nextUrl.pathname.split('/').pop()

    if (!id) {
      return NextResponse.json({ error: '회의 ID가 없습니다.' }, { status: 400 })
    }

    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({
      cookies: () => cookieStore
    })
    
    // deleted_at 필드 업데이트 (soft delete)
    const { error } = await supabase
      .from('meetings')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ message: 'Meeting deleted successfully' })
  } catch (error: unknown) {
    console.error('회의 삭제 중 에러 발생:', error)

    let status = 500
    let message = 'Error deleting meeting:'

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

// PATCH /api/meetings/[id]
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({
      cookies: () => cookies()
    })
    const body = await request.json()

    const { error } = await supabase
      .from('meetings')
      .update({
        title: body.title,
        summary: body.summary,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)

    if (error) throw error
    return NextResponse.json({ message: 'Meeting updated successfully' })
  } catch (error) {
    console.error('Error updating meeting:', error)
    return NextResponse.json(
      { error: 'Failed to update meeting' },
      { status: 500 }
    )
  }
} 