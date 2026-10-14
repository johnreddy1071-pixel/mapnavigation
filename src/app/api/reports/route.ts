import { NextResponse } from 'next/server';
import { getReports, addReport, updateReportStatus } from '../../../lib/db/storage';
import { RouteIssue } from '../../../types/campus';

export async function GET() {
  try {
    const reports = getReports();
    return NextResponse.json({ success: true, count: reports.length, reports });
  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch issue reports' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.description || !body.issueType) {
      return NextResponse.json(
        { success: false, error: 'Description and issue type are required' },
        { status: 400 }
      );
    }

    const report = addReport({
      placeId: body.placeId,
      placeName: body.placeName,
      pathSegmentId: body.pathSegmentId,
      issueType: body.issueType,
      description: body.description.trim(),
      userContact: body.userContact?.trim(),
      status: 'PENDING',
    });

    return NextResponse.json({ success: true, report });
  } catch (error) {
    console.error('Error submitting report:', error);
    return NextResponse.json({ success: false, error: 'Failed to submit issue report' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ success: false, error: 'id and status are required' }, { status: 400 });
    }

    const updated = updateReportStatus(id, status as RouteIssue['status']);
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Report not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: `Report updated to ${status}` });
  } catch (error) {
    console.error('Error updating report:', error);
    return NextResponse.json({ success: false, error: 'Failed to update report' }, { status: 500 });
  }
}
