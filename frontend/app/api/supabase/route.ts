// frontend/app/api/supabase/route.ts
import { createClient } from "@/lib/supabase/server"; // server client import et

export async function GET() {
    // console.log("URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
    // console.log("KEY:", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return Response.json(
      { ok: false, error: "Supabase environment variable'ları set edilmemiş" },
      { status: 500 },
    );
  }

  try {
    const supabase = await createClient(); // AWAIT ekle!
    
    const { count, error } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });

    if (error) {
      return Response.json(
        { ok: false, error: error.message },
        { status: 200 },
      );
    }

    return Response.json({ ok: true, count: count ?? 0 }, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}