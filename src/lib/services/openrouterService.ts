/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * OpenRouter Service
 *
 * This service manages interactions with the OpenRouter API for LLM-based chat functionalities.
 * It handles message formatting, response parsing, model configuration, and error handling.
 */

import type {
  OpenRouterConfig,
  ModelParameters,
  ParsedResponse,
  ChatOverrides,
  Message,
  RequestPayload,
} from "./openrouter.types";

// ==========================================
// OpenRouter Service Class
// ==========================================

export class OpenRouterService {
  // Public fields
  public config: OpenRouterConfig;
  public lastResponse: ParsedResponse | null = null;

  // Private fields
  private _logger: Console;

  /**
   * Constructor - Initializes the OpenRouter service with configuration
   *
   * @param config - Service configuration object
   * @throws Error if required configuration is missing
   */
  constructor(config: OpenRouterConfig) {
    // Validate required configuration
    if (!config.apiEndpoint) {
      throw new Error("OpenRouter Service: apiEndpoint is required in configuration");
    }
    if (!config.apiKey) {
      throw new Error("OpenRouter Service: apiKey is required in configuration");
    }
    if (!config.defaultModelName) {
      throw new Error("OpenRouter Service: defaultModelName is required in configuration");
    }

    // Initialize configuration with defaults
    this.config = {
      apiEndpoint: config.apiEndpoint,
      apiKey: config.apiKey,
      defaultModelName: config.defaultModelName,
      defaultModelParams: config.defaultModelParams || {
        temperature: 0.7,
        max_tokens: 1000,
      },
      responseFormat: config.responseFormat,
    };

    // Initialize logger
    this._logger = console;
  }

  // ==========================================
  // 3. Private Method - Payload Preparation
  // ==========================================

  /**
   * Prepares the API request payload
   *
   * @param systemMessage - System prompt/instructions
   * @param userMessage - User input message
   * @param overrides - Optional configuration overrides
   * @returns Formatted payload for API request
   */
  private _preparePayload(systemMessage: string, userMessage: string, overrides?: ChatOverrides): RequestPayload {
    // Prepare messages array
    const messages: Message[] = [
      {
        role: "system",
        content: systemMessage,
      },
      {
        role: "user",
        content: userMessage,
      },
    ];

    // Determine model name
    const modelName = overrides?.modelName || this.config.defaultModelName;

    // Merge model parameters
    const modelParams = {
      ...this.config.defaultModelParams,
      ...overrides?.modelParams,
    };

    // Determine response format
    const responseFormat = overrides?.responseFormat || this.config.responseFormat;

    // Construct payload
    const payload: RequestPayload = {
      model: modelName,
      messages,
      ...modelParams,
    };

    // Add response format if specified
    if (responseFormat) {
      payload.response_format = responseFormat;
    }

    return payload;
  }

  // ==========================================
  // Public Methods
  // ==========================================

  /**
   * Sends a chat request to the OpenRouter API
   *
   * @param systemMessage - System prompt/instructions
   * @param userMessage - User input message
   * @param overrides - Optional configuration overrides
   * @returns Parsed API response
   * @throws Error if request fails
   */
  public async sendChat(
    systemMessage: string,
    userMessage: string,
    overrides?: ChatOverrides
  ): Promise<ParsedResponse> {
    // Validate input messages
    if (!systemMessage || systemMessage.trim().length === 0) {
      this._handleError(new Error("System message cannot be empty"));
    }
    if (!userMessage || userMessage.trim().length === 0) {
      this._handleError(new Error("User message cannot be empty"));
    }

    try {
      // Prepare the request payload
      const payload = this._preparePayload(systemMessage, userMessage, overrides);

      // Make API request with retry logic
      const rawResponse = await this._makeRequestWithRetry(payload);

      // Handle and parse the response
      const parsedResponse = this._handleResponse(rawResponse);

      // Store the last response
      this.lastResponse = parsedResponse;

      return parsedResponse;
    } catch (error) {
      this._handleError(error);
    }
  }

  /**
   * Updates the service configuration
   *
   * @param newConfig - Partial configuration to update
   */
  public updateConfig(newConfig: Partial<OpenRouterConfig>): void {
    // Validate critical fields if they are being updated
    if (newConfig.apiEndpoint !== undefined && !newConfig.apiEndpoint) {
      throw new Error("OpenRouter Service: apiEndpoint cannot be empty");
    }
    if (newConfig.apiKey !== undefined && !newConfig.apiKey) {
      throw new Error("OpenRouter Service: apiKey cannot be empty");
    }
    if (newConfig.defaultModelName !== undefined && !newConfig.defaultModelName) {
      throw new Error("OpenRouter Service: defaultModelName cannot be empty");
    }

    // Merge new configuration
    this.config = {
      ...this.config,
      ...newConfig,
      // Deep merge model parameters
      defaultModelParams: {
        ...this.config.defaultModelParams,
        ...newConfig.defaultModelParams,
      },
    };
  }

  /**
   * Updates model parameters for subsequent requests
   *
   * @param params - New model parameters
   */
  public setModelParameters(params: ModelParameters): void {
    this.config.defaultModelParams = {
      ...this.config.defaultModelParams,
      ...params,
    };
  }

  // ==========================================
  // Private Methods
  // ==========================================

  /**
   * Makes an HTTP request to the OpenRouter API with retry logic
   *
   * @param payload - Request payload
   * @param attempt - Current attempt number (for retry logic)
   * @returns Raw API response
   * @throws Error if all retry attempts fail
   */
  private async _makeRequestWithRetry(payload: RequestPayload, attempt = 1): Promise<any> {
    const maxRetries = 3;
    const baseDelay = 1000; // 1 second

    try {
      // Make the HTTP request
      const response = await fetch(this.config.apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.config.apiKey}`,
          "HTTP-Referer": typeof window !== "undefined" ? window.location.origin : "https://10xcards.com",
          "X-Title": "10xCards",
        },
        body: JSON.stringify(payload),
      });

      // Handle HTTP errors
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage =
          errorData.error?.message || errorData.message || `HTTP ${response.status}: ${response.statusText}`;

        // Handle specific status codes
        if (response.status === 401) {
          throw new Error(`Authentication failed: Invalid API key`);
        }
        if (response.status === 403) {
          throw new Error(`Access forbidden: ${errorMessage}`);
        }
        if (response.status === 429) {
          // Rate limit - throw error to trigger retry
          throw new Error(`Rate limit exceeded: ${errorMessage}`);
        }
        if (response.status >= 500) {
          // Server error - throw error to trigger retry
          throw new Error(`OpenRouter server error: ${errorMessage}`);
        }

        // Client error (4xx) - don't retry
        throw new Error(`OpenRouter API error: ${errorMessage}`);
      }

      // Parse and return the response
      const data = await response.json();
      return data;
    } catch (error) {
      // Determine if we should retry
      const shouldRetry = attempt < maxRetries && this._isRetryableError(error);

      if (shouldRetry) {
        // Calculate exponential backoff delay
        const delay = baseDelay * Math.pow(2, attempt - 1);

        this._logger.warn(
          `OpenRouter API request failed (attempt ${attempt}/${maxRetries}). Retrying in ${delay}ms...`,
          error
        );

        // Wait before retrying
        await new Promise((resolve) => setTimeout(resolve, delay));

        // Retry the request
        return this._makeRequestWithRetry(payload, attempt + 1);
      }

      // No more retries, throw the error
      throw error;
    }
  }

  /**
   * Determines if an error is retryable
   *
   * @param error - Error to check
   * @returns True if the error is retryable
   */
  private _isRetryableError(error: any): boolean {
    const errorMessage = error?.message?.toLowerCase() || "";

    // Retry on network errors
    if (errorMessage.includes("network") || errorMessage.includes("fetch")) {
      return true;
    }

    // Retry on rate limits
    if (errorMessage.includes("rate limit")) {
      return true;
    }

    // Retry on server errors
    if (
      errorMessage.includes("server error") ||
      errorMessage.includes("500") ||
      errorMessage.includes("502") ||
      errorMessage.includes("503")
    ) {
      return true;
    }

    // Retry on timeout
    if (errorMessage.includes("timeout")) {
      return true;
    }

    return false;
  }

  /**
   * Handles and validates API response
   *
   * @param rawResponse - Raw response from API
   * @returns Parsed and validated response
   * @throws Error if response is invalid
   */
  private _handleResponse(rawResponse: any): ParsedResponse {
    // Validate response structure
    if (!rawResponse) {
      throw new Error("OpenRouter API returned an empty response");
    }

    // Check for error in response
    if (rawResponse.error) {
      throw new Error(`OpenRouter API error: ${rawResponse.error.message || JSON.stringify(rawResponse.error)}`);
    }

    // Validate choices array
    if (!rawResponse.choices || !Array.isArray(rawResponse.choices) || rawResponse.choices.length === 0) {
      throw new Error("OpenRouter API response missing valid choices array");
    }

    // Extract the first choice
    const firstChoice = rawResponse.choices[0];

    if (!firstChoice.message) {
      throw new Error("OpenRouter API response missing message in choice");
    }

    // Extract content
    const content = firstChoice.message.content;

    // If content is empty, try to parse from other fields
    if (!content || content.trim().length === 0) {
      throw new Error("OpenRouter API returned empty content");
    }

    // Parse usage statistics
    const usage = rawResponse.usage
      ? {
          prompt_tokens: rawResponse.usage.prompt_tokens,
          completion_tokens: rawResponse.usage.completion_tokens,
          total_tokens: rawResponse.usage.total_tokens,
        }
      : undefined;

    // Construct parsed response
    const parsedResponse: ParsedResponse = {
      content,
      usage,
      model: rawResponse.model,
    };

    // Log response details
    this._logger.log("OpenRouter API response received:", {
      model: parsedResponse.model,
      contentLength: content.length,
      usage: parsedResponse.usage,
    });

    return parsedResponse;
  }

  /**
   * Centralized error handling
   *
   * @param error - Error object to handle
   * @throws User-friendly error message
   */
  private _handleError(error: any): never {
    // Extract error message
    let errorMessage = "An unexpected error occurred while communicating with OpenRouter API";

    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === "string") {
      errorMessage = error;
    } else if (error?.message) {
      errorMessage = error.message;
    }

    // Log detailed error for debugging (server-side only)
    this._logger.error("OpenRouter Service Error:", {
      message: errorMessage,
      error:
        error instanceof Error
          ? {
              name: error.name,
              message: error.message,
              stack: error.stack,
            }
          : error,
      timestamp: new Date().toISOString(),
    });

    // Throw user-friendly error
    throw new Error(`OpenRouter Service: ${errorMessage}`);
  }
}

// ==========================================
// Factory Function
// ==========================================

/**
 * Creates an OpenRouter service instance with environment variables
 *
 * @param runtimeApiKey - Optional API key from runtime context (Cloudflare Workers)
 * @returns Configured OpenRouter service instance
 * @throws Error if required environment variables are missing
 */
export function createOpenRouterService(runtimeApiKey?: string): OpenRouterService {
  const apiEndpoint = import.meta.env.OPENROUTER_API_ENDPOINT || "https://openrouter.ai/api/v1/chat/completions";
  
  // Try runtime parameter first, then fall back to import.meta.env (local dev)
  const apiKey = runtimeApiKey || import.meta.env.OPENROUTER_API_KEY;
  const defaultModelName = import.meta.env.OPENROUTER_DEFAULT_MODEL || "openai/gpt-4o-mini";

  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY environment variable is required");
  }

  return new OpenRouterService({
    apiEndpoint,
    apiKey,
    defaultModelName,
  });
}
