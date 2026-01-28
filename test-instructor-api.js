/**
 * Node.js Test Script for Instructor API Endpoints
 * Run with: node test-instructor-api.js
 */

const baseUrl = 'http://localhost:3000';
const apiBase = `${baseUrl}/api/instructor`;

// Helper function to make API calls
async function testEndpoint(name, url) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Testing: ${name}`);
  console.log(`URL: ${url}`);
  console.log('='.repeat(60));
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    console.log(`Status: ${response.status}`);
    console.log(`Success: ${data.success}`);
    
    if (data.success) {
      if (data.data) {
        console.log(`Records returned: ${Array.isArray(data.data) ? data.data.length : 1}`);
        if (Array.isArray(data.data) && data.data.length > 0) {
          console.log('First record sample:', JSON.stringify(data.data[0], null, 2));
        } else if (!Array.isArray(data.data)) {
          console.log('Data:', JSON.stringify(data.data, null, 2));
        }
      }
      if (data.pagination) {
        console.log('Pagination:', data.pagination);
      }
    } else {
      console.log('Error:', data.error);
      if (data.details) console.log('Details:', data.details);
    }
  } catch (error) {
    console.error('Request failed:', error.message);
  }
}

// Main test runner
async function runTests() {
  console.log('GitVitals - Instructor API Test Suite');
  console.log('Make sure your Next.js dev server is running on port 3000\n');

  // Test 1: Get all submissions
  await testEndpoint(
    'Get All Submissions',
    `${apiBase}/submissions`
  );

  // Test 2: Get submissions by reading number
  await testEndpoint(
    'Get Submissions for Reading #1',
    `${apiBase}/submissions?readingNumber=1`
  );

  // Test 3: Get ungraded submissions
  await testEndpoint(
    'Get Ungraded Submissions',
    `${apiBase}/submissions?graded=false`
  );

  // Test 4: Get submissions with pagination
  await testEndpoint(
    'Get Submissions (Paginated - 10 per page)',
    `${apiBase}/submissions?limit=10&offset=0`
  );

  // Test 5: Get roster for assignment
  await testEndpoint(
    'Get Roster for Reading #1',
    `${apiBase}/roster?readingNumber=1`
  );

  // Test 6: Get roster by cohort
  await testEndpoint(
    'Get Roster for Reading #1 - Fall2025 Cohort',
    `${apiBase}/roster?readingNumber=1&cohort=Fall2025`
  );

  console.log('\n' + '='.repeat(60));
  console.log('Test suite completed!');
  console.log('='.repeat(60));
}

// Run the tests
runTests().catch(console.error);
