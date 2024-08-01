import { NextResponse } from 'next/server'
import { callStoredProcedure } from '../../db'

export async function GET() {
  try {
    const result = await callStoredProcedure(
      'sp_AdminGetPolish',
      [],
      ['StatusID', 'StatusMessage', 'TotalCount', 'PolishID', 'PolishName', 'IsActive']
    )
    if (result.statusid === 1) {
      return NextResponse.json(
        {
          statusid: result.statusid,
          statusmessage: result.statusmessage,
          totalcount: result.totalcount,
          polish: result.data
        },
        { status: 200 }
      )
    } else {
      return NextResponse.json({ statusid: result.statusid, statusmessage: result.statusmessage }, { status: 400 })
    }
  } catch (error) {
    console.error('Error fetching polish:', error)
    return NextResponse.json({ statusid: 0, statusmessage: 'Error fetching polish' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const { PolishName, CreatedBy, CompanyID } = await request.json()

    const result = await callStoredProcedure('sp_AdminCreatePolish', { PolishName, CreatedBy, CompanyID }, [
      'StatusID',
      'StatusMessage'
    ])

    if (result.statusid === 1) {
      return NextResponse.json({ statusid: result.statusid, statusmessage: result.statusmessage }, { status: 200 })
    } else {
      return NextResponse.json({ statusid: result.statusid, statusmessage: result.statusmessage }, { status: 400 })
    }
  } catch (error) {
    console.error('Error creating polish:', error)
    return NextResponse.json({ statusid: 0, statusmessage: 'Error creating polish' }, { status: 500 })
  }
}

export async function PUT(request) {
  try {
    const { PolishID, PolishName, ModifiedBy } = await request.json()

    const result = await callStoredProcedure('sp_AdminUpdatePolish', { PolishID, PolishName, ModifiedBy }, [
      'StatusID',
      'StatusMessage'
    ])

    if (result.statusid === 1) {
      return NextResponse.json({ statusid: result.statusid, statusmessage: result.statusmessage }, { status: 200 })
    } else {
      return NextResponse.json({ statusid: result.statusid, statusmessage: result.statusmessage }, { status: 400 })
    }
  } catch (error) {
    console.error('Error updating polish:', error)
    return NextResponse.json({ statusid: 0, statusmessage: 'Error updating polish' }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const polishId = searchParams.get('polishId')

    if (polishId) {
      const result = await callStoredProcedure('sp_AdminDeletePolish', { PolishID: polishId }, [
        'StatusID',
        'StatusMessage'
      ])

      if (result.statusid === 1) {
        return NextResponse.json({ statusid: result.statusid, statusmessage: result.statusmessage }, { status: 200 })
      } else {
        return NextResponse.json({ statusid: result.statusid, statusmessage: result.statusmessage }, { status: 400 })
      }
    } else {
      return NextResponse.json({ statusid: 0, statusmessage: 'Missing polishId parameter' }, { status: 400 })
    }
  } catch (error) {
    console.error('Error deleting polish:', error)
    return NextResponse.json({ statusid: 0, statusmessage: 'Error deleting polish' }, { status: 500 })
  }
}
