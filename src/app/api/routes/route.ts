import { NextResponse } from 'next/server';
import { getPlaces, getPathNodes, getPathSegments } from '../../../lib/db/storage';
import { findCampusRoute, routeBetweenPlaces, findNearestNode } from '../../../lib/routing/engine';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      startPlaceId,
      destPlaceId,
      startCoords, // [lat, lng]
      destCoords,  // [lat, lng]
      requireAccessible = false,
      avoidTemporaryClosures = true,
    } = body;

    const places = getPlaces();
    const nodes = getPathNodes();
    const segments = getPathSegments();

    // 1. Place-to-Place routing
    if (startPlaceId && destPlaceId) {
      const startPlace = places.find((p) => p.id === startPlaceId);
      const destPlace = places.find((p) => p.id === destPlaceId);

      if (!startPlace || !destPlace) {
        return NextResponse.json(
          { success: false, error: 'Start or destination place not found' },
          { status: 404 }
        );
      }

      const result = routeBetweenPlaces(startPlace, destPlace, nodes, segments, {
        requireAccessible,
        avoidTemporaryClosures,
      });

      return NextResponse.json({
        success: result.found,
        route: result,
        startPlace,
        destPlace,
      });
    }

    // 2. Coordinate-based routing (e.g. from user GPS position)
    let startNodeId = body.startNodeId;
    let endNodeId = body.endNodeId;

    if (startCoords && Array.isArray(startCoords)) {
      const snapped = findNearestNode(startCoords[0], startCoords[1], nodes, 350);
      if (snapped) {
        startNodeId = snapped.node.id;
      } else {
        return NextResponse.json({
          success: false,
          error: 'Starting location is too far from verified campus paths. Please select a campus landmark or gate.',
        });
      }
    }

    if (destPlaceId && !endNodeId) {
      const destPlace = places.find((p) => p.id === destPlaceId);
      if (destPlace) {
        endNodeId = destPlace.entranceNodeId || findNearestNode(destPlace.latitude, destPlace.longitude, nodes)?.node.id;
      }
    } else if (destCoords && Array.isArray(destCoords)) {
      const snapped = findNearestNode(destCoords[0], destCoords[1], nodes, 350);
      if (snapped) {
        endNodeId = snapped.node.id;
      }
    }

    if (!startNodeId || !endNodeId) {
      return NextResponse.json(
        { success: false, error: 'Could not connect points to the campus walkway network' },
        { status: 400 }
      );
    }

    const route = findCampusRoute(startNodeId, endNodeId, nodes, segments, {
      requireAccessible,
      avoidTemporaryClosures,
    });

    return NextResponse.json({
      success: route.found,
      route,
    });
  } catch (error) {
    console.error('Error calculating route:', error);
    return NextResponse.json({ success: false, error: 'Failed to calculate campus route' }, { status: 500 });
  }
}
