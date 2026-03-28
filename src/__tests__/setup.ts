// Test setup file
// This file is run before all tests

// Mock console methods globally if needed
global.console = {
  ...console,
  // Uncomment to suppress console output during tests
  // log: jest.fn(),
  // error: jest.fn(),
  // warn: jest.fn(),
  // info: jest.fn(),
};

// Set test timeout
jest.setTimeout(10000);

// Mock process.exit to prevent tests from actually exiting
const mockExit = jest.spyOn(process, 'exit').mockImplementation((code?: string | number | null) => {
  throw new Error(`process.exit(${code}) called`);
});

// Clean up after all tests
afterAll(() => {
  mockExit.mockRestore();
});