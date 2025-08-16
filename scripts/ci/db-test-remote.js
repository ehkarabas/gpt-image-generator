const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!url || !anon) {
  console.log('Skipping remote DB test - missing env')
  process.exit(0)
}

console.log('Remote DB env present. (Connectivity test placeholder)')

