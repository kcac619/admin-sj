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
          if (shape.imageKey) {
            try {
              imageUrl = await getObjectSignedUrl(shape.imageKey)
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
    const file = formData.get('image') // Assuming 'image' is the file input name
    const ShapeName = formData.get('ShapeName')

    // Image upload using multer and s3.js
    const storage = multer.memoryStorage()
    const upload = multer({ storage: storage })
    const uploadResult = await upload.single('image')(request)

    if (uploadResult.error) {
      return NextResponse.json({ error: uploadResult.error }, { status: 400 })
    }

    const uploadedImageKey = uploadResult.file.originalname // S3 object key
    await uploadFile(uploadResult.file.buffer, uploadedImageKey, uploadResult.file.mimetype)

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
        IsActive: 1 // Set as active by default
      },
      ['StatusID', 'StatusMessage']
    )

    // console.log('Result from sp_AdminCreateShape:', result)

    if (result.statusid === 1) {
      return NextResponse.json({ message: result.statusmessage }, { status: 201 })
    } else {
      return NextResponse.json({ error: result.statusmessage }, { status: 400 })
    }
  } catch (error) {
    console.error(error)

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

export async function PUT(request) {
  try {
    const formData = await request.formData()
    console.log('Form data in PUT handler route.js:', formData)

    // Image upload using multer and s3.js
    const storage = multer.memoryStorage()
    const upload = multer({ storage: storage })

    // Use multer middleware
    // console.log('request before upload single image', request)
    return await upload.single('image')(request, {}, async err => {
      // Add "return await" here
      if (err) {
        console.error('Error uploading image:', err)
        return NextResponse.json({ error: err.message }, { status: 400 })
      }
      console.log('Request.image inside upload.single-image route.js:', request.image)
      let uploadedImageKey = null
      if (request.image) {
        uploadedImageKey = request.image[0].originalname
        await uploadFile(request.image[0].buffer, uploadedImageKey, request.image[0].mimetype)
      }

      const ShapeID = parseInt(formData.get('ShapeID'), 10)
      const ShapeName = formData.get('ShapeName')
      const IsActive = formData.get('IsActive')

      // Assuming you handle ModifiedBy in your application
      const ModifiedBy = 1

      console.log(ShapeID, ShapeName, uploadedImageKey, ModifiedBy, IsActive)
      // Call sp_AdminUpdateShape
      const result = await callStoredProcedure(
        'sp_AdminUpdateShape',
        {
          ShapeID: ShapeID,
          ShapeName: ShapeName,
          ImageKey: uploadedImageKey,
          ModifiedBy: ModifiedBy,
          IsActive: 1 // Set as active by default
        },
        ['StatusID', 'StatusMessage']
      )
      console.log('request after calling spadminupdate shape', request)

      if (result.statusid === 1) {
        return NextResponse.json({ message: result.statusmessage }, { status: 200 })
      } else {
        return NextResponse.json({ error: result.statusmessage }, { status: 400 })
      }
    }) // End of multer middleware callback
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Error updating shape' }, { status: 500 })
  }
}
