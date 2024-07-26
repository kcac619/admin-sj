/** @type {import('next').NextConfig} */
import dotenv from 'dotenv'

dotenv.config()

const nextConfig = {
  basePath: process.env.BASEPATH,
  eslint: {
    ignoreDuringBuilds: true
  },
  images: {
    domains: [
      'woodesy.s3.ap-south-1.amazonaws.com' // Add your S3 bucket domain here
    ]
  },
  env: {
    SQL_USERNAME: process.env.SQL_USERNAME,
    SQL_PASSWORD: process.env.SQL_PASSWORD,
    SQL_HOST: process.env.SQL_HOST,
    SQL_DBNAME: process.env.SQL_DBNAME,
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
    AWS_ACCESS_KEY: process.env.AWS_ACCESS_KEY,
    AWS_BUCKET_NAME: process.env.AWS_BUCKET_NAME,
    AWS_BUCKET_REGION: process.env.AWS_BUCKET_REGION
  },
  redirects: async () => {
    return [
      {
        source: '/',
        destination: '/home',
        permanent: true,
        locale: false
      }
    ]
  }
}

export default nextConfig
