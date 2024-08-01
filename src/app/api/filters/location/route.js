import { NextResponse } from 'next/server'
import { callStoredProcedure } from '../../db' // Corrected import path

export async function GET() {
  try {
    const result = await callStoredProcedure(
      'sp_AdminGetLocation',
      [],
      ['StatusID', 'StatusMessage', 'TotalCount', 'LocationID', 'LocationName', 'IsActive']
    )
    if (result.statusid === 1) {
      return NextResponse.json(
        {
          statusid: result.statusid,
          statusmessage: result.statusmessage,
          totalcount: result.totalcount,
          location: result.data
        },
        { status: 200 }
      )
    } else {
      return NextResponse.json({ statusid: result.statusid, statusmessage: result.statusmessage }, { status: 400 })
    }
  } catch (error) {
    console.error('Error fetching location:', error)
    return NextResponse.json({ statusid: 0, statusmessage: 'Error fetching location' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const { LocationName, CreatedBy, CompanyID } = await request.json()

    const result = await callStoredProcedure('sp_AdminCreateLocation', { LocationName, CreatedBy, CompanyID }, [
      'StatusID',
      'StatusMessage'
    ])

    if (result.statusid === 1) {
      return NextResponse.json({ statusid: result.statusid, statusmessage: result.statusmessage }, { status: 200 })
    } else {
      return NextResponse.json({ statusid: result.statusid, statusmessage: result.statusmessage }, { status: 400 })
    }
  } catch (error) {
    console.error('Error creating location:', error)
    return NextResponse.json({ statusid: 0, statusmessage: 'Error creating location' }, { status: 500 })
  }
}

export async function PUT(request) {
  try {
    const { LocationID, LocationName, ModifiedBy } = await request.json()

    const result = await callStoredProcedure('sp_AdminUpdateLocation', { LocationID, LocationName, ModifiedBy }, [
      'StatusID',
      'StatusMessage'
    ])

    if (result.statusid === 1) {
      return NextResponse.json({ statusid: result.statusid, statusmessage: result.statusmessage }, { status: 200 })
    } else {
      return NextResponse.json({ statusid: result.statusid, statusmessage: result.statusmessage }, { status: 400 })
    }
  } catch (error) {
    console.error('Error updating location:', error)
    return NextResponse.json({ statusid: 0, statusmessage: 'Error updating location' }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const locationId = searchParams.get('locationId')

    if (locationId) {
      const result = await callStoredProcedure('sp_AdminDeleteLocation', { LocationID: locationId }, [
        'StatusID',
        'StatusMessage'
      ])

      if (result.statusid === 1) {
        return NextResponse.json({ statusid: result.statusid, statusmessage: result.statusmessage }, { status: 200 })
      } else {
        return NextResponse.json({ statusid: result.statusid, statusmessage: result.statusmessage }, { status: 400 })
      }
    } else {
      return NextResponse.json({ statusid: 0, statusmessage: 'Missing locationId parameter' }, { status: 400 })
    }
  } catch (error) {
    console.error('Error deleting location:', error)
    return NextResponse.json({ statusid: 0, statusmessage: 'Error deleting location' }, { status: 500 })
  }
}
