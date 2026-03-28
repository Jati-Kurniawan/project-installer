/**
 * Logger utility for consistent output formatting
 */
export class Logger {
  /**
   * Logs an info message
   */
  static info(message: string): void {
    console.log(`ℹ️  ${message}`);
  }

  /**
   * Logs a success message
   */
  static success(message: string): void {
    console.log(`✅ ${message}`);
  }

  /**
   * Logs a warning message
   */
  static warn(message: string): void {
    console.log(`⚠️  ${message}`);
  }

  /**
   * Logs an error message
   */
  static error(message: string): void {
    console.error(`❌ ${message}`);
  }

  /**
   * Logs a step in the process
   */
  static step(step: number, total: number, message: string): void {
    console.log(`[${step}/${total}] ${message}`);
  }

  /**
   * Logs a progress message
   */
  static progress(message: string): void {
    console.log(`🔄 ${message}`);
  }

  /**
   * Logs a completion message
   */
  static complete(message: string): void {
    console.log(`🎉 ${message}`);
  }
}