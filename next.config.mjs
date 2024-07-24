/** @type {import('next').NextConfig} */
import dotenv from 'dotenv'

dotenv.config()

const nextConfig = {
  basePath: process.env.BASEPATH,
  env: {
    SQL_USERNAME: process.env.SQL_USERNAME,
    SQL_PASSWORD: process.env.SQL_PASSWORD,
    SQL_HOST: process.env.SQL_HOST,
    SQL_DBNAME: process.env.SQL_DBNAME
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
