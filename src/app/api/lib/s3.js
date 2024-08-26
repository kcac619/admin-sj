// s3.js

import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const bucketName = process.env.MY_AWS_BUCKET_NAME
const region = process.env.MY_AWS_BUCKET_REGION
const accessKeyId = process.env.MY_AWS_ACCESS_KEY
const secretAccessKey = process.env.MY_AWS_SECRET_ACCESS_KEY

const s3Client = new S3Client({
  region,
  credentials: {
    accessKeyId,
    secretAccessKey
  }
})

export async function uploadFile(fileBuffer, fileName, mimetype) {
  const uploadParams = {
    Bucket: bucketName,
    Body: fileBuffer,
    Key: fileName,
    ContentType: mimetype
  }

  try {
    const data = await s3Client.send(new PutObjectCommand(uploadParams))
    console.log('Successfully uploaded file s3.js:', data)
    return data
  } catch (error) {
    console.error('Error uploading file s3.js:', error)
    throw error
  }
}

export async function deleteFile(fileName) {
  const deleteParams = {
    Bucket: bucketName,
    Key: fileName
  }

  return s3Client.send(new DeleteObjectCommand(deleteParams))
}

// get signed url for image to be displayed in browser
export async function getObjectSignedUrl(key) {
  const params = {
    Bucket: bucketName,
    Key: key
  }

  try {
    // https://aws.amazon.com/blogs/developer/generate-presigned-url-modular-aws-sdk-javascript/
    const command = new GetObjectCommand(params)
    const seconds = 86400
    const url = await getSignedUrl(s3Client, command, { expiresIn: seconds })
    console.log('Signed URL in S3.js:', url)
    return url
  } catch (error) {
    console.error('Error generating signed URL:', error)
    throw new Error('Could not generate signed URL:' + error)
  }
}
