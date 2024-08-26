import { NextResponse } from 'next/server'
import { callStoredProcedure } from '../../db'
import { uploadFile, deleteFile, getObjectSignedUrl } from '../../lib/s3'

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '200mb' // Set body size limit to 200MB
    }
  }
}

export async function GET(request) {
  try {
    const result = await callStoredProcedure('sp_AdminGetSolitaires', {}, [
      'StatusID',
      'StatusMessage',
      'TotalCount',
      'SolitaireID',
      'ShapeName',
      'Carat',
      'ColorName',
      'FluorName',
      'PurityName',
      'CutName',
      'LabName',
      'PolishName',
      'SymmName',
      'LocationName',
      'CerificateNumber',
      'UniqueCode',
      'Image1',
      'Image2',
      'Image3',
      'Image4',
      'Image5',
      'PDFKey',
      'VideoKey',
      'IsActive'
    ])

    if (result.statusid === 1) {
      // Generate signed URLs for each solitaire, handling missing ImageKeys
      const solitairesWithUrls = await Promise.all(
        result.data.map(async solitaire => {
          const imageKeys = ['Image1', 'Image2', 'Image3', 'Image4', 'Image5']
          const imageUrls = await Promise.all(
            imageKeys.map(async key => {
              let imageUrl = null
              if (solitaire[key]) {
                try {
                  imageUrl = await getObjectSignedUrl(solitaire[key])
                  console.log(`Signed URL for solitaire ${solitaire.SolitaireID} (${key}):`, imageUrl)
                } catch (error) {
                  console.error(`Error generating signed URL for solitaire ${solitaire.SolitaireID} (${key}):`, error)
                }
              } else {
                console.log(`No image found for solitaire ${solitaire.SolitaireID} (${key})`)
              }
              return imageUrl
            })
          )

          // Generate signed URL for PDF
          let pdfUrl = null
          if (solitaire.PDFKey) {
            try {
              pdfUrl = await getObjectSignedUrl(solitaire.PDFKey)
              console.log(`Signed PDF URL for solitaire ${solitaire.SolitaireID}:`, pdfUrl)
            } catch (error) {
              console.error(`Error generating signed PDF URL for solitaire ${solitaire.SolitaireID}:`, error)
            }
          } else {
            console.log(`No PDF found for solitaire ${solitaire.SolitaireID}`)
          }

          // Generate signed URL for Video
          let videoUrl = null
          if (solitaire.VideoKey) {
            try {
              videoUrl = await getObjectSignedUrl(solitaire.VideoKey)
              console.log(`Signed Video URL for solitaire ${solitaire.SolitaireID}:`, videoUrl)
            } catch (error) {
              console.error(`Error generating signed Video URL for solitaire ${solitaire.SolitaireID}:`, error)
            }
          } else {
            console.log(`No Video found for solitaire ${solitaire.SolitaireID}`)
          }

          return {
            ...solitaire,
            Image1: imageUrls[0],
            Image2: imageUrls[1],
            Image3: imageUrls[2],
            Image4: imageUrls[3],
            Image5: imageUrls[4],
            pdfUrl: pdfUrl, // Add pdfUrl to the solitaire object
            videoUrl: videoUrl // Add videoUrl to the solitaire object
          }
        })
      )

      return NextResponse.json({
        statusid: result.statusid,
        statusmessage: result.statusmessage,
        totalcount: result.totalcount,
        solitaires: solitairesWithUrls
      })
    } else {
      throw new Error(result.statusmessage)
    }
  } catch (error) {
    console.error('Error fetching solitaires:', error)
    return NextResponse.json({ statusid: 0, statusmessage: 'Error fetching solitaires' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const formData = await request.formData()
    console.log('Form data:', formData)
    const ShapeID = parseInt(formData.get('ShapeID'), 10)
    const Carat = parseFloat(formData.get('Carat'))
    const ColorID = parseInt(formData.get('ColorID'), 10)
    const FluorID = parseInt(formData.get('FluorID'), 10)
    const PurityID = parseInt(formData.get('PurityID'), 10)
    const CutID = parseInt(formData.get('CutID'), 10)
    const LabID = parseInt(formData.get('LabID'), 10)
    const PolishID = parseInt(formData.get('PolishID'), 10)
    const SymmetryID = parseInt(formData.get('SymmetryID'), 10)
    const LocationID = parseInt(formData.get('LocationID'), 10)
    const CertificateNumber = formData.get('CertificateNumber')

    const imageFields = ['Image1', 'Image2', 'Image3', 'Image4', 'Image5']
    const uploadedImageKeys = await Promise.all(
      imageFields.map(async imageField => {
        const imageDataString = formData.get(imageField)
        let uploadedImageKey = null

        if (imageDataString) {
          try {
            const imageData = JSON.parse(imageDataString)
            const { fileName, base64, mimeType } = imageData
            const buffer = Buffer.from(base64.split(',')[1], 'base64')
            await uploadFile(buffer, fileName, mimeType)
            uploadedImageKey = fileName
          } catch (error) {
            console.error(`Error processing ${imageField}:`, error)
            // You can choose to return an error response here if an image upload is mandatory
          }
        }
        return uploadedImageKey
      })
    )

    // PDF Upload
    const pdfDataString = formData.get('PDF')
    let uploadedPDFKey = null

    if (pdfDataString) {
      try {
        const pdfData = JSON.parse(pdfDataString)
        const { fileName, base64, mimeType } = pdfData

        if (mimeType !== 'application/pdf') {
          return NextResponse.json({ error: 'Invalid PDF file type' }, { status: 400 })
        }

        const buffer = Buffer.from(base64.split(',')[1], 'base64')

        // Check file size
        const maxSizeInBytes = 100 * 1024 * 1024 // 100MB
        if (buffer.length > maxSizeInBytes) {
          return NextResponse.json({ error: 'PDF file size exceeds 100MB limit' }, { status: 400 })
        }

        await uploadFile(buffer, fileName, mimeType)
        uploadedPDFKey = fileName
      } catch (error) {
        console.error('Error uploading PDF:', error)
        return NextResponse.json({ error: 'Error uploading PDF' }, { status: 500 })
      }
    }

    // Video Upload
    const videoDataString = formData.get('Video')
    let uploadedVideoKey = null

    if (videoDataString) {
      try {
        const videoData = JSON.parse(videoDataString)
        const { fileName, base64, mimeType } = videoData

        // Check video file type
        const allowedVideoTypes = [
          'video/mp4',
          'video/webm',
          'video/ogg',
          'video/quicktime',
          'video/x-msvideo',
          'video/x-flv',
          'video/x-matroska'
        ]
        if (!allowedVideoTypes.includes(mimeType)) {
          return NextResponse.json({ error: 'Invalid video file type' }, { status: 400 })
        }

        const buffer = Buffer.from(base64.split(',')[1], 'base64')

        // Check file size
        const maxSizeInBytes = 100 * 1024 * 1024 // 100MB
        if (buffer.length > maxSizeInBytes) {
          return NextResponse.json({ error: 'Video file size exceeds 100MB limit' }, { status: 400 })
        }

        await uploadFile(buffer, fileName, mimeType)
        uploadedVideoKey = fileName
      } catch (error) {
        console.error('Error uploading Video:', error)
        return NextResponse.json({ error: 'Error uploading Video' }, { status: 500 })
      }
    }

    const CreatedBy = 1 // Replace with actual user ID
    const CompanyID = 1 // Replace with actual company ID

    const result = await callStoredProcedure(
      'sp_AdminCreateSolitaire',
      {
        ShapeID: ShapeID,
        Carat: Carat,
        ColorID: ColorID,
        FluorID: FluorID,
        PurityID: PurityID,
        CutID: CutID,
        LabID: LabID,
        PolishID: PolishID,
        SymmetryID: SymmetryID,
        LocationID: LocationID,
        CertificateNumber: CertificateNumber,
        Image1: uploadedImageKeys[0],
        Image2: uploadedImageKeys[1],
        Image3: uploadedImageKeys[2],
        Image4: uploadedImageKeys[3],
        Image5: uploadedImageKeys[4],
        PDFKey: uploadedPDFKey,
        VideoKey: uploadedVideoKey,
        CreatedBy: CreatedBy,
        CompanyID: CompanyID
      },
      ['StatusID', 'StatusMessage']
    )
    console.log('Result from sp_AdminCreateSolitaire:', result) // Log the complete result object

    if (result.statusid === 1) {
      return NextResponse.json({ statusid: result.statusid, statusmessage: result.statusmessage }, { status: 200 })
    } else {
      // Delete uploaded files from S3 if there's an error
      uploadedImageKeys.forEach(key => {
        if (key) {
          deleteFile(key)
            .then(() => console.log('Deleted file from S3:', key))
            .catch(error => console.error('Error deleting file from S3:', error))
        }
      })
      return NextResponse.json({ statusid: result.statusid, statusmessage: result.statusmessage }, { status: 400 })
    }
  } catch (error) {
    console.error('Error creating solitaire:', error)
    return NextResponse.json({ statusid: 0, statusmessage: 'Error creating solitaire' }, { status: 500 })
  }
}

export async function PUT(request) {
  try {
    const formData = await request.formData()

    const imageDataFields = ['Image1', 'Image2', 'Image3', 'Image4', 'Image5']
    const uploadedImageKeys = await Promise.all(
      imageDataFields.map(async imageFieldName => {
        const imageDataString = formData.get(imageFieldName)
        let uploadedImageKey = null

        if (imageDataString) {
          try {
            const imageData = JSON.parse(imageDataString)
            const { fileName, base64, mimeType } = imageData
            const buffer = Buffer.from(base64.split(',')[1], 'base64')
            await uploadFile(buffer, fileName, mimeType)
            uploadedImageKey = fileName // S3 object key
          } catch (error) {
            console.error(`Error processing ${imageField}:`, error)
          }
        }
        return uploadedImageKey
      })
    )

    const SolitaireID = parseInt(formData.get('SolitaireID'), 10)
    const ShapeID = parseInt(formData.get('ShapeID'), 10)
    const Carat = parseFloat(formData.get('Carat'))
    const ColorID = parseInt(formData.get('ColorID'), 10)
    const FluorID = parseInt(formData.get('FluorID'), 10)
    const PurityID = parseInt(formData.get('PurityID'), 10)
    const CutID = parseInt(formData.get('CutID'), 10)
    const LabID = parseInt(formData.get('LabID'), 10)
    const PolishID = parseInt(formData.get('PolishID'), 10)
    const SymmetryID = parseInt(formData.get('SymmetryID'), 10)
    const LocationID = parseInt(formData.get('LocationID'), 10)
    const CertificateNumber = formData.get('CertificateNumber')
    const ModifiedBy = 1

    // PDF Handling
    let uploadedPDFKey = formData.get('PDF')

    if (typeof uploadedPDFKey !== 'string' || !uploadedPDFKey.startsWith('https://')) {
      const pdfDataString = uploadedPDFKey
      uploadedPDFKey = null

      if (pdfDataString) {
        try {
          const pdfData = JSON.parse(pdfDataString)
          const { fileName, base64, mimeType } = pdfData

          // Validate PDF MIME type
          if (mimeType !== 'application/pdf') {
            return NextResponse.json({ error: 'Invalid PDF file type' }, { status: 400 })
          }

          const buffer = Buffer.from(base64.split(',')[1], 'base64')

          // Validate PDF file size
          const maxSizeInBytes = 100 * 1024 * 1024 // 100MB
          if (buffer.length > maxSizeInBytes) {
            return NextResponse.json({ error: 'PDF file size exceeds 100MB limit' }, { status: 400 })
          }

          await uploadFile(buffer, fileName, mimeType)
          uploadedPDFKey = fileName
        } catch (error) {
          console.error(`Error processing PDF:`, error)
          // Handle the error appropriately, possibly returning an error response
        }
      }
    }

    // Video Handling
    let uploadedVideoKey = formData.get('Video')

    if (typeof uploadedVideoKey !== 'string' || !uploadedVideoKey.startsWith('https://')) {
      const videoDataString = uploadedVideoKey
      uploadedVideoKey = null

      if (videoDataString) {
        try {
          const videoData = JSON.parse(videoDataString)
          const { fileName, base64, mimeType } = videoData

          // Validate video file type
          const allowedVideoTypes = [
            'video/mp4',
            'video/webm',
            'video/ogg',
            'video/quicktime',
            'video/x-msvideo',
            'video/x-flv',
            'video/x-matroska'
          ]
          if (!allowedVideoTypes.includes(mimeType)) {
            return NextResponse.json({ error: 'Invalid video file type' }, { status: 400 })
          }

          const buffer = Buffer.from(base64.split(',')[1], 'base64')

          // Validate video file size
          const maxSizeInBytes = 100 * 1024 * 1024 // 100MB
          if (buffer.length > maxSizeInBytes) {
            return NextResponse.json({ error: 'Video file size exceeds 100MB limit' }, { status: 400 })
          }

          await uploadFile(buffer, fileName, mimeType)
          uploadedVideoKey = fileName
        } catch (error) {
          console.error(`Error processing Video:`, error)
          // Handle the error appropriately, possibly returning an error response
        }
      }
    }

    const result = await callStoredProcedure(
      'sp_AdminUpdateSolitaire',
      {
        SolitaireID,
        ShapeID,
        Carat,
        ColorID,
        FluorID,
        PurityID,
        CutID,
        LabID,
        PolishID,
        SymmetryID,
        LocationID,
        CertificateNumber,
        Image1: uploadedImageKeys[0],
        Image2: uploadedImageKeys[1],
        Image3: uploadedImageKeys[2],
        Image4: uploadedImageKeys[3],
        Image5: uploadedImageKeys[4],
        PDFKey: uploadedPDFKey,
        VideoKey: uploadedVideoKey,
        ModifiedBy
      },
      ['StatusID', 'StatusMessage']
    )

    if (result.statusid === 1) {
      return NextResponse.json({ statusid: result.statusid, statusmessage: result.statusmessage }, { status: 200 })
    } else {
      return NextResponse.json({ statusid: result.statusid, statusmessage: result.statusmessage }, { status: 400 })
    }
  } catch (error) {
    console.error('Error in PUT handler route.js:', error)
    return NextResponse.json({ statusid: 0, statusmessage: 'Error updating solitaire' }, { status: 500 })
  }
}
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const solitaireId = searchParams.get('solitaireId')

    if (solitaireId) {
      const result = await callStoredProcedure('sp_AdminDeleteSolitaire', { SolitaireID: solitaireId }, [
        'StatusID',
        'StatusMessage'
      ])

      if (result.statusid === 1) {
        return NextResponse.json({ statusid: result.statusid, statusmessage: result.statusmessage }, { status: 200 })
      } else {
        return NextResponse.json({ statusid: result.statusid, statusmessage: result.statusmessage }, { status: 400 })
      }
    } else {
      return NextResponse.json({ statusid: 0, statusmessage: 'Missing solitaireId parameter' }, { status: 400 })
    }
  } catch (error) {
    console.error('Error deleting solitaire:', error)
    return NextResponse.json({ statusid: 0, statusmessage: 'Error deleting solitaire' }, { status: 500 })
  }
}
