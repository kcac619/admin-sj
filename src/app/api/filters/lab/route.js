import { NextResponse } from 'next/server'
import { callStoredProcedure } from '../../db'

export async function GET() {
  try {
    const result = await callStoredProcedure(
      'sp_AdminGetLab',
      [],
      ['StatusID', 'StatusMessage', 'TotalCount', 'LabID', 'LabName', 'IsActive']
    )
    if (result.statusid === 1) {
      return NextResponse.json(
        {
          statusid: result.statusid,
          statusmessage: result.statusmessage,
          totalcount: result.totalcount,
          lab: result.data
        },
        { status: 200 }
      )
    } else {
      return NextResponse.json({ statusid: result.statusid, statusmessage: result.statusmessage }, { status: 400 })
    }
  } catch (error) {
    console.error('Error fetching lab:', error)
    return NextResponse.json({ statusid: 0, statusmessage: 'Error fetching lab' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const { LabName, CreatedBy, CompanyID } = await request.json()

    const result = await callStoredProcedure('sp_AdminCreateLab', { LabName, CreatedBy, CompanyID }, [
      'StatusID',
      'StatusMessage'
    ])

    if (result.statusid === 1) {
      return NextResponse.json({ statusid: result.statusid, statusmessage: result.statusmessage }, { status: 200 })
    } else {
      return NextResponse.json({ statusid: result.statusid, statusmessage: result.statusmessage }, { status: 400 })
    }
  } catch (error) {
    console.error('Error creating lab:', error)
    return NextResponse.json({ statusid: 0, statusmessage: 'Error creating lab' }, { status: 500 })
  }
}

export async function PUT(request) {
  try {
    const { LabID, LabName, ModifiedBy } = await request.json()

    const result = await callStoredProcedure('sp_AdminUpdateLab', { LabID, LabName, ModifiedBy }, [
      'StatusID',
      'StatusMessage'
    ])

    if (result.statusid === 1) {
      return NextResponse.json({ statusid: result.statusid, statusmessage: result.statusmessage }, { status: 200 })
    } else {
      return NextResponse.json({ statusid: result.statusid, statusmessage: result.statusmessage }, { status: 400 })
    }
  } catch (error) {
    console.error('Error updating lab:', error)
    return NextResponse.json({ statusid: 0, statusmessage: 'Error updating lab' }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const labId = searchParams.get('labId')

    if (labId) {
      const result = await callStoredProcedure('sp_AdminDeleteLab', { LabID: labId }, ['StatusID', 'StatusMessage'])

      if (result.statusid === 1) {
        return NextResponse.json({ statusid: result.statusid, statusmessage: result.statusmessage }, { status: 200 })
      } else {
        return NextResponse.json({ statusid: result.statusid, statusmessage: result.statusmessage }, { status: 400 })
      }
    } else {
      return NextResponse.json({ statusid: 0, statusmessage: 'Missing labId parameter' }, { status: 400 })
    }
  } catch (error) {
    console.error('Error deleting lab:', error)
    return NextResponse.json({ statusid: 0, statusmessage: 'Error deleting lab' }, { status: 500 })
  }
}
