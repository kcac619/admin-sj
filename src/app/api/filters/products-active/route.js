// File: src/app/api/filters/products-active/route.js
import { NextResponse } from 'next/server'
import { callStoredProcedure } from '../../db'

export async function PUT(request) {
  try {
    const { productId, isActive } = await request.json()
    const modifiedBy = 1 // Replace with the actual user ID from your authentication system

    const result = await callStoredProcedure(
      'sp_AdminUpdateProductIsActive',
      {
        ProductID: productId,
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
    console.error('Error updating product IsActive status:', error)
    return NextResponse.json({ statusid: 0, statusmessage: 'Error updating product active status' }, { status: 500 })
  }
}
