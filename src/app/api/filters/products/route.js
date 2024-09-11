import { NextResponse } from 'next/server'
import { callStoredProcedure } from '../../db'
import { uploadFile, deleteFile, getObjectSignedUrl } from '../../lib/s3'

export async function GET(request) {
  try {
    const result = await callStoredProcedure('sp_AdminGetProducts', {}, [
      'StatusID',
      'StatusMessage',
      'TotalCount',
      'ProductID',
      'ProductTitle',
      'CategoryName',
      'Description',
      'Price',
      'PreviousPrice',
      'Stock',
      'Sizes',
      'FeatureImage',
      'Policy',
      'Tags',
      'Featured',
      'Views',
      'Approved',
      'CreatedAt',
      'UpdatedAt',
      'Status',
      'ProductSlug',
      'ShortDescription',
      'SKU',
      'Image1',
      'Image2',
      'Image3',
      'Image4',
      'Image5',
      'Color',
      'Video',
      'Attribute',
      'VendorID',
      'Owner',
      'IsActive'
    ])

    if (result.statusid === 1) {
      // Generate signed URLs for product images, handling missing ImageKeys
      const productsWithUrls = await Promise.all(
        result.data.map(async product => {
          const imageKeys = ['Image1', 'Image2', 'Image3', 'Image4', 'Image5']
          const imageUrls = await Promise.all(
            imageKeys.map(async key => {
              let imageUrl = null
              if (product[key]) {
                try {
                  imageUrl = await getObjectSignedUrl(product[key])
                  console.log(`Signed URL for product ${product.ProductID} (${key}):`, imageUrl)
                } catch (error) {
                  console.error(`Error generating signed URL for product ${product.ProductID} (${key}):`, error)
                }
              } else {
                console.log(`No image found for product ${product.ProductID} (${key})`)
              }
              return imageUrl
            })
          )
          return {
            ...product,
            Image1: imageUrls[0],
            Image2: imageUrls[1],
            Image3: imageUrls[2],
            Image4: imageUrls[3],
            Image5: imageUrls[4]
          }
        })
      )

      return NextResponse.json({
        statusid: result.statusid,
        statusmessage: result.statusmessage,
        totalcount: result.totalcount,
        products: productsWithUrls
      })
    } else {
      throw new Error(result.message)
    }
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Error fetching products' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const formData = await request.formData()
    const CategoryID = parseInt(formData.get('CategoryID'), 10)
    const Title = formData.get('Title')
    const Description = formData.get('Description')
    const Price = parseFloat(formData.get('Price'))
    const PreviousPrice = parseFloat(formData.get('PreviousPrice')) // Parse PreviousPrice as float
    const Stock = parseInt(formData.get('Stock'), 10) || null // Parse Stock as integer or null
    const Sizes = formData.get('Sizes')
    //   const FeatureImage = formData.get('FeatureImage')
    const Policy = formData.get('Policy')
    const Tags = formData.get('Tags')
    const Featured = parseInt(formData.get('Featured'), 10)
    const Approved = formData.get('Approved')
    const Status = parseInt(formData.get('Status'), 10)
    const Slug = formData.get('Slug')
    const ShortDescription = formData.get('ShortDescription')
    const SKU = formData.get('SKU')
    const Color = formData.get('Color')
    const Video = formData.get('Video')
    const Attribute = formData.get('Attribute')
    const VendorID = parseInt(formData.get('VendorID'), 10) || null // Parse VendorID as integer or null
    const Owner = formData.get('Owner')

    const imageDataFields = ['Image1', 'Image2', 'Image3', 'Image4', 'Image5']
    const uploadedImageKeys = await Promise.all(
      imageDataFields.map(async imageFieldName => {
        const imageDataString = formData.get(imageFieldName)
        let uploadedImageKey = null

        if (imageDataString) {
          const imageData = JSON.parse(imageDataString)
          const { fileName, base64, mimeType } = imageData
          const buffer = Buffer.from(base64.split(',')[1], 'base64')
          await uploadFile(buffer, fileName, mimeType)
          uploadedImageKey = fileName
        }
        return uploadedImageKey
      })
    )

    // Assuming you'll handle CreatedBy and ModifiedBy in your application
    const CreatedBy = 1 // Replace with actual user ID
    const ModifiedBy = 1 // Replace with actual user ID

    const result = await callStoredProcedure(
      'sp_AdminCreateProduct',
      {
        CategoryID: CategoryID,
        Title: Title,
        Description: Description,
        Price: Price,
        PreviousPrice: PreviousPrice,
        Stock: Stock,
        Sizes: Sizes,
        //   FeatureImage: FeatureImage,
        Policy: Policy,
        Tags: Tags,
        Featured: Featured,
        Approved: Approved,
        Status: Status,
        Slug: Slug,
        ShortDescription: ShortDescription,
        SKU: SKU,
        Image1: uploadedImageKeys[0],
        Image2: uploadedImageKeys[1],
        Image3: uploadedImageKeys[2],
        Image4: uploadedImageKeys[3],
        Image5: uploadedImageKeys[4],
        Color: Color,
        Video: Video,
        Attribute: Attribute,
        VendorID: VendorID,
        Owner: Owner,
        CreatedBy: CreatedBy,
        ModifiedBy: ModifiedBy,
        IsActive: 1,
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
    return NextResponse.json({ error: 'Error creating shape' }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId') // Get shapeId from query parameter

    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 })
    }

    const result = await callStoredProcedure(
      'sp_AdminDeleteProduct',
      {
        ProductID: parseInt(productId, 10)
      },
      ['StatusID', 'StatusMessage']
    )

    if (result.statusid === 1) {
      return NextResponse.json({ message: 'Product deleted successfully' }, { status: 200 })
    } else {
      return NextResponse.json({ error: result.message }, { status: 400 })
    }
  } catch (error) {
    console.error('Error deleting product:', error)

    return NextResponse.json({ error: 'Error deleting product' }, { status: 500 })
  }
}
export async function PUT(request) {
  try {
    const formData = await request.formData()
    console.log('Form data in PUT handler route.js:', formData)

    const imageDataFields = ['Image1', 'Image2', 'Image3', 'Image4', 'Image5']
    const uploadedImageKeys = await Promise.all(
      imageDataFields.map(async imageFieldName => {
        const imageDataString = formData.get(imageFieldName)
        let uploadedImageKey = null

        if (imageDataString) {
          const imageData = JSON.parse(imageDataString)
          const { fileName, base64, mimeType } = imageData
          const buffer = Buffer.from(base64.split(',')[1], 'base64')
          await uploadFile(buffer, fileName, mimeType)
          uploadedImageKey = fileName // S3 object key
        }
        return uploadedImageKey
      })
    )

    const ProductID = parseInt(formData.get('ProductID'), 10)
    const CategoryID = parseInt(formData.get('CategoryID'), 10)
    const Title = formData.get('Title')
    const Description = formData.get('Description')
    const Price = parseFloat(formData.get('Price'))
    const PreviousPrice = parseFloat(formData.get('PreviousPrice')) // Parse PreviousPrice as float
    const Stock = parseInt(formData.get('Stock'), 10) || null // Parse Stock as integer or null
    const Sizes = formData.get('Sizes')
    //   const FeatureImage = formData.get('FeatureImage')
    const Policy = formData.get('Policy')
    const Tags = formData.get('Tags')
    const Featured = parseInt(formData.get('Featured'), 10)
    const Approved = formData.get('Approved')
    const Status = parseInt(formData.get('Status'), 10)
    const Slug = formData.get('Slug')
    const ShortDescription = formData.get('ShortDescription')
    const SKU = formData.get('SKU')
    const Color = formData.get('Color')
    const Video = formData.get('Video')
    const Attribute = formData.get('Attribute')
    const VendorID = parseInt(formData.get('VendorID'), 10) || null // Parse VendorID as integer or null
    const Owner = formData.get('Owner')

    const IsActive = formData.get('IsActive')
    const ModifiedBy = 1

    const result = await callStoredProcedure(
      'sp_AdminUpdateProduct',
      {
        ProductID: ProductID,
        CategoryID: CategoryID,
        Title: Title,
        Description: Description,
        Price: Price,
        PreviousPrice: PreviousPrice,
        Stock: Stock,
        Sizes: Sizes,
        //   FeatureImage: FeatureImage,
        Policy: Policy,
        Tags: Tags,
        Featured: Featured,
        Approved: Approved,
        Status: Status,
        Slug: Slug,
        ShortDescription: ShortDescription,
        SKU: SKU,
        Image1: uploadedImageKeys[0],
        Image2: uploadedImageKeys[1],
        Image3: uploadedImageKeys[2],
        Image4: uploadedImageKeys[3],
        Image5: uploadedImageKeys[4],
        Color: Color,
        Video: Video,
        Attribute: Attribute,
        VendorID: VendorID,
        Owner: Owner,
        ModifiedBy: ModifiedBy,
        IsActive: 1
      },
      ['StatusID', 'StatusMessage']
    )

    console.log('Result from sp_AdminUpdateProduct:', result)

    if (result.statusid === 1) {
      return NextResponse.json({ message: result.statusmessage }, { status: 200 })
    } else {
      return NextResponse.json({ error: result.statusmessage }, { status: 400 })
    }
  } catch (error) {
    console.error('Error in PUT handler route.js:', error)
    return NextResponse.json({ error: 'Error updating product' }, { status: 500 })
  }
}
