import { NextResponse } from 'next/server';
import {
  getPathNodes,
  getPathSegments,
  savePathNode,
  savePathSegment,
  deletePathNode,
  deletePathSegment,
} from '../../../lib/db/storage';
import { PathNode, PathSegment } from '../../../types/campus';
import { calculateDistance } from '../../../lib/routing/engine';

export async function GET() {
  try {
    const nodes = getPathNodes();
    const segments = getPathSegments();
    return NextResponse.json({
      success: true,
      nodes,
      segments,
      nodeCount: nodes.length,
      segmentCount: segments.length,
    });
  } catch (error) {
    console.error('Error fetching paths:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch campus path network' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const action = body.action; // 'SAVE_NODE' | 'SAVE_SEGMENT' | 'CONNECT_NODES'

    if (action === 'SAVE_NODE') {
      const node: PathNode = {
        id: body.id || `node-custom-${Date.now()}`,
        label: body.label || 'Walkway Junction',
        latitude: Number(body.latitude),
        longitude: Number(body.longitude),
        nodeType: body.nodeType || 'WALKWAY',
        verificationStatus: body.verificationStatus || 'VERIFIED',
        connectedPlaceId: body.connectedPlaceId || undefined,
      };
      savePathNode(node);
      return NextResponse.json({ success: true, node });
    }

    if (action === 'SAVE_SEGMENT' || action === 'CONNECT_NODES') {
      const nodes = getPathNodes();
      const startNode = nodes.find((n) => n.id === body.startNodeId);
      const endNode = nodes.find((n) => n.id === body.endNodeId);

      if (!startNode || !endNode) {
        return NextResponse.json({ success: false, error: 'Start or end node does not exist' }, { status: 400 });
      }

      const distance =
        typeof body.distanceMeters === 'number' && body.distanceMeters > 0
          ? body.distanceMeters
          : calculateDistance(startNode.latitude, startNode.longitude, endNode.latitude, endNode.longitude);

      const segment: PathSegment = {
        id: body.id || `seg-custom-${Date.now()}`,
        startNodeId: body.startNodeId,
        endNodeId: body.endNodeId,
        distanceMeters: Math.max(1, Math.round(distance)),
        isAccessible: body.isAccessible ?? true,
        accessStatus: body.accessStatus || 'OPEN',
        wayType: body.wayType || 'PAVED_WALKWAY',
        verificationStatus: body.verificationStatus || 'VERIFIED',
        instruction: body.instruction || undefined,
      };

      savePathSegment(segment);
      return NextResponse.json({ success: true, segment });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error modifying path network:', error);
    return NextResponse.json({ success: false, error: 'Failed to modify path network' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'node' | 'segment'
    const id = searchParams.get('id');

    if (!id || !type) {
      return NextResponse.json({ success: false, error: 'id and type are required' }, { status: 400 });
    }

    if (type === 'node') {
      deletePathNode(id);
      return NextResponse.json({ success: true, message: `Node ${id} deleted` });
    } else if (type === 'segment') {
      deletePathSegment(id);
      return NextResponse.json({ success: true, message: `Segment ${id} deleted` });
    }

    return NextResponse.json({ success: false, error: 'Invalid type' }, { status: 400 });
  } catch (error) {
    console.error('Error deleting path item:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete path item' }, { status: 500 });
  }
}
