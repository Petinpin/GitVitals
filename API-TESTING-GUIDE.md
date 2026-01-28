# GitVitals API Testing Guide

## Test the Instructor API Endpoints

### 1. Using Your Browser (Easiest)
Simply open these URLs in your browser:

- **All Submissions**: http://localhost:3000/api/instructor/submissions
- **Submissions for Reading #1**: http://localhost:3000/api/instructor/submissions?readingNumber=1
- **Ungraded Submissions**: http://localhost:3000/api/instructor/submissions?graded=false
- **Roster for Reading #1**: http://localhost:3000/api/instructor/roster?readingNumber=1

### 2. Using PowerShell

```powershell
# Get all submissions
$result = Invoke-RestMethod -Uri "http://localhost:3000/api/instructor/submissions"
$result | ConvertTo-Json -Depth 5

# Get submissions for reading #1
$result = Invoke-RestMethod -Uri "http://localhost:3000/api/instructor/submissions?readingNumber=1"
$result | ConvertTo-Json -Depth 5

# Get ungraded submissions
$result = Invoke-RestMethod -Uri "http://localhost:3000/api/instructor/submissions?graded=false"
$result | ConvertTo-Json -Depth 5

# Get roster for reading #1
$result = Invoke-RestMethod -Uri "http://localhost:3000/api/instructor/roster?readingNumber=1"
$result | ConvertTo-Json -Depth 5
```

### 3. Using the Node.js Test Script

```powershell
node test-instructor-api.js
```

### 4. Using REST Client Extension (VS Code)
1. Install "REST Client" extension
2. Open `test-instructor-api.http`
3. Click "Send Request" above any test

## Available Endpoints

### GET /api/instructor/submissions
Get all vital reading submissions with auto-comparison to answer keys

**Query Parameters:**
- `readingNumber` - Filter by assignment number (1-50)
- `cohort` - Filter by student cohort
- `graded` - Filter by grading status (true/false)
- `startDate` - Filter from this date (YYYY-MM-DD)
- `endDate` - Filter to this date (YYYY-MM-DD)
- `limit` - Results per page (default: 50)
- `offset` - Pagination offset (default: 0)

### GET /api/instructor/roster
Get roster showing which students submitted vs who didn't

**Query Parameters:**
- `readingNumber` - **Required** - Which assignment (1-50)
- `cohort` - Filter by student cohort
- `patientId` - Filter by specific patient

### GET /api/instructor/students/{id}/history
Get a specific student's submission history

### GET /api/instructor/submissions/{id}
Get a specific submission by ID

## Expected Response Format

```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "total": 0,
    "limit": 50,
    "offset": 0,
    "hasMore": false
  }
}
```

## Note
Make sure your database has data (students, patients, submissions) to see meaningful results. If you get empty arrays, that means the database is empty, not that the API is broken.
