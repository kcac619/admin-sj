import { NextResponse } from 'next/server'
import { callStoredProcedure } from '../../db'

export async function PUT(request) {
  try {
    const { pairId, isActive } = await request.json()
    const modifiedBy = 1 // Replace with actual user ID

    const result = await callStoredProcedure(
      'sp_AdminUpdatePairIsActive',
      {
        PairID: pairId,
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
    console.error('Error updating pair IsActive status:', error)
    return NextResponse.json({ statusid: 0, statusmessage: 'Error updating pair active status' }, { status: 500 })
  }
}
