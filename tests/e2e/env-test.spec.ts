import { test, expect } from "@playwright/test";

test.describe("Environment Test", () => {
  test("should load environment variables", async () => {
    console.log("NODE_ENV:", process.env.NODE_ENV);
    console.log(
      "NEXT_PUBLIC_SUPABASE_URL:",
      process.env.NEXT_PUBLIC_SUPABASE_URL,
    );
    console.log(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY length:",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length,
    );
    console.log(
      "SUPABASE_SERVICE_ROLE_KEY length:",
      process.env.SUPABASE_SERVICE_ROLE_KEY?.length,
    );

    expect(process.env.NEXT_PUBLIC_SUPABASE_URL).toBeTruthy();
    expect(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY).toBeTruthy();
    expect(process.env.SUPABASE_SERVICE_ROLE_KEY).toBeTruthy();
  });
});
