/**
 * API Client for connecting to a remote Lynx server
 */

import { ScanRequest, ScanResponse } from '../../server/types.js';

interface HealthResponse {
  status: string;
  version?: string;
  uptime?: number;
}

export class ApiClient {
  private baseUrl: string;
  private timeout: number;

  constructor(baseUrl: string, timeout: number = 60000) {
    // Normalize URL - remove trailing slash
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.timeout = timeout;
  }

  /**
   * Check server health
   */
  async health(): Promise<HealthResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw new Error(`Health check timed out after ${this.timeout / 1000}s`);
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Start a scan and poll for results
   */
  async scan(request: ScanRequest): Promise<ScanResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      // Start the scan
      const startResponse = await fetch(`${this.baseUrl}/api/scan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
        signal: controller.signal,
      });

      if (!startResponse.ok) {
        const error = await startResponse.text();
        throw new Error(`Scan request failed: ${startResponse.status} - ${error}`);
      }

      const { id } = await startResponse.json();

      // Poll for results
      let result: ScanResponse;
      let attempts = 0;
      const maxAttempts = Math.floor(this.timeout / 1000); // Poll every second

      while (attempts < maxAttempts) {
        const statusResponse = await fetch(`${this.baseUrl}/api/scan/${id}`, {
          method: 'GET',
          signal: controller.signal,
        });

        if (!statusResponse.ok) {
          throw new Error(`Failed to get scan status: ${statusResponse.status}`);
        }

        result = await statusResponse.json();

        if (result.status === 'completed') {
          return result;
        }

        if (result.status === 'error') {
          throw new Error('Scan failed on server');
        }

        // Wait 1 second before polling again
        await new Promise(resolve => setTimeout(resolve, 1000));
        attempts++;
      }

      throw new Error(`Scan timed out after ${this.timeout / 1000}s`);

    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw new Error(`Scan timed out after ${this.timeout / 1000}s`);
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Export scan results
   */
  async export(scanId: string, format: 'json' | 'markdown' = 'json'): Promise<string> {
    const response = await fetch(`${this.baseUrl}/api/scan/${scanId}/export?format=${format}`);

    if (!response.ok) {
      throw new Error(`Export failed: ${response.status}`);
    }

    return await response.text();
  }
}
