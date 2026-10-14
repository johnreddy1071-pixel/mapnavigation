import { NextResponse } from 'next/server';
import { savePlace, savePathNode, savePathSegment, getPlaces, getPathNodes } from '../../../lib/db/storage';
import { Place, PathNode, PathSegment, CampusPlaceCategory } from '../../../types/campus';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { format, data, dryRun = false } = body; // format: 'geojson' | 'csv' | 'json'

    const report = {
      importedPlaces: 0,
      importedNodes: 0,
      importedSegments: 0,
      rejectedRecords: [] as { row: number | string; reason: string }[],
    };

    if (format === 'geojson') {
      const geojson = typeof data === 'string' ? JSON.parse(data) : data;
      if (!geojson.features || !Array.isArray(geojson.features)) {
        return NextResponse.json({ success: false, error: 'Invalid GeoJSON: features array expected' }, { status: 400 });
      }

      for (let i = 0; i < geojson.features.length; i++) {
        const f = geojson.features[i];
        const props = f.properties || {};
        const geom = f.geometry || {};

        if (geom.type === 'Point' && Array.isArray(geom.coordinates)) {
          const [lon, lat] = geom.coordinates;
          if (typeof lat !== 'number' || typeof lon !== 'number' || isNaN(lat) || isNaN(lon)) {
            report.rejectedRecords.push({ row: i + 1, reason: 'Invalid point coordinates' });
            continue;
          }

          if (props.type === 'node') {
            const node: PathNode = {
              id: props.id || `node-imp-${Date.now()}-${i}`,
              label: props.label || props.name || `Walkway Node ${i + 1}`,
              latitude: lat,
              longitude: lon,
              nodeType: props.nodeType || 'WALKWAY',
              verificationStatus: props.verificationStatus || 'VERIFIED',
              connectedPlaceId: props.connectedPlaceId,
            };
            if (!dryRun) savePathNode(node);
            report.importedNodes++;
          } else {
            // Treat as campus place
            const place: Place = {
              id: props.id || `place-imp-${Date.now()}-${i}`,
              name: props.name || `Campus Place ${i + 1}`,
              normalizedName: `${props.name || ''} ${props.category || ''} ${props.description || ''}`.toLowerCase(),
              code: props.code,
              category: (props.category as CampusPlaceCategory) || 'FACILITY',
              description: props.description || 'Imported campus place',
              latitude: lat,
              longitude: lon,
              floorInfo: props.floorInfo || 'Ground Level',
              facilities: Array.isArray(props.facilities) ? props.facilities : [],
              verificationStatus: props.verificationStatus || 'AWAITING_VERIFICATION',
              publicationStatus: 'PUBLISHED',
              aliases: Array.isArray(props.aliases) ? props.aliases : [],
              tags: Array.isArray(props.tags) ? props.tags : [],
              wheelchairAccessible: props.wheelchairAccessible ?? true,
              updatedAt: new Date().toISOString(),
            };
            if (!dryRun) savePlace(place);
            report.importedPlaces++;
          }
        } else if (geom.type === 'LineString' && Array.isArray(geom.coordinates)) {
          // Path segment import
          if (props.startNodeId && props.endNodeId) {
            const seg: PathSegment = {
              id: props.id || `seg-imp-${Date.now()}-${i}`,
              startNodeId: props.startNodeId,
              endNodeId: props.endNodeId,
              distanceMeters: Number(props.distanceMeters) || 20,
              isAccessible: props.isAccessible ?? true,
              accessStatus: props.accessStatus || 'OPEN',
              wayType: props.wayType || 'PAVED_WALKWAY',
              verificationStatus: props.verificationStatus || 'VERIFIED',
              instruction: props.instruction,
            };
            if (!dryRun) savePathSegment(seg);
            report.importedSegments++;
          } else {
            report.rejectedRecords.push({ row: i + 1, reason: 'LineString missing startNodeId or endNodeId' });
          }
        } else {
          report.rejectedRecords.push({ row: i + 1, reason: `Unsupported geometry type: ${geom.type}` });
        }
      }
    } else if (format === 'csv') {
      const lines = (typeof data === 'string' ? data : '').split(/\r?\n/).filter(Boolean);
      if (lines.length < 2) {
        return NextResponse.json({ success: false, error: 'CSV requires header line and data rows' }, { status: 400 });
      }

      const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
      const nameIdx = headers.indexOf('name');
      const latIdx = headers.indexOf('latitude') >= 0 ? headers.indexOf('latitude') : headers.indexOf('lat');
      const lonIdx = headers.indexOf('longitude') >= 0 ? headers.indexOf('longitude') : headers.indexOf('lng');
      const catIdx = headers.indexOf('category');
      const descIdx = headers.indexOf('description');

      if (nameIdx === -1 || latIdx === -1 || lonIdx === -1) {
        return NextResponse.json(
          { success: false, error: 'CSV must include name, latitude (lat), and longitude (lng) columns' },
          { status: 400 }
        );
      }

      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
        const name = cols[nameIdx];
        const lat = parseFloat(cols[latIdx]);
        const lon = parseFloat(cols[lonIdx]);

        if (!name || isNaN(lat) || isNaN(lon)) {
          report.rejectedRecords.push({ row: i + 1, reason: 'Missing name or valid lat/lon' });
          continue;
        }

        const category = (catIdx >= 0 && cols[catIdx] ? cols[catIdx].toUpperCase() : 'FACILITY') as CampusPlaceCategory;
        const description = descIdx >= 0 && cols[descIdx] ? cols[descIdx] : 'Imported university location';

        const place: Place = {
          id: `place-csv-${Date.now()}-${i}`,
          name,
          normalizedName: `${name} ${category} ${description}`.toLowerCase(),
          category,
          description,
          latitude: lat,
          longitude: lon,
          floorInfo: 'Ground Level',
          facilities: [],
          verificationStatus: 'AWAITING_VERIFICATION',
          publicationStatus: 'PUBLISHED',
          aliases: [],
          tags: ['imported'],
          wheelchairAccessible: true,
          updatedAt: new Date().toISOString(),
        };

        if (!dryRun) savePlace(place);
        report.importedPlaces++;
      }
    } else {
      return NextResponse.json({ success: false, error: 'Supported formats are: geojson, csv' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      report,
      message: dryRun
        ? `Validation dry-run completed: ${report.importedPlaces} places, ${report.importedNodes} nodes ready for import.`
        : `Successfully imported ${report.importedPlaces} places, ${report.importedNodes} nodes, ${report.importedSegments} segments.`,
    });
  } catch (error) {
    console.error('Import processing error:', error);
    return NextResponse.json({ success: false, error: 'Failed to process import data' }, { status: 500 });
  }
}
