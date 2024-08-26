import { NextResponse } from 'next/server'
import { callStoredProcedure } from '../../db'

export async function GET() {
  try {
    const result = await callStoredProcedure('sp_AdminGetCombos', {}, [
      'StatusID',
      'StatusMessage',
      'TotalCount',
      'ComboID',
      'SolitaireID1',
      'Solitaire1ShapeName',
      'SolitaireID2',
      'Solitaire2ShapeName',
      'SolitaireID3',
      'Solitaire3ShapeName',
      'SolitaireID4',
      'Solitaire4ShapeName',
      'SolitaireID5',
      'Solitaire5ShapeName',
      'SolitaireID6',
      'Solitaire6ShapeName',
      'IsActive'
    ])

    if (result.statusid === 1) {
      return NextResponse.json(
        {
          statusid: result.statusid,
          statusmessage: result.statusmessage,
          totalcount: result.totalcount,
          combos: result.data
        },
        { status: 200 }
      )
    } else {
      return NextResponse.json({ statusid: result.statusid, statusmessage: result.statusmessage }, { status: 400 })
    }
  } catch (error) {
    console.error('Error fetching combos:', error)
    return NextResponse.json({ statusid: 0, statusmessage: 'Error fetching combos' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const { SolitaireID1, SolitaireID2, SolitaireID3, SolitaireID4, SolitaireID5, SolitaireID6, CreatedBy, CompanyID } =
      await request.json()

    const result = await callStoredProcedure(
      'sp_AdminCreateCombo',
      {
        SolitaireID1,
        SolitaireID2,
        SolitaireID3,
        SolitaireID4,
        SolitaireID5,
        SolitaireID6,
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
    console.error('Error creating combo:', error)
    return NextResponse.json({ statusid: 0, statusmessage: 'Error creating combo' }, { status: 500 })
  }
}

export async function PUT(request) {
  try {
    const { ComboID, SolitaireID1, SolitaireID2, SolitaireID3, SolitaireID4, SolitaireID5, SolitaireID6, ModifiedBy } =
      await request.json()

    const result = await callStoredProcedure(
      'sp_AdminUpdateCombo',
      {
        ComboID,
        SolitaireID1,
        SolitaireID2,
        SolitaireID3,
        SolitaireID4,
        SolitaireID5,
        SolitaireID6,
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
    console.error('Error updating combo:', error)
    return NextResponse.json({ statusid: 0, statusmessage: 'Error updating combo' }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const comboId = searchParams.get('comboId')

    if (comboId) {
      const result = await callStoredProcedure('sp_AdminDeleteCombo', { ComboID: comboId }, [
        'StatusID',
        'StatusMessage'
      ])

      if (result.statusid === 1) {
        return NextResponse.json({ statusid: result.statusid, statusmessage: result.statusmessage }, { status: 200 })
      } else {
        return NextResponse.json({ statusid: result.statusid, statusmessage: result.statusmessage }, { status: 400 })
      }
    } else {
      return NextResponse.json({ statusid: 0, statusmessage: 'Missing comboId parameter' }, { status: 400 })
    }
  } catch (error) {
    console.error('Error deleting combo:', error)
    return NextResponse.json({ statusid: 0, statusmessage: 'Error deleting combo' }, { status: 500 })
  }
}
