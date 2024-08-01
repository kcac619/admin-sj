import { NextResponse } from 'next/server'
import { callStoredProcedure } from '../../db'

export async function PUT(request) {
  try {
    const { polishId, isActive } = await request.json()
    const modifiedBy = 1 // Replace with the actual user ID from your authentication system

    const result = await callStoredProcedure(
      'sp_AdminUpdatePolishIsActive',
      {
        PolishID: polishId,
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
    console.error('Error updating polish IsActive status:', error)
    return NextResponse.json({ statusid: 0, statusmessage: 'Error updating polish active status' }, { status: 500 })
  }
}
