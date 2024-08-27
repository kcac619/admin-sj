import { NextResponse } from 'next/server'
import { callStoredProcedure } from '../../db'

export async function GET() {
  try {
    const result = await callStoredProcedure('sp_AdminGetPairs', {}, [
      'StatusID',
      'StatusMessage',
      'TotalCount',
      'PairID',
      'PairName',
      'IsActive',
      'SolitaireIDs',
      'SolitaireShapeNames'
    ])
    console.log('admin get pairs result', result)
    if (result.statusid === 1) {
      // Format the data (no need to group anymore)
      const pairs = result.data.map(pair => ({
        PairID: pair.PairID, // Access properties with correct case
        PairName: pair.PairName,
        IsActive: pair.IsActive,
        SolitaireIDs: pair.SolitaireIDs ? pair.SolitaireIDs.split(',').map(Number) : [],
        SolitaireShapeNames: pair.SolitaireShapeNames ? pair.SolitaireShapeNames.split(',') : []
      }))

      return NextResponse.json(
        {
          statusid: result.statusid,
          statusmessage: result.statusmessage,
          totalcount: result.totalcount,
          pairs: pairs
        },
        { status: 200 }
      )
    } else {
      return NextResponse.json({ statusid: result.statusid, statusmessage: result.statusmessage }, { status: 400 })
    }
  } catch (error) {
    console.error('Error fetching pairs:', error)
    return NextResponse.json({ statusid: 0, statusmessage: 'Error fetching pairs' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const { PairName, SolitaireIDs, CreatedBy, CompanyID } = await request.json()

    // Ensure SolitaireIDs is a comma-separated string
    const solitaireIDsString = Array.isArray(SolitaireIDs) ? SolitaireIDs.join(',') : SolitaireIDs

    const result = await callStoredProcedure(
      'sp_AdminCreatePair',
      {
        PairName,
        SolitaireIDs: solitaireIDsString, // Pass the comma-separated string
        CreatedBy,
        CompanyID
      },
      ['StatusID', 'StatusMessage']
    )

    if (result.statusid === 1) {
      return NextResponse.json({ statusid: result.statusid, statusmessage: result.statusmessage }, { status: 200 })
    } else {
      return NextResponse.json({ statusid: result.statusid, statusmessage: result.statusmessage }, { status: 400 })
    }
  } catch (error) {
    console.error('Error creating pair:', error)
    return NextResponse.json({ statusid: 0, statusmessage: 'Error creating pair' }, { status: 500 })
  }
}

export async function PUT(request) {
  try {
    const { PairID, PairName, SolitaireIDs, ModifiedBy } = await request.json()

    // Ensure SolitaireIDs is a comma-separated string
    const solitaireIDsString = Array.isArray(SolitaireIDs) ? SolitaireIDs.join(',') : SolitaireIDs

    const result = await callStoredProcedure(
      'sp_AdminUpdatePair',
      {
        PairID,
        PairName,
        SolitaireIDs: solitaireIDsString, // Pass the comma-separated string
        ModifiedBy
      },
      ['StatusID', 'StatusMessage']
    )

    if (result.statusid === 1) {
      return NextResponse.json({ statusid: result.statusid, statusmessage: result.statusmessage }, { status: 200 })
    } else {
      return NextResponse.json({ statusid: result.statusid, statusmessage: result.statusmessage }, { status: 400 })
    }
  } catch (error) {
    console.error('Error updating pair:', error)
    return NextResponse.json({ statusid: 0, statusmessage: 'Error updating pair' }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const pairId = searchParams.get('pairId')

    if (pairId) {
      const result = await callStoredProcedure('sp_AdminDeletePair', { PairID: pairId }, ['StatusID', 'StatusMessage'])

      if (result.statusid === 1) {
        return NextResponse.json({ statusid: result.statusid, statusmessage: result.statusmessage }, { status: 200 })
      } else {
        return NextResponse.json({ statusid: result.statusid, statusmessage: result.statusmessage }, { status: 400 })
      }
    } else {
      return NextResponse.json({ statusid: 0, statusmessage: 'Missing pairId parameter' }, { status: 400 })
    }
  } catch (error) {
    console.error('Error deleting pair:', error)
    return NextResponse.json({ statusid: 0, statusmessage: 'Error deleting pair' }, { status: 500 })
  }
}
