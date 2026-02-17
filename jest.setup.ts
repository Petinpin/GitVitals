import '@testing-library/jest-dom'

// Mock fetch for test environment
global.fetch = jest.fn((url: string | URL | Request, init?: RequestInit) => {
  const urlString = typeof url === 'string' ? url : url.toString()
  
  // Mock successful login response
  if (urlString.includes('/api/auth/login')) {
    return Promise.resolve({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        user: {
          session: { access_token: 'mock-token' },
          role: 'student'
        }
      }),
      headers: new Headers(),
      redirected: false,
      statusText: 'OK',
      type: 'basic',
      url: urlString,
    } as Response)
  }

  // Default mock response
  return Promise.resolve({
    ok: true,
    status: 200,
    json: async () => ({ success: true }),
    headers: new Headers(),
    redirected: false,
    statusText: 'OK',
    type: 'basic',
    url: urlString,
  } as Response)
}) as jest.Mock

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn((key: string) => null),
  setItem: jest.fn((key: string, value: string) => {}),
  removeItem: jest.fn((key: string) => {}),
  clear: jest.fn(() => {}),
  length: 0,
  key: jest.fn((index: number) => null),
}

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
})
