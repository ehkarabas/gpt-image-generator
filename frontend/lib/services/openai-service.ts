import OpenAI from 'openai';

// OpenAI Service for Chat and Image Generation
export class OpenAIService {
  private client: OpenAI;

  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }

    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  /**
   * Generate chat response using GPT models
   */
  async generateChatResponse(
    messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
    options?: {
      model?: string;
      maxTokens?: number;
      temperature?: number;
    }
  ): Promise<string> {
    try {
      const response = await this.client.chat.completions.create({
        model: options?.model || 'gpt-4o-mini',
        messages,
        max_tokens: options?.maxTokens || 1000,
        temperature: options?.temperature || 0.7,
      });

      return response.choices[0]?.message?.content || 'No response generated';
    } catch (error) {
      console.error('OpenAI Chat API error:', error);
      
      if (error instanceof OpenAI.APIError) {
        throw new Error(`OpenAI API Error: ${error.message}`);
      }
      
      throw new Error('Failed to generate chat response');
    }
  }

  /**
   * Generate image using DALL-E models
   */
  async generateImage(
    prompt: string,
    options?: {
      model?: 'dall-e-2' | 'dall-e-3';
      size?: '256x256' | '512x512' | '1024x1024' | '1024x1792' | '1792x1024';
      quality?: 'standard' | 'hd';
      style?: 'vivid' | 'natural';
      n?: number;
    }
  ): Promise<string> {
    try {
      // Validate prompt
      if (!prompt?.trim()) {
        throw new Error('Image prompt is required');
      }

      // Model-specific validations
      const model = options?.model || 'dall-e-3';
      const size = options?.size || '1024x1024';
      const quality = options?.quality || 'standard';
      const n = options?.n || 1;

      // DALL-E 3 restrictions
      if (model === 'dall-e-3' && n > 1) {
        throw new Error('DALL-E 3 only supports generating 1 image at a time');
      }

      // Size restrictions for DALL-E 2
      if (model === 'dall-e-2') {
        const validDalle2Sizes = ['256x256', '512x512', '1024x1024'];
        if (!validDalle2Sizes.includes(size)) {
          throw new Error(`DALL-E 2 only supports sizes: ${validDalle2Sizes.join(', ')}`);
        }
      }

      const response = await this.client.images.generate({
        model,
        prompt: prompt.trim(),
        size,
        quality: model === 'dall-e-3' ? quality : undefined,
        style: model === 'dall-e-3' ? options?.style : undefined,
        n,
        response_format: 'url', // Use URL format for easier handling
      });

      return response.data[0]?.url || '';
    } catch (error) {
      console.error('OpenAI Image API error:', error);
      
      if (error instanceof OpenAI.APIError) {
        // Handle specific OpenAI errors
        if (error.status === 400 && error.message.includes('content policy')) {
          throw new Error('Image prompt violates content policy. Please try a different prompt.');
        }
        throw new Error(`OpenAI API Error: ${error.message}`);
      }
      
      throw new Error('Failed to generate image');
    }
  }

  /**
   * Check if a message is likely an image generation request
   * MVP: All messages are treated as image generation requests
   */
  static isImageGenerationRequest(content: string): boolean {
    // MVP Mode: Everything is image generation unless explicitly asking for text
    const textOnlyKeywords = [
      'explain',
      'tell me about',
      'what is',
      'how to',
      'help me understand',
      'describe',
      'summarize',
      'analyze',
      'compare',
      'list',
      'calculate',
      'translate'
    ];

    const lowerContent = content.toLowerCase();
    const isTextOnly = textOnlyKeywords.some(keyword => lowerContent.includes(keyword));
    
    // Return true (image generation) unless explicitly text-only request
    return !isTextOnly;
  }

  /**
   * Extract image prompt from user message
   * MVP: Use the entire content as image prompt
   */
  static extractImagePrompt(content: string): string {
    // For MVP, use the entire user input as the image prompt
    // This ensures any descriptive text becomes an image generation request
    return content.trim();
  }

  /**
   * Rate limiting check (basic implementation)
   */
  private static lastRequest = 0;
  private static readonly MIN_INTERVAL = 1000; // 1 second between requests

  static async checkRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - OpenAIService.lastRequest;
    
    if (timeSinceLastRequest < OpenAIService.MIN_INTERVAL) {
      const waitTime = OpenAIService.MIN_INTERVAL - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    OpenAIService.lastRequest = Date.now();
  }
}

// Error types for better error handling
export class OpenAIServiceError extends Error {
  constructor(
    message: string,
    public readonly type: 'rate_limit' | 'content_policy' | 'api_error' | 'validation' | 'unknown'
  ) {
    super(message);
    this.name = 'OpenAIServiceError';
  }
}