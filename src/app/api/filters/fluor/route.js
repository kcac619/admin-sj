// File: src/app/api/filters/fluor/route.js
import { NextResponse } from 'next/server'
import { callStoredProcedure } from '../../db'

export async function GET() {
  try {
    const result = await callStoredProcedure(
      'sp_AdminGetFluor',
      [],
      ['StatusID', 'StatusMessage', 'TotalCount', 'FluorID', 'FluorName', 'IsActive']
    )
    if (result.statusid === 1) {
      return NextResponse.json(
        {
          statusid: result.statusid,
          statusmessage: result.statusmessage,
          totalcount: result.totalcount,
          fluor: result.data
        },
        { status: 200 }
      )
    } else {
      return NextResponse.json({ statusid: result.statusid, statusmessage: result.statusmessage }, { status: 400 })
    }
  } catch (error) {
    console.error('Error fetching fluor:', error)
    return NextResponse.json({ statusid: 0, statusmessage: 'Error fetching fluor' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const { FluorName, CreatedBy, CompanyID } = await request.json()

    const result = await callStoredProcedure('sp_AdminCreateFluor', { FluorName, CreatedBy, CompanyID }, [
      'StatusID',
      'StatusMessage'
    ])

    if (result.statusid === 1) {
      return NextResponse.json({ statusid: result.statusid, statusmessage: result.statusmessage }, { status: 200 })
    } else {
      return NextResponse.json({ statusid: result.statusid, statusmessage: result.statusmessage }, { status: 400 })
    }
  } catch (error) {
    console.error('Error creating fluor:', error)
    return NextResponse.json({ statusid: 0, statusmessage: 'Error creating fluor' }, { status: 500 })
  }
}

export async function PUT(request) {
  try {
    const { FluorID, FluorName, ModifiedBy } = await request.json()

    const result = await callStoredProcedure('sp_AdminUpdateFluor', { FluorID, FluorName, ModifiedBy }, [
      'StatusID',
      'StatusMessage'
    ])

    if (result.statusid === 1) {
      return NextResponse.json({ statusid: result.statusid, statusmessage: result.statusmessage }, { status: 200 })
    } else {
      return NextResponse.json({ statusid: result.statusid, statusmessage: result.statusmessage }, { status: 400 })
    }
  } catch (error) {
    console.error('Error updating fluor:', error)
    return NextResponse.json({ statusid: 0, statusmessage: 'Error updating fluor' }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const fluorId = searchParams.get('fluorId')

    if (fluorId) {
      const result = await callStoredProcedure('sp_AdminDeleteFluor', { FluorID: fluorId }, [
        'StatusID',
        'StatusMessage'
      ])

      if (result.statusid === 1) {
        return NextResponse.json({ statusid: result.statusid, statusmessage: result.statusmessage }, { status: 200 })
      } else {
        return NextResponse.json({ statusid: result.statusid, statusmessage: result.statusmessage }, { status: 400 })
      }
    } else {
      return NextResponse.json({ statusid: 0, statusmessage: 'Missing fluorId parameter' }, { status: 400 })
    }
  } catch (error) {
    console.error('Error deleting fluor:', error)
    return NextResponse.json({ statusid: 0, statusmessage: 'Error deleting fluor' }, { status: 500 })
  }
}
