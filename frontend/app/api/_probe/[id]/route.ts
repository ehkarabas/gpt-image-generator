export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Allow': 'GET, DELETE, OPTIONS, HEAD',
    },
  })
}

export async function DELETE() {
  return Response.json({ ok: true })
}

export async function GET() {
  return Response.json({ ok: true, method: 'GET' })
}

export async function HEAD() {
  return new Response(null, { status: 200 })
}


