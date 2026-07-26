import { Injectable, Logger } from '@nestjs/common';

export interface ExpoPushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

export interface ExpoPushTicket {
  status: 'ok' | 'error';
  id?: string;
  message?: string;
  details?: { error?: string };
}

interface ExpoPushResponse {
  data: ExpoPushTicket[];
}

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const PUSH_TIMEOUT_MS = 10_000;

@Injectable()
export class ExpoPushService {
  private readonly logger = new Logger(ExpoPushService.name);

  async send(messages: ExpoPushMessage[]): Promise<ExpoPushTicket[]> {
    if (messages.length === 0) return [];

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), PUSH_TIMEOUT_MS);

    try {
      const response = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(messages),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Expo push API responded ${response.status}`);
      }

      const result = (await response.json()) as ExpoPushResponse;
      return result.data;
    } catch (err) {
      this.logger.error('Expo push API call failed', err instanceof Error ? err.message : err);
      // Return error tickets so callers can count failures without crashing
      return messages.map(() => ({
        status: 'error' as const,
        message: err instanceof Error ? err.message : 'Network error',
      }));
    } finally {
      clearTimeout(timer);
    }
  }
}
