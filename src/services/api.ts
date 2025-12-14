const API_BASE_URL = "https://dataglass-backend.onrender.com";

export interface StatsRequest {
  data: unknown[];
  isNumeric: { [key: string]: boolean };
}

export interface StatsResponse {
  success: boolean;
  stats?: { [key: string]: unknown };
  error?: string;
}

export interface ChartRecommendationsRequest {
  data: unknown[];
  isNumeric: { [key: string]: boolean };
}

export interface ChartRecommendationsResponse {
  success: boolean;
  recommendations?: unknown[];
  error?: string;
}

export class ApiService {
  /* Get statistics for each column */
  static async getStats(
    data: unknown[],
    isNumeric: { [key: string]: boolean }
  ): Promise<StatsResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/stats`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ data, isNumeric }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Stats calculation failed",
      };
    }
  }

  /**
   * Get chart recommendations
   */
  static async getChartRecommendations(
    data: unknown[],
    isNumeric: { [key: string]: boolean }
  ): Promise<ChartRecommendationsResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/chart-recommendations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ data, isNumeric }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Chart recommendations failed",
      };
    }
  }

  /**
   * Get AI-powered chart recommendations using OpenAI
   */
  static async getChartRecommendationsAI(
    prompt: string,
    headers: string[]
  ): Promise<ChartRecommendationsResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/chart-recommendations-ai`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt, headers }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "AI chart recommendations failed",
      };
    }
  }
}

export default ApiService;
