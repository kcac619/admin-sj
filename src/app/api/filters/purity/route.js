import { NextResponse } from 'next/server'
import { callStoredProcedure } from '../../db'

export async function GET() {
  try {
    const result = await callStoredProcedure(
      'sp_AdminGetPurity',
      [],
      ['StatusID', 'StatusMessage', 'TotalCount', 'PurityID', 'PurityName', 'IsActive']
    )
    if (result.statusid === 1) {
      return NextResponse.json(
        {
          statusid: result.statusid,
          statusmessage: result.statusmessage,
          totalcount: result.totalcount,
          purity: result.data
        },
        { status: 200 }
      )
    } else {
      return NextResponse.json({ statusid: result.statusid, statusmessage: result.statusmessage }, { status: 400 })
    }
  } catch (error) {
    console.error('Error fetching purity:', error)
    return NextResponse.json({ statusid: 0, statusmessage: 'Error fetching purity' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const { PurityName, CreatedBy, CompanyID } = await request.json()

    const result = await callStoredProcedure('sp_AdminCreatePurity', { PurityName, CreatedBy, CompanyID }, [
      'StatusID',
      'StatusMessage'
    ])

    if (result.statusid === 1) {
      return NextResponse.json({ statusid: result.statusid, statusmessage: result.statusmessage }, { status: 200 })
    } else {
      return NextResponse.json({ statusid: result.statusid, statusmessage: result.statusmessage }, { status: 400 })
    }
  } catch (error) {
    console.error('Error creating purity:', error)
    return NextResponse.json({ statusid: 0, statusmessage: 'Error creating purity' }, { status: 500 })
  }
}

export async function PUT(request) {
  try {
    const { PurityID, PurityName, ModifiedBy } = await request.json()

    const result = await callStoredProcedure('sp_AdminUpdatePurity', { PurityID, PurityName, ModifiedBy }, [
      'StatusID',
      'StatusMessage'
    ])

    if (result.statusid === 1) {
      return NextResponse.json({ statusid: result.statusid, statusmessage: result.statusmessage }, { status: 200 })
    } else {
      return NextResponse.json({ statusid: result.statusid, statusmessage: result.statusmessage }, { status: 400 })
    }
  } catch (error) {
    console.error('Error updating purity:', error)
    return NextResponse.json({ statusid: 0, statusmessage: 'Error updating purity' }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const purityId = searchParams.get('purityId')

    if (purityId) {
      const result = await callStoredProcedure('sp_AdminDeletePurity', { PurityID: purityId }, [
        'StatusID',
        'StatusMessage'
      ])

      if (result.statusid === 1) {
        return NextResponse.json({ statusid: result.statusid, statusmessage: result.statusmessage }, { status: 200 })
      } else {
        return NextResponse.json({ statusid: result.statusid, statusmessage: result.statusmessage }, { status: 400 })
      }
    } else {
      return NextResponse.json({ statusid: 0, statusmessage: 'Missing purityId parameter' }, { status: 400 })
    }
  } catch (error) {
    console.error('Error deleting purity:', error)
    return NextResponse.json({ statusid: 0, statusmessage: 'Error deleting purity' }, { status: 500 })
  }
}
