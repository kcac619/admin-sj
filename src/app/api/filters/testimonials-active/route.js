import { NextResponse } from 'next/server'
import { callStoredProcedure } from '../../db'

export async function PUT(request) {
  try {
    const { testimonialId, isActive } = await request.json()
    const modifiedBy = 1 // Replace with actual user ID

    const result = await callStoredProcedure(
      'sp_AdminUpdateTestimonialIsActive',
      {
        TestimonialID: testimonialId,
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
    console.error('Error updating testimonial IsActive status:', error)
    return NextResponse.json(
      { statusid: 0, statusmessage: 'Error updating testimonial active status' },
      { status: 500 }
    )
  }
}
