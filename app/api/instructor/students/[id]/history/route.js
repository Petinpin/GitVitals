import { NextResponse } from 'next/server';
import prisma from '../../../../../../lib/prisma.js';

/**
 * GET /api/instructor/students/[id]/history
 * Get all submissions for a specific student with comparison to correct answers
 *
 * Query Parameters:
 * - includeGraded: Include graded submissions (default: true)
 * - includeUngraded: Include ungraded submissions (default: true)
 * - startDate: Filter from this date
 * - endDate: Filter until this date
 * - readingNumber: Filter by specific assignment
 */
export async function GET(request, { params }) {
  try {
    const { id: studentId } = params;
    const { searchParams } = new URL(request.url);

    const includeGraded = searchParams.get('includeGraded') !== 'false';
    const includeUngraded = searchParams.get('includeUngraded') !== 'false';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const readingNumber = searchParams.get('readingNumber');

    // Verify student exists
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    if (!student) {
      return NextResponse.json({ success: false, error: 'Student not found' }, { status: 404 });
    }

    // Build where clause
    const where = { studentId };

    // Filter by grading status
    if (!includeGraded && includeUngraded) {
      where.gradedAt = null;
    } else if (includeGraded && !includeUngraded) {
      where.gradedAt = { not: null };
    }

    // Filter by date range
    if (startDate || endDate) {
      where.checkDate = {};
      if (startDate) where.checkDate.gte = new Date(startDate);
      if (endDate) where.checkDate.lte = new Date(endDate);
    }

    // Filter by reading number
    if (readingNumber) {
      where.readingNumber = parseInt(readingNumber);
    }

    // Fetch all submissions for this student
    const submissions = await prisma.vitalReadings.findMany({
      where,
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            relationship: true
          }
        }
      },
      orderBy: [{ readingNumber: 'asc' }, { submittedAt: 'desc' }]
    });

    // Get correct vitals for comparison
    const submissionsWithComparison = await Promise.all(
      submissions.map(async submission => {
        const correctVitals = await prisma.correctVitals.findUnique({
          where: {
            patientId_readingNumber: {
              patientId: submission.patientId,
              readingNumber: submission.readingNumber
            }
          }
        });

        let comparison = null;
        if (correctVitals) {
          const bpSysCorrect = submission.bloodPressureSystolic === correctVitals.bloodPressureSystolic;
          const bpDiaCorrect = submission.bloodPressureDiastolic === correctVitals.bloodPressureDiastolic;
          const hrCorrect = submission.heartRate === correctVitals.heartRate;
          const tempCorrect = parseFloat(submission.temperature) === parseFloat(correctVitals.temperature);
          const rrCorrect = submission.respiratoryRate === correctVitals.respiratoryRate;
          const o2Correct = submission.oxygenSaturation === correctVitals.oxygenSaturation;

          comparison = {
            bloodPressure: {
              systolic: {
                correct: bpSysCorrect,
                diff: submission.bloodPressureSystolic - correctVitals.bloodPressureSystolic
              },
              diastolic: {
                correct: bpDiaCorrect,
                diff: submission.bloodPressureDiastolic - correctVitals.bloodPressureDiastolic
              }
            },
            heartRate: { correct: hrCorrect, diff: submission.heartRate - correctVitals.heartRate },
            temperature: {
              correct: tempCorrect,
              diff: (parseFloat(submission.temperature) - parseFloat(correctVitals.temperature)).toFixed(1)
            },
            respiratoryRate: { correct: rrCorrect, diff: submission.respiratoryRate - correctVitals.respiratoryRate },
            oxygenSaturation: {
              correct: o2Correct,
              diff: submission.oxygenSaturation - correctVitals.oxygenSaturation
            },
            allCorrect: bpSysCorrect && bpDiaCorrect && hrCorrect && tempCorrect && rrCorrect && o2Correct
          };
        }

        return {
          ...submission,
          hasAnswerKey: !!correctVitals,
          comparison
        };
      })
    );

    // Calculate student statistics
    const stats = {
      totalSubmissions: submissions.length,
      gradedSubmissions: submissions.filter(s => s.gradedAt).length,
      ungradedSubmissions: submissions.filter(s => !s.gradedAt).length,
      correctSubmissions: submissions.filter(s => s.isCorrect === true).length,
      incorrectSubmissions: submissions.filter(s => s.isCorrect === false).length,
      uniqueReadingNumbers: [...new Set(submissions.map(s => s.readingNumber))].sort((a, b) => a - b),
      completionPercentage: ((submissions.length / 50) * 100).toFixed(2) + '%', // Out of 50 total
      accuracyRate:
        submissions.filter(s => s.gradedAt).length > 0
          ? (
              (submissions.filter(s => s.isCorrect === true).length / submissions.filter(s => s.gradedAt).length) *
              100
            ).toFixed(2) + '%'
          : 'N/A'
    };

    // Group submissions by reading number
    const submissionsByReading = {};
    submissionsWithComparison.forEach(submission => {
      if (!submissionsByReading[submission.readingNumber]) {
        submissionsByReading[submission.readingNumber] = [];
      }
      submissionsByReading[submission.readingNumber].push(submission);
    });

    return NextResponse.json({
      success: true,
      data: {
        student: {
          id: student.id,
          studentNumber: student.studentId,
          name: student.user.name,
          email: student.user.email,
          cohort: student.cohort
        },
        submissions: submissionsWithComparison,
        submissionsByReading,
        stats
      }
    });
  } catch (error) {
    console.error('Error fetching student history:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch student history',
        details: error.message
      },
      { status: 500 }
    );
  }
}
