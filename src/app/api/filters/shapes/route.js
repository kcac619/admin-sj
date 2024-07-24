// File: src/app/api/filters/shapes/route.js
import { NextResponse } from 'next/server'

import { callStoredProcedure } from '../../db'

export async function GET(request) {
  try {
    const result = await callStoredProcedure('sp_GetShapes', {}, ['StatusID', 'StatusMessage', 'TotalCount'])

    console.log('Result in API route:', result)

    if (result.statusid === 1) {
      return NextResponse.json({
        shapes: result.data,
        totalCount: result.totalcount
      })
    } else {
      throw new Error(result.message)
    }
  } catch (error) {
    console.error(error)

    return NextResponse.json({ error: 'Error fetching shapes' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const body = await request.json()
    const { ShapeName, ImageUrl } = body

    // Assuming you'll handle CreatedBy and ModifiedBy in your application
    const CreatedBy = 1 // Replace with actual user ID
    const ModifiedBy = 1 // Replace with actual user ID

    const result = await callStoredProcedure(
      'sp_AdminCreateShape',
      {
        ShapeName: ShapeName,
        ImageUrl: ImageUrl,
        CreatedBy: CreatedBy,
        ModifiedBy: ModifiedBy,
        IsActive: 1 // Set as active by default
      },
      ['StatusID', 'StatusMessage']
    )

    console.log('Result from sp_AdminCreateShape:', result)

    if (result.statusid === 1) {
      return NextResponse.json({ message: result.message }, { status: 201 })
    } else {
      return NextResponse.json({ error: result.message }, { status: 400 })
    }
  } catch (error) {
    console.error(error)

    return NextResponse.json({ error: 'Error creating shape' }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const shapeId = request.nextUrl.searchParams.get('shapeId') // Get shapeId from query parameter

    if (!shapeId) {
      return NextResponse.json({ error: 'Shape ID is required' }, { status: 400 })
    }

    const result = await callStoredProcedure(
      'sp_AdminDeleteShape',
      {
        ShapeID: parseInt(shapeId, 10)
      },
      ['StatusID', 'StatusMessage']
    )

    if (result.statusid === 1) {
      return NextResponse.json({ message: 'Shape deleted successfully' }, { status: 200 })
    } else {
      return NextResponse.json({ error: result.message }, { status: 400 })
    }
  } catch (error) {
    console.error('Error deleting shape:', error)

    return NextResponse.json({ error: 'Error deleting shape' }, { status: 500 })
  }
}

export async function PUT(request) {
  try {
    const body = await request.json()
    const { ShapeID, ShapeName, ImageUrl, IsActive } = body

    // Assuming you handle ModifiedBy in your application
    const ModifiedBy = 1 // Replace with actual user ID

    const result = await callStoredProcedure(
      'sp_AdminUpdateShape',
      {
        ShapeID: ShapeID,
        ShapeName: ShapeName,
        ImageUrl: ImageUrl,
        ModifiedBy: ModifiedBy,
        IsActive: IsActive
      },
      ['StatusID', 'StatusMessage']
    )

    if (result.statusid === 1) {
      return NextResponse.json({ message: result.statusmessage }, { status: 200 })
    } else {
      return NextResponse.json({ error: result.statusmessage }, { status: 400 })
    }
  } catch (error) {
    console.error(error)

    return NextResponse.json({ error: 'Error updating shape' }, { status: 500 })
  }
}
