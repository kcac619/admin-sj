// File: src/app/api/filters/symmetry/route.js
import { NextResponse } from 'next/server'
import { callStoredProcedure } from '../../db' // Corrected import path

export async function GET() {
  try {
    const result = await callStoredProcedure(
      'sp_AdminGetSymmetry',
      [],
      [
        'StatusID',
        'StatusMessage',
        'TotalCount',
        'SymmetryID', // Changed to SymmetryID
        'SymmetryName',
        'IsActive'
      ]
    )
    if (result.statusid === 1) {
      return NextResponse.json(
        {
          statusid: result.statusid,
          statusmessage: result.statusmessage,
          totalcount: result.totalcount,
          symmetry: result.data
        },
        { status: 200 }
      )
    } else {
      return NextResponse.json({ statusid: result.statusid, statusmessage: result.statusmessage }, { status: 400 })
    }
  } catch (error) {
    console.error('Error fetching symmetry:', error)
    return NextResponse.json({ statusid: 0, statusmessage: 'Error fetching symmetry' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const { SymmetryName, CreatedBy, CompanyID } = await request.json()

    const result = await callStoredProcedure('sp_AdminCreateSymmetry', { SymmetryName, CreatedBy, CompanyID }, [
      'StatusID',
      'StatusMessage'
    ])

    if (result.statusid === 1) {
      return NextResponse.json({ statusid: result.statusid, statusmessage: result.statusmessage }, { status: 200 })
    } else {
      return NextResponse.json({ statusid: result.statusid, statusmessage: result.statusmessage }, { status: 400 })
    }
  } catch (error) {
    console.error('Error creating symmetry:', error)
    return NextResponse.json({ statusid: 0, statusmessage: 'Error creating symmetry' }, { status: 500 })
  }
}

export async function PUT(request) {
  try {
    const { SymmetryID, SymmetryName, ModifiedBy } = await request.json() // Changed to SymmetryID

    const result = await callStoredProcedure('sp_AdminUpdateSymmetry', { SymmetryID, SymmetryName, ModifiedBy }, [
      'StatusID',
      'StatusMessage'
    ])

    if (result.statusid === 1) {
      return NextResponse.json({ statusid: result.statusid, statusmessage: result.statusmessage }, { status: 200 })
    } else {
      return NextResponse.json({ statusid: result.statusid, statusmessage: result.statusmessage }, { status: 400 })
    }
  } catch (error) {
    console.error('Error updating symmetry:', error)
    return NextResponse.json({ statusid: 0, statusmessage: 'Error updating symmetry' }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const symmetryId = searchParams.get('symmetryId') // Changed to symmetryId

    if (symmetryId) {
      const result = await callStoredProcedure('sp_AdminDeleteSymmetry', { SymmetryID: symmetryId }, [
        'StatusID',
        'StatusMessage'
      ])

      if (result.statusid === 1) {
        return NextResponse.json({ statusid: result.statusid, statusmessage: result.statusmessage }, { status: 200 })
      } else {
        return NextResponse.json({ statusid: result.statusid, statusmessage: result.statusmessage }, { status: 400 })
      }
    } else {
      return NextResponse.json({ statusid: 0, statusmessage: 'Missing symmetryId parameter' }, { status: 400 })
    }
  } catch (error) {
    console.error('Error deleting symmetry:', error)
    return NextResponse.json({ statusid: 0, statusmessage: 'Error deleting symmetry' }, { status: 500 })
  }
}
