/** @type {import('next').NextConfig} */
import dotenv from 'dotenv'

dotenv.config()

const nextConfig = {
  basePath: process.env.BASEPATH,
  eslint: {
    ignoreDuringBuilds: true
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'woodesy.s3.ap-south-1.amazonaws.com',
        pathname: '/**'
      }
    ]
  },
  env: {
    SQL_USERNAME: process.env.SQL_USERNAME,
    SQL_PASSWORD: process.env.SQL_PASSWORD,
    SQL_HOST: process.env.SQL_HOST,
    SQL_DBNAME: process.env.SQL_DBNAME,
    MY_AWS_SECRET_ACCESS_KEY: process.env.MY_AWS_SECRET_ACCESS_KEY,
    MY_AWS_ACCESS_KEY: process.env.MY_AWS_ACCESS_KEY,
    MY_AWS_BUCKET_NAME: process.env.MY_AWS_BUCKET_NAME,
    MY_AWS_BUCKET_REGION: process.env.MY_AWS_BUCKET_REGION
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
