// File: src/app/api/filters/carats/route.js
import { NextResponse } from 'next/server'
import { callStoredProcedure } from '../../db'

export async function GET() {
  try {
    const result = await callStoredProcedure(
      'sp_AdminGetCarats',
      [],
      ['StatusID', 'StatusMessage', 'TotalCount', 'CaratID', 'LowLimit', 'HighLimit', 'IsActive']
    )
    if (result.statusid === 1) {
      return NextResponse.json(
        {
          statusid: result.statusid,
          statusmessage: result.statusmessage,
          totalcount: result.totalcount,
          carats: result.data
        },
        { status: 200 }
      )
    } else {
      return NextResponse.json({ statusid: result.statusid, statusmessage: result.statusmessage }, { status: 400 })
    }
  } catch (error) {
    console.error('Error fetching carats:', error)
    return NextResponse.json({ statusid: 0, statusmessage: 'Error fetching carats' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const { LowLimit, HighLimit, CreatedBy, CompanyID } = await request.json()

    const result = await callStoredProcedure('sp_AdminCreateCarat', { LowLimit, HighLimit, CreatedBy, CompanyID }, [
      'StatusID',
      'StatusMessage'
    ])

    if (result.statusid === 1) {
      return NextResponse.json({ statusid: result.statusid, statusmessage: result.statusmessage }, { status: 200 })
    } else {
      return NextResponse.json({ statusid: result.statusid, statusmessage: result.statusmessage }, { status: 400 })
    }
  } catch (error) {
    console.error('Error creating carat:', error)
    return NextResponse.json({ statusid: 0, statusmessage: 'Error creating carat' }, { status: 500 })
  }
}

export async function PUT(request) {
  try {
    const { CaratID, LowLimit, HighLimit, ModifiedBy } = await request.json()

    const result = await callStoredProcedure('sp_AdminUpdateCarat', { CaratID, LowLimit, HighLimit, ModifiedBy }, [
      'StatusID',
      'StatusMessage'
    ])

    if (result.statusid === 1) {
      return NextResponse.json({ statusid: result.statusid, statusmessage: result.statusmessage }, { status: 200 })
    } else {
      return NextResponse.json({ statusid: result.statusid, statusmessage: result.statusmessage }, { status: 400 })
    }
  } catch (error) {
    console.error('Error updating carat:', error)
    return NextResponse.json({ statusid: 0, statusmessage: 'Error updating carat' }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const caratId = searchParams.get('caratId')

    if (caratId) {
      const result = await callStoredProcedure('sp_AdminDeleteCarat', { CaratID: caratId }, [
        'StatusID',
        'StatusMessage'
      ])

      if (result.statusid === 1) {
        return NextResponse.json({ statusid: result.statusid, statusmessage: result.statusmessage }, { status: 200 })
      } else {
        return NextResponse.json({ statusid: result.statusid, statusmessage: result.statusmessage }, { status: 400 })
      }
    } else {
      return NextResponse.json({ statusid: 0, statusmessage: 'Missing caratId parameter' }, { status: 400 })
    }
  } catch (error) {
    console.error('Error deleting carat:', error)
    return NextResponse.json({ statusid: 0, statusmessage: 'Error deleting carat' }, { status: 500 })
  }
}
