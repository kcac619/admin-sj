import { NextResponse } from 'next/server'
import { callStoredProcedure } from '../../db'

export async function GET() {
  try {
    const result = await callStoredProcedure('sp_GetTestimonials', {}, [
      'StatusID',
      'StatusMessage',
      'TotalCount',
      'TestimonialID',
      'Title',
      'Quote',
      'Author',
      'ImageUrl',
      'IsActive'
    ])

    if (result.statusid === 1) {
      return NextResponse.json(
        {
          statusid: result.statusid,
          statusmessage: result.statusmessage,
          totalcount: result.totalcount,
          testimonials: result.data // Assuming your db.js returns data in result.data
        },
        { status: 200 }
      )
    } else {
      return NextResponse.json({ statusid: result.statusid, statusmessage: result.statusmessage }, { status: 400 })
    }
  } catch (error) {
    console.error('Error fetching testimonials:', error)
    return NextResponse.json({ statusid: 0, statusmessage: 'Error fetching testimonials' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const { Title, Quote, Author, ImageUrl, CreatedBy, CompanyID } = await request.json()

    const result = await callStoredProcedure(
      'sp_AdminCreateTestimonial',
      {
        Title: Title,
        Quote: Quote,
        Author: Author,
        ImageUrl: ImageUrl,
        CreatedBy: CreatedBy,
        CompanyID: CompanyID
      },
      ['StatusID', 'StatusMessage']
    )

    if (result.statusid === 1) {
      return NextResponse.json({ statusid: result.statusid, statusmessage: result.statusmessage }, { status: 200 })
    } else {
      return NextResponse.json({ statusid: result.statusid, statusmessage: result.statusmessage }, { status: 400 })
    }
  } catch (error) {
    console.error('Error creating testimonial:', error)
    return NextResponse.json({ statusid: 0, statusmessage: 'Error creating testimonial' }, { status: 500 })
  }
}

export async function PUT(request) {
  try {
    const { TestimonialID, Title, Quote, Author, ImageUrl, ModifiedBy } = await request.json()

    const result = await callStoredProcedure(
      'sp_AdminUpdateTestimonial',
      {
        TestimonialID: TestimonialID,
        Title: Title,
        Quote: Quote,
        Author: Author,
        ImageUrl: ImageUrl,
        ModifiedBy: ModifiedBy
      },
      ['StatusID', 'StatusMessage']
    )

    if (result.statusid === 1) {
      return NextResponse.json({ statusid: result.statusid, statusmessage: result.statusmessage }, { status: 200 })
    } else {
      return NextResponse.json({ statusid: result.statusid, statusmessage: result.statusmessage }, { status: 400 })
    }
  } catch (error) {
    console.error('Error updating testimonial:', error)
    return NextResponse.json({ statusid: 0, statusmessage: 'Error updating testimonial' }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const testimonialId = searchParams.get('testimonialId')

    if (testimonialId) {
      const result = await callStoredProcedure('sp_AdminDeleteTestimonial', { TestimonialID: testimonialId }, [
        'StatusID',
        'StatusMessage'
      ])

      if (result.statusid === 1) {
        return NextResponse.json({ statusid: result.statusid, statusmessage: result.statusmessage }, { status: 200 })
      } else {
        return NextResponse.json({ statusid: result.statusid, statusmessage: result.statusmessage }, { status: 400 })
      }
    } else {
      return NextResponse.json({ statusid: 0, statusmessage: 'Missing testimonialId parameter' }, { status: 400 })
    }
  } catch (error) {
    console.error('Error deleting testimonial:', error)
    return NextResponse.json({ statusid: 0, statusmessage: 'Error deleting testimonial' }, { status: 500 })
  }
}
