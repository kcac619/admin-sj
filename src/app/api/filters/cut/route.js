import { NextResponse } from 'next/server'
import { callStoredProcedure } from '../../db'

export async function GET() {
  try {
    const result = await callStoredProcedure(
      'sp_AdminGetCut',
      [],
      ['StatusID', 'StatusMessage', 'TotalCount', 'CutID', 'CutName', 'IsActive']
    )
    if (result.statusid === 1) {
      return NextResponse.json(
        {
          statusid: result.statusid,
          statusmessage: result.statusmessage,
          totalcount: result.totalcount,
          cut: result.data
        },
        { status: 200 }
      )
    } else {
      return NextResponse.json({ statusid: result.statusid, statusmessage: result.statusmessage }, { status: 400 })
    }
  } catch (error) {
    console.error('Error fetching cut:', error)
    return NextResponse.json({ statusid: 0, statusmessage: 'Error fetching cut' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const { CutName, CreatedBy, CompanyID } = await request.json()

    const result = await callStoredProcedure('sp_AdminCreateCut', { CutName, CreatedBy, CompanyID }, [
      'StatusID',
      'StatusMessage'
    ])

    if (result.statusid === 1) {
      return NextResponse.json({ statusid: result.statusid, statusmessage: result.statusmessage }, { status: 200 })
    } else {
      return NextResponse.json({ statusid: result.statusid, statusmessage: result.statusmessage }, { status: 400 })
    }
  } catch (error) {
    console.error('Error creating cut:', error)
    return NextResponse.json({ statusid: 0, statusmessage: 'Error creating cut' }, { status: 500 })
  }
}

export async function PUT(request) {
  try {
    const { CutID, CutName, ModifiedBy } = await request.json()

    const result = await callStoredProcedure('sp_AdminUpdateCut', { CutID, CutName, ModifiedBy }, [
      'StatusID',
      'StatusMessage'
    ])

    if (result.statusid === 1) {
      return NextResponse.json({ statusid: result.statusid, statusmessage: result.statusmessage }, { status: 200 })
    } else {
      return NextResponse.json({ statusid: result.statusid, statusmessage: result.statusmessage }, { status: 400 })
    }
  } catch (error) {
    console.error('Error updating cut:', error)
    return NextResponse.json({ statusid: 0, statusmessage: 'Error updating cut' }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const cutId = searchParams.get('cutId')

    if (cutId) {
      const result = await callStoredProcedure('sp_AdminDeleteCut', { CutID: cutId }, ['StatusID', 'StatusMessage'])

      if (result.statusid === 1) {
        return NextResponse.json({ statusid: result.statusid, statusmessage: result.statusmessage }, { status: 200 })
      } else {
        return NextResponse.json({ statusid: result.statusid, statusmessage: result.statusmessage }, { status: 400 })
      }
    } else {
      return NextResponse.json({ statusid: 0, statusmessage: 'Missing cutId parameter' }, { status: 400 })
    }
  } catch (error) {
    console.error('Error deleting cut:', error)
    return NextResponse.json({ statusid: 0, statusmessage: 'Error deleting cut' }, { status: 500 })
  }
}
