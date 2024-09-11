// File: src/app/api/filters/categories/route.js
import { NextResponse } from 'next/server'
import { callStoredProcedure } from '../../db'
import { uploadFile, deleteFile, getObjectSignedUrl } from '../../lib/s3'

export async function GET(request) {
  try {
    const result = await callStoredProcedure('sp_AdminGetCategories', {}, [
      'StatusID',
      'StatusMessage',
      'TotalCount',
      'CategoryID',
      'CategoryName',
      'Slug',
      'FeatureImage',
      'Featured',
      'Status',
      'Position',
      'Description',
      'MainID',
      'SubID',
      'IsActive'
    ])
    // console.log('Result in API route:', result)

    if (result.statusid === 1) {
      // Generate signed URLs for each shape, handling missing FeatureImage
      const categoriesWithUrls = await Promise.all(
        result.data.map(async category => {
          let featureImageUrl = null
          if (category.FeatureImage) {
            try {
              featureImageUrl = await getObjectSignedUrl(category.FeatureImage)
              console.log(`Signed URL for category ${category.CategoryID}:`, featureImageUrl)
            } catch (error) {
              console.error(`Error generating signed URL for category ${category.CategoryID}:`, error)
            }
          } else {
            console.log(`No image found for category ${category.CategoryID}`)
          }

          return { ...category, featureImageUrl: featureImageUrl }
        })
      )

      return NextResponse.json({
        categories: categoriesWithUrls,
        totalCount: result.totalcount
      })
    } else {
      throw new Error(result.message)
    }
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Error fetching categories' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const formData = await request.formData()
    const CategoryName = formData.get('CategoryName')
    const Slug = formData.get('Slug')
    const Featured = parseInt(formData.get('Featured'), 10)
    const Status = parseInt(formData.get('Status'), 10)
    const Position = parseInt(formData.get('Position'), 10) || null // Handle null for Position
    const Description = formData.get('Description')
    const MainID = parseInt(formData.get('MainID'), 10) || null // Handle null for MainID
    const SubID = parseInt(formData.get('SubID'), 10) || null // Handle null for SubID

    const imageDataString = formData.get('imageData')
    let uploadedImageKey = null

    if (imageDataString) {
      const imageData = JSON.parse(imageDataString)
      const { fileName, base64, mimeType } = imageData
      const buffer = Buffer.from(base64.split(',')[1], 'base64')
      await uploadFile(buffer, fileName, mimeType)
      uploadedImageKey = fileName
    } else {
      console.error('No image data received in POST request.')
      return NextResponse.json({ error: 'Image is required' }, { status: 400 })
    }

    const CreatedBy = 1 // Replace with actual user ID
    const ModifiedBy = 1 // Replace with actual user ID

    const result = await callStoredProcedure(
      'sp_AdminCreateCategory',
      {
        CategoryName: CategoryName,
        Slug: Slug,
        FeatureImage: uploadedImageKey, // Assign uploaded image key
        Featured: Featured,
        Status: Status,
        Position: Position,
        Description: Description,
        MainID: MainID,
        SubID: SubID,
        CreatedBy: CreatedBy,
        // ModifiedBy: ModifiedBy,
        // IsActive: 1,
        CompanyID: 1
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
    return NextResponse.json({ error: 'Error creating Category' }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get('categoryId') // Get categoryId from query parameter

    if (!categoryId) {
      return NextResponse.json({ error: 'Category ID is required' }, { status: 400 })
    }

    const result = await callStoredProcedure(
      'sp_AdminDeleteCategory',
      {
        CategoryID: parseInt(categoryId, 10)
      },
      ['StatusID', 'StatusMessage']
    )

    if (result.statusid === 1) {
      return NextResponse.json({ message: 'Category deleted successfully' }, { status: 200 })
    } else {
      return NextResponse.json({ error: result.message }, { status: 400 })
    }
  } catch (error) {
    console.error('Error deleting category:', error)

    return NextResponse.json({ error: 'Error deleting category' }, { status: 500 })
  }
}

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
    const CategoryID = parseInt(formData.get('CategoryID'), 10)
    const CategoryName = formData.get('CategoryName')
    const Slug = formData.get('Slug')
    const Featured = parseInt(formData.get('Featured'), 10)
    const Status = parseInt(formData.get('Status'), 10)
    const Position = parseInt(formData.get('Position'), 10) || null // Handle null for Position
    const Description = formData.get('Description')
    const MainID = parseInt(formData.get('MainID'), 10) || null // Handle null for MainID
    const SubID = parseInt(formData.get('SubID'), 10) || null // Handle null for SubID
    const IsActive = formData.get('IsActive')
    const ModifiedBy = 1

    console.log(
      'CategoryID:',
      CategoryID,
      'CategoryName:',
      CategoryName,
      'UploadedImageKey:',
      uploadedImageKey,
      'ModifiedBy:',
      ModifiedBy,
      'IsActive:',
      IsActive
    )

    const result = await callStoredProcedure(
      'sp_AdminUpdateCategory',
      {
        CategoryID: CategoryID,
        CategoryName: CategoryName,
        Slug: Slug,
        FeatureImage: uploadedImageKey, // Assign uploaded image key
        Featured: Featured,
        Status: Status,
        Position: Position,
        Description: Description,
        MainID: MainID,
        SubID: SubID,
        ModifiedBy: ModifiedBy
        // IsActive: 1
      },
      ['StatusID', 'StatusMessage']
    )

    console.log('Result from sp_AdminUpdateCategory:', result)

    if (result.statusid === 1) {
      return NextResponse.json({ message: result.statusmessage }, { status: 200 })
    } else {
      return NextResponse.json({ error: result.statusmessage }, { status: 400 })
    }
  } catch (error) {
    console.error('Error in PUT handler route.js:', error)
    return NextResponse.json({ error: 'Error updating category' }, { status: 500 })
  }
}
