import { NextResponse } from 'next/server';
import { getPlaces, getPathNodes, getPathSegments } from '../../../lib/db/storage';
import { processGravityAssistantQuery } from '../../../lib/ai/gravityAssistant';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const query = body.query || body.message || '';
    const userLocation = body.userLocation || null;

    if (!query.trim()) {
      return NextResponse.json({ success: false, error: 'Query is required' }, { status: 400 });
    }

    const places = getPlaces();
    const nodes = getPathNodes();
    const segments = getPathSegments();

    const response = await processGravityAssistantQuery(query, {
      places,
      nodes,
      segments,
      userLocation,
    });

    return NextResponse.json({
      success: true,
      message: response.reply,
      routeData: response.routeData,
      suggestedPlaces: response.suggestedPlaces,
      actionPrompt: response.actionPrompt,
      isGrounded: response.isGrounded,
    });
  } catch (error) {
    console.error('Error handling chat query:', error);
    return NextResponse.json({ success: false, error: 'Internal assistant error' }, { status: 500 });
  }
}
