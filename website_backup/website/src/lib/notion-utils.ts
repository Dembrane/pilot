import { Client as NotionClient } from '@notionhq/client';
import { NotionAPI } from 'notion-client';
import * as backoff from 'backoff';

interface RetryConfig {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  { maxRetries = 3, initialDelay = 1000, maxDelay = 5000 }: RetryConfig = {}
): Promise<T> {
  return new Promise((resolve, reject) => {
    const exponentialBackoff = backoff.exponential({
      initialDelay,
      maxDelay,
      factor: 2,
    });

    exponentialBackoff.failAfter(maxRetries);

    exponentialBackoff.on('ready', async (number, delay) => {
      try {
        const result = await fn();
        exponentialBackoff.reset();
        resolve(result);
      } catch (error: any) {
        // Only retry on 502 Bad Gateway errors
        if (error.status !== 502) {
          exponentialBackoff.reset();
          reject(error);
          return;
        }

        console.warn(
          `Notion API request failed (attempt ${number + 1}/${maxRetries}), retrying in ${delay}ms...`,
          error.message
        );
        exponentialBackoff.backoff();
      }
    });

    exponentialBackoff.on('fail', () => {
      console.error('All retry attempts failed for Notion API request');
      reject(new Error('Max retries reached'));
    });

    exponentialBackoff.backoff();
  });
} 