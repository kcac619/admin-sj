// api/db.js
import sql from 'mssql'

const config = {
  user: process.env.SQL_USERNAME,
  password: process.env.SQL_PASSWORD, // *** VERY IMPORTANT *** Change this password immediately
  server: process.env.SQL_HOST,
  database: process.env.SQL_DBNAME,
  options: {
    encrypt: false,
    trustServerCertificate: true
  }
}

const dbClientService = async () => {
  try {
    const pool = await sql.connect(config)

    return pool
  } catch (error) {
    console.error('Error connecting to database:', error)
    throw error
  }
}

async function callStoredProcedure(
  procedureName,
  params = {},
  outputParams = ['StatusID', 'StatusMessage', 'TotalCount']
) {
  try {
    const pool = await dbClientService()
    const request = pool.request()

    // Add parameters if provided
    if (Object.keys(params).length > 0) {
      for (const paramName in params) {
        request.input(paramName, params[paramName])
      }
    }

    // Add output parameters
    outputParams.forEach(paramName => {
      if (paramName === 'StatusID') {
        request.output(paramName, sql.Int)
      } else if (paramName === 'StatusMessage') {
        request.output(paramName, sql.VarChar(200))
      } else if (paramName === 'TotalCount') {
        request.output(paramName, sql.Int)
      }
    })

    const result = await request.execute(procedureName)

    // console.log('Result from stored procedure:', result)

    // Construct the return object dynamically
    const returnObject = { data: result.recordset }

    outputParams.forEach(paramName => {
      returnObject[paramName.toLowerCase()] = result.output[paramName]
    })

    return returnObject
  } catch (error) {
    console.error(`Error occurred calling sp - ${procedureName}`, error)
    throw error
  }
}

export { dbClientService, callStoredProcedure }
