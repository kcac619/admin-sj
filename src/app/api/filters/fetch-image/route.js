import { NextResponse } from 'next/server'
import axios from 'axios'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const encodedImageUrl = searchParams.get('url') // Get Base64 encoded image URL from query parameter

  if (!encodedImageUrl) {
    return NextResponse.json({ error: 'Image URL is required' }, { status: 400 })
  }

  try {
    // Decode the Base64 string to get the original URL
    const decodedImageUrl = Buffer.from(encodedImageUrl, 'base64').toString('utf-8')

    // console.log('Encoded URL:', encodedImageUrl)
    // console.log('Decoded URL:', decodedImageUrl)

    // Use the decoded URL for the axios request
    const response = await axios.get(decodedImageUrl, { responseType: 'arraybuffer' }) // Get image data from S3
    const imageBuffer = Buffer.from(response.data, 'binary')

    // Set appropriate Content-Type header based on the fetched image
    const contentType = response.headers['content-type']

    // Return the image data as a buffer
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType
      }
    })
  } catch (error) {
    if (axios.isAxiosError(error)) {
      // Check if it's an Axios error
      console.error('Axios error fetching image from S3:', error.message)
      // Log the Axios error message for debugging
      if (error.response) {
        // The request was made and the server responded with a status code
        console.error('S3 Response Data:', error.response.data.toString('utf-8'))
        console.error('S3 Response Status:', error.response.status)
        console.error('S3 Response Headers:', error.response.headers)
      }
      return NextResponse.json({ error: 'Error fetching image from S3' }, { status: error.response?.status || 500 }) // Use S3 status or default to 500
    } else {
      console.error('Unexpected error fetching image from S3:', error)
      return NextResponse.json({ error: 'Error fetching image from S3' }, { status: 500 })
    }
  }
}
