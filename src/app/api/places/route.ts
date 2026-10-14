import { NextResponse } from 'next/server';
import { getPlaces, savePlace, deletePlace, getPlaceById } from '../../../lib/db/storage';
import { searchPlaces } from '../../../lib/search/searchService';
import { CampusPlaceCategory, Place } from '../../../types/campus';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const category = searchParams.get('category') as CampusPlaceCategory | 'ALL' | null;
    const allPlaces = getPlaces();

    if (query || (category && category !== 'ALL')) {
      const results = searchPlaces(query, allPlaces, category || 'ALL', 50);
      return NextResponse.json({
        success: true,
        count: results.length,
        places: results.map((r) => r.place),
        results,
      });
    }

    return NextResponse.json({
      success: true,
      count: allPlaces.length,
      places: allPlaces,
    });
  } catch (error) {
    console.error('Error fetching places:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch campus places' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.name || typeof body.latitude !== 'number' || typeof body.longitude !== 'number') {
      return NextResponse.json(
        { success: false, error: 'Place name, latitude, and longitude are required.' },
        { status: 400 }
      );
    }

    const id = body.id || `place-custom-${Date.now()}`;
    const newPlace: Place = {
      id,
      name: body.name.trim(),
      normalizedName: `${body.name} ${body.category || ''} ${body.description || ''} ${(body.aliases || []).join(' ')}`.toLowerCase(),
      code: body.code?.trim() || undefined,
      category: body.category || 'FACILITY',
      description: body.description?.trim() || 'University campus facility.',
      latitude: Number(body.latitude),
      longitude: Number(body.longitude),
      buildingId: body.buildingId?.trim() || undefined,
      floorInfo: body.floorInfo?.trim() || 'Ground Level',
      facilities: Array.isArray(body.facilities) ? body.facilities : [],
      verificationStatus: body.verificationStatus || 'AWAITING_VERIFICATION',
      publicationStatus: body.publicationStatus || 'PUBLISHED',
      aliases: Array.isArray(body.aliases) ? body.aliases : [],
      tags: Array.isArray(body.tags) ? body.tags : [],
      openingHours: body.openingHours?.trim() || undefined,
      wheelchairAccessible: body.wheelchairAccessible ?? true,
      contactPhone: body.contactPhone?.trim() || undefined,
      entranceNodeId: body.entranceNodeId?.trim() || undefined,
      updatedAt: new Date().toISOString(),
    };

    savePlace(newPlace);
    return NextResponse.json({ success: true, place: newPlace });
  } catch (error) {
    console.error('Error saving place:', error);
    return NextResponse.json({ success: false, error: 'Failed to save campus place' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'Place ID is required' }, { status: 400 });
    }

    const removed = deletePlace(id);
    if (!removed) {
      return NextResponse.json({ success: false, error: 'Place not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: `Place ${id} deleted successfully` });
  } catch (error) {
    console.error('Error deleting place:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete place' }, { status: 500 });
  }
}
