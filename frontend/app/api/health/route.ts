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
    database: "healthy" | "configured" | "missing" | "error";
    mongodb: "healthy" | "partial" | "configured" | "missing" | "error";
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
        mongodb: "missing",
        ai: "missing",
      },
    };

    // Check database configuration and connectivity
    const hasSupabaseConfig = !!(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    if (hasSupabaseConfig) {
      try {
        // Ping Supabase to keep it alive - simple auth check
        const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`, {
          method: 'HEAD',
          headers: {
            'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`
          }
        });
        
        healthData.services.database = response.ok ? "healthy" : "configured";
      } catch (error) {
        healthData.services.database = "error";
      }
    }

    // Check MongoDB connections and keep them alive
    const mongoUris = [
      process.env.MONGODB_DATABASE_URI_REMOTE,
      process.env.CONNECT_MONGO_DATABASE_URI_REMOTE
    ].filter(Boolean);

    if (mongoUris.length > 0) {
      let mongoHealthy = 0;
      let mongoTotal = mongoUris.length;

      // Import MongoDB client dynamically
      try {
        const { MongoClient } = await import('mongodb');
        
        for (const uri of mongoUris) {
          try {
            // Create client and test connection to keep MongoDB Atlas alive
            const client = new MongoClient(uri as string);
            await client.connect();
            
            // Simple ping to keep connection alive
            await client.db().admin().ping();
            await client.close();
            
            mongoHealthy++;
          } catch (error) {
            // MongoDB ping failed, but continue with others
            console.log('MongoDB ping failed for:', uri?.substring(0, 50) + '...');
          }
        }
      } catch (importError) {
        console.log('MongoDB client not available, skipping MongoDB ping');
      }

      healthData.services.mongodb = mongoHealthy === mongoTotal ? "healthy" : 
                                   mongoHealthy > 0 ? "partial" : "configured";
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
        mongodb: "error",
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
