import { NextRequest, NextResponse } from 'next/server'
import { findAutomation } from '@/actions/automations/queries'

// Handle OPTIONS request for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const automationId = params.id
    console.log('📸 [dm-image] Request received for automation:', automationId)
    
    const automation = await findAutomation(automationId)
    
    if (!automation || !automation.listener) {
      console.log('❌ [dm-image] Automation or listener not found')
      return NextResponse.json({ error: 'Automation not found' }, { status: 404 })
    }
    
    // Extract image from commentReply JSON
    let imageData: string | null = null
    if (automation.listener.commentReply) {
      try {
        const parsed = JSON.parse(automation.listener.commentReply)
        imageData = parsed.dmImage || null
        console.log('✅ [dm-image] Image data extracted:', {
          hasImage: !!imageData,
          imageType: imageData ? (imageData.startsWith('data:image') ? 'base64' : 'url') : 'none',
          imageLength: imageData?.length || 0,
        })
      } catch (parseError) {
        console.log('⚠️ [dm-image] Failed to parse commentReply:', parseError)
        // Not JSON, ignore
      }
    }
    
    if (!imageData || !imageData.startsWith('data:image')) {
      console.log('❌ [dm-image] No valid image data found')
      return NextResponse.json({ error: 'Image not found' }, { status: 404 })
    }
    
    // Extract base64 data
    const base64Data = imageData.split(',')[1]
    const imageBuffer = Buffer.from(base64Data, 'base64')
    
    // Determine content type
    const contentType = imageData.match(/data:image\/([^;]+)/)?.[1] || 'jpeg'
    
    console.log('✅ [dm-image] Serving image:', {
      contentType: `image/${contentType}`,
      bufferSize: imageBuffer.length,
      automationId,
    })
    
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': `image/${contentType}`,
        'Cache-Control': 'public, max-age=31536000, immutable',
        // ✅ Add CORS headers so Instagram/Facebook can access the image
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })
  } catch (error: any) {
    console.error('❌ [dm-image] Error:', error)
    return NextResponse.json({ error: 'Failed to serve image' }, { status: 500 })
  }
}

