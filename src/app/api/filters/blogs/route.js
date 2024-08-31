import { NextResponse } from 'next/server'
import { callStoredProcedure } from '../../db'

export async function GET() {
  try {
    const result = await callStoredProcedure('sp_AdminGetBlogs', {}, [
      'StatusID',
      'StatusMessage',
      'TotalCount',
      'BlogID',
      'Title',
      'Description',
      'ImageUrl',
      'Link',
      'Date',
      'IsActive'
    ])

    if (result.statusid === 1) {
      return NextResponse.json(
        {
          statusid: result.statusid,
          statusmessage: result.statusmessage,
          totalcount: result.totalcount,
          blogs: result.data
        },
        { status: 200 }
      )
    } else {
      return NextResponse.json({ statusid: result.statusid, statusmessage: result.statusmessage }, { status: 400 })
    }
  } catch (error) {
    console.error('Error fetching blogs:', error)
    return NextResponse.json({ statusid: 0, statusmessage: 'Error fetching blogs' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const { Title, Description, ImageUrl, Link, Date, CreatedBy, CompanyID } = await request.json()

    const result = await callStoredProcedure(
      'sp_AdminCreateBlog',
      {
        Title,
        Description,
        ImageUrl,
        Link,
        Date,
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
    console.error('Error creating blog:', error)
    return NextResponse.json({ statusid: 0, statusmessage: 'Error creating blog' }, { status: 500 })
  }
}

export async function PUT(request) {
  try {
    const { BlogID, Title, Description, ImageUrl, Link, Date, ModifiedBy } = await request.json()

    const result = await callStoredProcedure(
      'sp_AdminUpdateBlog',
      {
        BlogID,
        Title,
        Description,
        ImageUrl,
        Link,
        Date,
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
    console.error('Error updating blog:', error)
    return NextResponse.json({ statusid: 0, statusmessage: 'Error updating blog' }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const blogId = searchParams.get('blogId')

    if (blogId) {
      const result = await callStoredProcedure('sp_AdminDeleteBlog', { BlogID: blogId }, ['StatusID', 'StatusMessage'])

      if (result.statusid === 1) {
        return NextResponse.json({ statusid: result.statusid, statusmessage: result.statusmessage }, { status: 200 })
      } else {
        return NextResponse.json({ statusid: result.statusid, statusmessage: result.statusmessage }, { status: 400 })
      }
    } else {
      return NextResponse.json({ statusid: 0, statusmessage: 'Missing blogId parameter' }, { status: 400 })
    }
  } catch (error) {
    console.error('Error deleting blog:', error)
    return NextResponse.json({ statusid: 0, statusmessage: 'Error deleting blog' }, { status: 500 })
  }
}
