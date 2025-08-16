import { supabase } from '@/lib/supabase/client'

export async function GET() {
	if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
		return Response.json(
			{ ok: false, error: 'Supabase environment variables are not set' },
			{ status: 500 }
		)
	}

	try {
		// Try a lightweight count query against a common table if it exists.
		// If it doesn't exist, an error still confirms connectivity and auth.
		const { count, error } = await supabase
			.from('profiles')
			.select('*', { count: 'exact', head: true })

		if (error) {
			return Response.json({ ok: false, error: error.message }, { status: 200 })
		}

		return Response.json({ ok: true, count: count ?? 0 }, { status: 200 })
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Unknown error'
		return Response.json({ ok: false, error: message }, { status: 500 })
	}
}


