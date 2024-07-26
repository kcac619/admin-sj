// File: src/app/api/filters/shapes/route.js
import { NextResponse } from 'next/server'

import { callStoredProcedure } from '../../db'
import { uploadFile, deleteFile, getObjectSignedUrl } from '../../lib/s3'
import multer from 'multer'

export async function GET(request) {
  try {
    const result = await callStoredProcedure('sp_GetShapes', {}, ['StatusID', 'StatusMessage', 'TotalCount'])
    // console.log('Result in API route:', result)

    if (result.statusid === 1) {
      // Generate signed URLs for each shape, handling missing ImageKey
      const shapesWithUrls = await Promise.all(
        result.data.map(async shape => {
          let imageUrl = null
          if (shape.ImageKey) {
            try {
              imageUrl = await getObjectSignedUrl(shape.ImageKey)
              console.log(`Signed URL for shape ${shape.ShapeID}:`, imageUrl)
            } catch (error) {
              console.error(`Error generating signed URL for shape ${shape.ShapeID}:`, error)
            }
          } else {
            console.log(`No image found for shape ${shape.ShapeID}`)
          }

          return { ...shape, imageUrl: imageUrl }
        })
      )

      return NextResponse.json({
        shapes: shapesWithUrls,
        totalCount: result.totalcount
      })
    } else {
      throw new Error(result.message)
    }
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Error fetching shapes' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const formData = await request.formData()
    const ShapeName = formData.get('ShapeName')

    const imageDataString = formData.get('imageData')
    let uploadedImageKey = null

    if (imageDataString) {
      const imageData = JSON.parse(imageDataString)
      const { fileName, base64, mimeType } = imageData
      const buffer = Buffer.from(base64.split(',')[1], 'base64')
      await uploadFile(buffer, fileName, mimeType)
      uploadedImageKey = fileName
    } else {
      // Handle the case where no imageData is received
      console.error('No image data received in POST request.')
      return NextResponse.json({ error: 'Image is required' }, { status: 400 })
    }

    // Assuming you'll handle CreatedBy and ModifiedBy in your application
    const CreatedBy = 1 // Replace with actual user ID
    const ModifiedBy = 1 // Replace with actual user ID

    const result = await callStoredProcedure(
      'sp_AdminCreateShape',
      {
        ShapeName: ShapeName,
        ImageKey: uploadedImageKey,
        CreatedBy: CreatedBy,
        ModifiedBy: ModifiedBy,
        IsActive: 1
      },
      ['StatusID', 'StatusMessage']
    )

    if (result.statusid === 1) {
      return NextResponse.json({ message: result.statusmessage }, { status: 201 })
    } else {
      return NextResponse.json({ error: result.statusmessage }, { status: 400 })
    }
  } catch (error) {
    console.error('Error in POST handler route.js:', error)
    return NextResponse.json({ error: 'Error creating shape' }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const shapeId = request.nextUrl.searchParams.get('shapeId') // Get shapeId from query parameter

    if (!shapeId) {
      return NextResponse.json({ error: 'Shape ID is required' }, { status: 400 })
    }

    const result = await callStoredProcedure(
      'sp_AdminDeleteShape',
      {
        ShapeID: parseInt(shapeId, 10)
      },
      ['StatusID', 'StatusMessage']
    )

    if (result.statusid === 1) {
      return NextResponse.json({ message: 'Shape deleted successfully' }, { status: 200 })
    } else {
      return NextResponse.json({ error: result.message }, { status: 400 })
    }
  } catch (error) {
    console.error('Error deleting shape:', error)

    return NextResponse.json({ error: 'Error deleting shape' }, { status: 500 })
  }
}

// export const config = {
//   api: {
//     bodyParser: true
//   }
// }

export async function PUT(request) {
  try {
    const formData = await request.formData()
    console.log('Form data in PUT handler route.js:', formData)

    const imageDataString = formData.get('imageData')
    let uploadedImageKey = null

    if (imageDataString) {
      const imageData = JSON.parse(imageDataString)
      const { fileName, base64, mimeType } = imageData
      const buffer = Buffer.from(base64.split(',')[1], 'base64')
      await uploadFile(buffer, fileName, mimeType)
      uploadedImageKey = fileName // S3 object key
    }

    const ShapeID = parseInt(formData.get('ShapeID'), 10)
    const ShapeName = formData.get('ShapeName')
    const IsActive = formData.get('IsActive')
    const ModifiedBy = 1

    console.log(
      'ShapeID:',
      ShapeID,
      'ShapeName:',
      ShapeName,
      'UploadedImageKey:',
      uploadedImageKey,
      'ModifiedBy:',
      ModifiedBy,
      'IsActive:',
      IsActive
    )

    const result = await callStoredProcedure(
      'sp_AdminUpdateShape',
      {
        ShapeID: ShapeID,
        ShapeName: ShapeName,
        ImageKey: uploadedImageKey,
        ModifiedBy: ModifiedBy,
        IsActive: 1
      },
      ['StatusID', 'StatusMessage']
    )

    console.log('Result from sp_AdminUpdateShape:', result)

    if (result.statusid === 1) {
      return NextResponse.json({ message: result.statusmessage }, { status: 200 })
    } else {
      return NextResponse.json({ error: result.statusmessage }, { status: 400 })
    }
  } catch (error) {
    console.error('Error in PUT handler route.js:', error)
    return NextResponse.json({ error: 'Error updating shape' }, { status: 500 })
  }
}
