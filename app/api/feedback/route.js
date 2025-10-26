export async function POST(request) {
  try {
    const body = await request.json()
    // Simple server-side stub: log feedback and return success.
    // In a real app you'd validate and persist this to a database.
    console.log('Feedback received:', body)

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (err) {
    console.error('Error in feedback route:', err)
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}