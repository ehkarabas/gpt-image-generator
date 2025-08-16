const REQUIRED_ENV_VARS = [
	'NEXT_PUBLIC_SUPABASE_URL',
	'NEXT_PUBLIC_SUPABASE_ANON_KEY'
] as const

export type RequiredEnvVar = typeof REQUIRED_ENV_VARS[number]

export function validateEnv(): void {
	const missing = REQUIRED_ENV_VARS.filter((key) => !process.env[key])
	if (missing.length > 0) {
		throw new Error(
			`Missing required environment variables: ${missing.join(', ')}`
		)
	}
}


