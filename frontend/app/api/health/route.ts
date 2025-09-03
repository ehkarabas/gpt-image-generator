import { NextResponse } from "next/server";

// Vercel timeout configuration
export const maxDuration = 10;
export const runtime = 'nodejs';

/**
 * Health check endpoint for production deployment validation
 * Returns basic service status and environment information
 *
 * Used by GitHub Actions CI/CD pipeline for live API health verification
 */

type HealthData = {
  status: "healthy" | "unhealthy";
  timestamp: string;
  environment: string;
  version: string;
  services: {
    api: "operational" | "error";
    database: "configured" | "missing" | "error";
    ai: "configured" | "missing" | "error";
  };
};

export async function GET(): Promise<NextResponse<HealthData>> {
  try {
    // Basic health check response
    const healthData: HealthData = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      environment: process.env.DEPLOYMENT_ENV || "unknown",
      version: "1.0.0",
      services: {
        api: "operational",
        database: "missing",
        ai: "missing",
      },
    };

    // Check database configuration
    const hasSupabaseConfig = !!(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    if (hasSupabaseConfig) {
      healthData.services.database = "configured";
    }

    // Check AI services configuration
    const hasOpenAIConfig = !!process.env.OPENAI_API_KEY;

    if (hasOpenAIConfig) {
      healthData.services.ai = "configured";
    }

    return NextResponse.json(healthData, {
      status: 200,
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch (error) {
    console.error("Health check failed:", error);

    const errorData: HealthData = {
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      environment: process.env.DEPLOYMENT_ENV || "unknown",
      version: "1.0.0",
      services: {
        api: "error",
        database: "error",
        ai: "error",
      },
    };

    return NextResponse.json(errorData, {
      status: 500,
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  }
}

// Export HEAD method for basic connectivity tests
export async function HEAD(): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
  });
}
