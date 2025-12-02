import { NextRequest, NextResponse } from 'next/server'
import { findAutomation } from '@/actions/automations/queries'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const automationId = params.id
    
    const automation = await findAutomation(automationId)
    
    if (!automation || !automation.listener) {
      return NextResponse.json({ error: 'Automation not found' }, { status: 404 })
    }
    
    // Extract image from commentReply JSON
    let imageData: string | null = null
    if (automation.listener.commentReply) {
      try {
        const parsed = JSON.parse(automation.listener.commentReply)
        imageData = parsed.dmImage || null
      } catch {
        // Not JSON, ignore
      }
    }
    
    if (!imageData || !imageData.startsWith('data:image')) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 })
    }
    
    // Extract base64 data
    const base64Data = imageData.split(',')[1]
    const imageBuffer = Buffer.from(base64Data, 'base64')
    
    // Determine content type
    const contentType = imageData.match(/data:image\/([^;]+)/)?.[1] || 'jpeg'
    
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': `image/${contentType}`,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (error: any) {
    console.error('❌ [dm-image] Error:', error)
    return NextResponse.json({ error: 'Failed to serve image' }, { status: 500 })
  }
}

