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
    // Validate params
    const automationId = params?.id
    if (!automationId || automationId.trim() === '') {
      console.log('❌ [dm-image] Missing or invalid automation ID')
      return NextResponse.json({ error: 'Invalid automation ID' }, { status: 400 })
    }

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
      } catch (parseError: any) {
        console.log('⚠️ [dm-image] Failed to parse commentReply:', parseError.message)
        // Not JSON, ignore
      }
    }
    
    if (!imageData || !imageData.startsWith('data:image')) {
      console.log('❌ [dm-image] No valid image data found')
      return NextResponse.json({ error: 'Image not found' }, { status: 404 })
    }
    
    // Extract base64 data with validation
    const base64Match = imageData.match(/^data:image\/([^;]+);base64,(.+)$/)
    if (!base64Match || !base64Match[2]) {
      console.log('❌ [dm-image] Invalid base64 image format')
      return NextResponse.json({ error: 'Invalid image format' }, { status: 400 })
    }

    const contentType = base64Match[1] || 'jpeg'
    const base64Data = base64Match[2]

    // Decode base64 with error handling
    let imageBuffer: Buffer
    try {
      imageBuffer = Buffer.from(base64Data, 'base64')
      if (imageBuffer.length === 0) {
        throw new Error('Decoded buffer is empty')
      }
    } catch (decodeError: any) {
      console.error('❌ [dm-image] Failed to decode base64:', decodeError.message)
      return NextResponse.json({ error: 'Failed to decode image' }, { status: 500 })
    }
    
    console.log('✅ [dm-image] Serving image:', {
      contentType: `image/${contentType}`,
      bufferSize: imageBuffer.length,
      automationId,
    })
    
    return new NextResponse(imageBuffer as any, {
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
    console.error('❌ [dm-image] Unexpected error:', error)
    return NextResponse.json({ 
      error: 'Failed to serve image',
      details: error.message 
    }, { status: 500 })
  }
}

