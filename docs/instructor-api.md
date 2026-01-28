# Instructor API Endpoints

API endpoints for teachers to review, grade, and manage student vital submissions.

## Endpoints Overview

### 1. GET /api/instructor/submissions
Get all submissions with filtering and auto-comparison to correct answers.

**Query Parameters:**
- `cohort` (optional): Filter by student cohort
- `graded` (optional): Filter by grading status (true/false)
- `startDate` (optional): Filter from date (ISO 8601)
- `endDate` (optional): Filter until date (ISO 8601)
- `readingNumber` (optional): Filter by assignment number (1-50)
- `limit` (optional): Results per page (default: 50)
- `offset` (optional): Pagination offset (default: 0)

**Example:**
```bash
GET /api/instructor/submissions?graded=false&cohort=Fall2026&limit=20
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "studentId": "uuid",
      "readingNumber": 5,
      "checkDate": "2026-01-20T00:00:00.000Z",
      "checkTime": "14:30",
      "bloodPressureSystolic": 120,
      "bloodPressureDiastolic": 80,
      "heartRate": 72,
      "temperature": "98.6",
      "respiratoryRate": 16,
      "oxygenSaturation": 98,
      "student": {
        "user": {
          "name": "John Doe",
          "email": "john@example.com"
        }
      },
      "patient": {
        "name": "Jane Smith",
        "relationship": "CLASSMATE"
      },
      "hasAnswerKey": true,
      "comparison": {
        "bloodPressureSystolic": {
          "submitted": 120,
          "correct": 118,
          "isCorrect": false,
          "difference": 2
        },
        "allCorrect": false
      }
    }
  ],
  "pagination": {
    "total": 45,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  }
}
```

---

### 2. GET /api/instructor/submissions/[id]
Get detailed submission with comparison to answer key.

**Example:**
```bash
GET /api/instructor/submissions/abc-123-def
```

**Response:**
```json
{
  "success": true,
  "data": {
    "submission": {
      "id": "abc-123-def",
      "readingNumber": 5,
      "checkDate": "2026-01-20",
      "checkTime": "14:30",
      "bloodPressureSystolic": 120,
      "bloodPressureDiastolic": 80,
      "heartRate": 72,
      "temperature": "98.6",
      "respiratoryRate": 16,
      "oxygenSaturation": 98,
      "studentInitials": "JD",
      "otherNotes": "Patient was calm and seated",
      "submittedAt": "2026-01-20T14:35:00.000Z",
      "gradedAt": null,
      "isCorrect": null,
      "instructorFeedback": null
    },
    "correctVitals": {
      "bloodPressureSystolic": 118,
      "bloodPressureDiastolic": 78,
      "heartRate": 70,
      "temperature": "98.4",
      "respiratoryRate": 16,
      "oxygenSaturation": 98
    },
    "comparison": {
      "bloodPressureSystolic": {
        "submitted": 120,
        "correct": 118,
        "isCorrect": false,
        "difference": 2,
        "percentDiff": "1.69"
      },
      "summary": {
        "totalFields": 6,
        "correctFields": 3,
        "incorrectFields": 3,
        "accuracyPercentage": "50.00",
        "allCorrect": false
      }
    },
    "hasAnswerKey": true
  }
}
```

---

### 3. PATCH /api/instructor/submissions/[id]
Grade a submission and add feedback.

**Request Body:**
```json
{
  "isCorrect": true,
  "instructorFeedback": "Good job! Blood pressure was slightly high but within acceptable range."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Submission graded successfully",
  "data": {
    "id": "abc-123-def",
    "isCorrect": true,
    "instructorFeedback": "Good job! Blood pressure was slightly high but within acceptable range.",
    "gradedAt": "2026-01-24T10:30:00.000Z"
  }
}
```

---

### 4. GET /api/instructor/roster
Get roster showing who submitted vs. who didn't for an assignment.

**Query Parameters:**
- `readingNumber` (required): Assignment number (1-50)
- `cohort` (optional): Filter by cohort
- `patientId` (optional): Filter by specific patient

**Example:**
```bash
GET /api/instructor/roster?readingNumber=5&cohort=Fall2026
```

**Response:**
```json
{
  "success": true,
  "data": {
    "readingNumber": 5,
    "cohort": "Fall2026",
    "roster": [
      {
        "studentId": "uuid",
        "studentNumber": "12345",
        "name": "John Doe",
        "email": "john@example.com",
        "cohort": "Fall2026",
        "hasSubmitted": true,
        "submissionCount": 2,
        "latestSubmission": {
          "id": "uuid",
          "submittedAt": "2026-01-20T14:35:00.000Z",
          "gradedAt": "2026-01-21T09:00:00.000Z",
          "isCorrect": true,
          "patientName": "Jane Smith"
        }
      }
    ],
    "stats": {
      "totalStudents": 25,
      "submitted": 22,
      "notSubmitted": 3,
      "graded": 18,
      "ungraded": 4,
      "submissionRate": "88.00%"
    },
    "studentsWhoSubmitted": [...],
    "studentsWhoDidNotSubmit": [...]
  }
}
```

---

### 5. GET /api/instructor/students/[id]/history
Get all submissions for a specific student.

**Query Parameters:**
- `includeGraded` (optional): Include graded (default: true)
- `includeUngraded` (optional): Include ungraded (default: true)
- `startDate` (optional): Filter from date
- `endDate` (optional): Filter until date
- `readingNumber` (optional): Filter by assignment

**Example:**
```bash
GET /api/instructor/students/student-uuid-123/history?includeGraded=true
```

**Response:**
```json
{
  "success": true,
  "data": {
    "student": {
      "id": "uuid",
      "studentNumber": "12345",
      "name": "John Doe",
      "email": "john@example.com",
      "cohort": "Fall2026"
    },
    "submissions": [...],
    "submissionsByReading": {
      "1": [...],
      "2": [...],
      "5": [...]
    },
    "stats": {
      "totalSubmissions": 12,
      "gradedSubmissions": 10,
      "ungradedSubmissions": 2,
      "correctSubmissions": 8,
      "incorrectSubmissions": 2,
      "uniqueReadingNumbers": [1, 2, 3, 5, 7, 8],
      "completionPercentage": "24.00%",
      "accuracyRate": "80.00%"
    }
  }
}
```

---

## Auto-Comparison Logic

Each submission is automatically compared against the correct answer key (CorrectVitals) if it exists. The comparison includes:

- **isCorrect**: Boolean indicating exact match
- **difference**: Numeric difference (submitted - correct)
- **percentDiff**: Percentage difference

Comparison is performed for all vital signs:
- Blood Pressure (systolic and diastolic)
- Heart Rate (pulse)
- Temperature
- Respiratory Rate
- Oxygen Saturation

---

## Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message",
  "details": "Detailed error information"
}
```

Common HTTP status codes:
- `400`: Bad request (missing/invalid parameters)
- `404`: Resource not found
- `500`: Internal server error
