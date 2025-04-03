
import aiService from '../utils/ai';

declare global {
  interface Window {
    aiService: typeof aiService;
  }
}

export {};
