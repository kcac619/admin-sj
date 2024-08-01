import { NextResponse } from 'next/server'
import { callStoredProcedure } from '../../db'

export async function GET() {
  try {
    const result = await callStoredProcedure(
      'sp_AdminGetColors',
      [],
      ['StatusID', 'StatusMessage', 'TotalCount', 'ColorID', 'ColorName', 'IsActive']
    )
    console.log('Result in API route:', result)
    if (result.statusid === 1) {
      return NextResponse.json(
        {
          statusid: result.statusid,
          statusmessage: result.statusmessage,
          totalcount: result.totalcount,
          colors: result.data
        },
        { status: 200 }
      )
    } else {
      return NextResponse.json({ statusid: result.statusid, statusmessage: result.statusmessage }, { status: 400 })
    }
  } catch (error) {
    console.error('Error fetching colors:', error)
    return NextResponse.json({ statusid: 0, statusmessage: 'Error fetching colors' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const { ColorName, CreatedBy, CompanyID } = await request.json()

    const result = await callStoredProcedure('sp_AdminCreateColor', { ColorName, CreatedBy, CompanyID }, [
      'StatusID',
      'StatusMessage'
    ])

    if (result.statusid === 1) {
      return NextResponse.json({ statusid: result.statusid, statusmessage: result.statusmessage }, { status: 200 })
    } else {
      return NextResponse.json({ statusid: result.statusid, statusmessage: result.statusmessage }, { status: 400 })
    }
  } catch (error) {
    console.error('Error creating color:', error)
    return NextResponse.json({ statusid: 0, statusmessage: 'Error creating color' }, { status: 500 })
  }
}

export async function PUT(request) {
  try {
    const { ColorID, ColorName, ModifiedBy } = await request.json()

    const result = await callStoredProcedure('sp_AdminUpdateColor', { ColorID, ColorName, ModifiedBy }, [
      'StatusID',
      'StatusMessage'
    ])

    if (result.statusid === 1) {
      return NextResponse.json({ statusid: result.statusid, statusmessage: result.statusmessage }, { status: 200 })
    } else {
      return NextResponse.json({ statusid: result.statusid, statusmessage: result.statusmessage }, { status: 400 })
    }
  } catch (error) {
    console.error('Error updating color:', error)
    return NextResponse.json({ statusid: 0, statusmessage: 'Error updating color' }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const colorId = searchParams.get('colorId')

    if (colorId) {
      const result = await callStoredProcedure('sp_AdminDeleteColor', { ColorID: colorId }, [
        'StatusID',
        'StatusMessage'
      ])

      if (result.statusid === 1) {
        return NextResponse.json({ statusid: result.statusid, statusmessage: result.statusmessage }, { status: 200 })
      } else {
        return NextResponse.json({ statusid: result.statusid, statusmessage: result.statusmessage }, { status: 400 })
      }
    } else {
      return NextResponse.json({ statusid: 0, statusmessage: 'Missing colorId parameter' }, { status: 400 })
    }
  } catch (error) {
    console.error('Error deleting color:', error)
    return NextResponse.json({ statusid: 0, statusmessage: 'Error deleting color' }, { status: 500 })
  }
}
