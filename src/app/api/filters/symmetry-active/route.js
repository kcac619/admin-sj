import { NextResponse } from 'next/server'
import { callStoredProcedure } from '../../db' // Corrected import path

export async function PUT(request) {
  try {
    const { symmetryId, isActive } = await request.json() // Changed to symmetryId
    const modifiedBy = 1 // Replace with the actual user ID from your authentication system

    const result = await callStoredProcedure(
      'sp_AdminUpdateSymmetryIsActive',
      {
        SymmetryID: symmetryId, // Changed to SymmetryID
        IsActive: isActive,
        ModifiedBy: modifiedBy
      },
      ['StatusID', 'StatusMessage']
    )

    if (result.statusid === 1) {
      return NextResponse.json({ statusid: result.statusid, statusmessage: result.statusmessage }, { status: 200 })
    } else {
      return NextResponse.json({ statusid: result.statusid, statusmessage: result.statusmessage }, { status: 400 })
    }
  } catch (error) {
    console.error('Error updating symmetry IsActive status:', error)
    return NextResponse.json({ statusid: 0, statusmessage: 'Error updating symmetry active status' }, { status: 500 })
  }
}
