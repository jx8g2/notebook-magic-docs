
import AIService from './index';

declare global {
  interface Window {
    aiService: typeof AIService;
  }
}
