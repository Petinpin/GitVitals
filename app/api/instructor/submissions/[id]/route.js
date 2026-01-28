import { NextResponse } from 'next/server';
import prisma from '../../../../../lib/prisma.js';

/**
 * GET /api/instructor/submissions/[id]
 * Get a specific submission with detailed comparison to correct answer key
 */
export async function GET(request, { params }) {
  try {
    const { id } = params;

    // Fetch the submission with all related data
    const submission = await prisma.vitalReading.findUnique({
      where: { id },
      include: {
        student: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        patient: true
      }
    });

    if (!submission) {
      return NextResponse.json(
        { success: false, error: 'Submission not found' },
        { status: 404 }
      );
    }

    // Fetch the correct answer key
    const correctVitals = await prisma.correctVitals.findUnique({
      where: {
        patientId_readingNumber: {
          patientId: submission.patientId,
          readingNumber: submission.readingNumber
        }
      },
      include: {
        createdBy: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    // Calculate detailed comparison
    let comparison = null;
    if (correctVitals) {
      comparison = {
        bloodPressureSystolic: {
          submitted: submission.bloodPressureSystolic,
          correct: correctVitals.bloodPressureSystolic,
          isCorrect: submission.bloodPressureSystolic === correctVitals.bloodPressureSystolic,
          difference: submission.bloodPressureSystolic - correctVitals.bloodPressureSystolic,
          percentDiff: ((submission.bloodPressureSystolic - correctVitals.bloodPressureSystolic) / correctVitals.bloodPressureSystolic * 100).toFixed(2)
        },
        bloodPressureDiastolic: {
          submitted: submission.bloodPressureDiastolic,
          correct: correctVitals.bloodPressureDiastolic,
          isCorrect: submission.bloodPressureDiastolic === correctVitals.bloodPressureDiastolic,
          difference: submission.bloodPressureDiastolic - correctVitals.bloodPressureDiastolic,
          percentDiff: ((submission.bloodPressureDiastolic - correctVitals.bloodPressureDiastolic) / correctVitals.bloodPressureDiastolic * 100).toFixed(2)
        },
        heartRate: {
          submitted: submission.heartRate,
          correct: correctVitals.heartRate,
          isCorrect: submission.heartRate === correctVitals.heartRate,
          difference: submission.heartRate - correctVitals.heartRate,
          percentDiff: ((submission.heartRate - correctVitals.heartRate) / correctVitals.heartRate * 100).toFixed(2)
        },
        temperature: {
          submitted: parseFloat(submission.temperature),
          correct: parseFloat(correctVitals.temperature),
          isCorrect: parseFloat(submission.temperature) === parseFloat(correctVitals.temperature),
          difference: (parseFloat(submission.temperature) - parseFloat(correctVitals.temperature)).toFixed(1),
          percentDiff: (((parseFloat(submission.temperature) - parseFloat(correctVitals.temperature)) / parseFloat(correctVitals.temperature)) * 100).toFixed(2)
        },
        respiratoryRate: {
          submitted: submission.respiratoryRate,
          correct: correctVitals.respiratoryRate,
          isCorrect: submission.respiratoryRate === correctVitals.respiratoryRate,
          difference: submission.respiratoryRate - correctVitals.respiratoryRate,
          percentDiff: ((submission.respiratoryRate - correctVitals.respiratoryRate) / correctVitals.respiratoryRate * 100).toFixed(2)
        },
        oxygenSaturation: {
          submitted: submission.oxygenSaturation,
          correct: correctVitals.oxygenSaturation,
          isCorrect: submission.oxygenSaturation === correctVitals.oxygenSaturation,
          difference: submission.oxygenSaturation - correctVitals.oxygenSaturation,
          percentDiff: ((submission.oxygenSaturation - correctVitals.oxygenSaturation) / correctVitals.oxygenSaturation * 100).toFixed(2)
        }
      };

      // Calculate overall statistics
      const correctCount = Object.values(comparison).filter(
        field => typeof field === 'object' && field.isCorrect
      ).length;
      
      comparison.summary = {
        totalFields: 6,
        correctFields: correctCount,
        incorrectFields: 6 - correctCount,
        accuracyPercentage: ((correctCount / 6) * 100).toFixed(2),
        allCorrect: correctCount === 6
      };
    }

    return NextResponse.json({
      success: true,
      data: {
        submission,
        correctVitals,
        comparison,
        hasAnswerKey: !!correctVitals
      }
    });

  } catch (error) {
    console.error('Error fetching submission:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch submission',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/instructor/submissions/[id]
 * Grade a submission and add instructor feedback
 * 
 * Request Body:
 * {
 *   isCorrect: boolean,  // Overall grading result
 *   instructorFeedback: string  // Teacher's written feedback
 * }
 */
export async function PATCH(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();
    const { isCorrect, instructorFeedback } = body;

    // Validate input
    if (typeof isCorrect !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'isCorrect must be a boolean' },
        { status: 400 }
      );
    }

    // Update the submission with grading
    const updatedSubmission = await prisma.vitalReading.update({
      where: { id },
      data: {
        isCorrect,
        instructorFeedback: instructorFeedback || null,
        gradedAt: new Date()
      },
      include: {
        student: {
          include: {
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        },
        patient: {
          select: {
            name: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Submission graded successfully',
      data: updatedSubmission
    });

  } catch (error) {
    console.error('Error grading submission:', error);
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { success: false, error: 'Submission not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to grade submission',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
