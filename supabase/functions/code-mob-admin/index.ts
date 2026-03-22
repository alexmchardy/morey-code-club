/**
 * code-mob-admin Edge Function
 *
 * Protected by ADMIN_TOKEN Supabase secret.
 * Uses the service role key (auto-available in Edge Functions as SUPABASE_SERVICE_ROLE_KEY).
 *
 * Actions:
 *   new_session  — create a new session row (room auto-reloads via Realtime INSERT)
 *   pause_toggle — flip sessions.paused
 *   clear        — delete pixels + students, update cleared_at
 *   broadcast    — update broadcast_msg + broadcast_at
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  let body: { action?: string; token?: string; sessionId?: string; message?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Auth check
  const adminToken = Deno.env.get('ADMIN_TOKEN');
  if (!adminToken || body.token !== adminToken) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Service role client (bypasses RLS)
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const db = createClient(supabaseUrl, serviceKey, {
    db: { schema: 'code_mob' },
  });

  const { action, sessionId } = body;

  try {
    switch (action) {
      case 'new_session': {
        const { data, error } = await db
          .from('sessions')
          .insert({ game: 'pixel-poke' })
          .select('id')
          .single();
        if (error) throw error;
        return json({ ok: true, sessionId: data.id });
      }

      case 'pause_toggle': {
        if (!sessionId) return json({ error: 'sessionId required' }, 400);
        // Read current state then flip
        const { data: sess, error: readErr } = await db
          .from('sessions')
          .select('paused')
          .eq('id', sessionId)
          .single();
        if (readErr) throw readErr;
        const { error } = await db
          .from('sessions')
          .update({ paused: !sess.paused })
          .eq('id', sessionId);
        if (error) throw error;
        return json({ ok: true, paused: !sess.paused });
      }

      case 'clear': {
        if (!sessionId) return json({ error: 'sessionId required' }, 400);
        // Delete pixels and students, then stamp cleared_at
        const [pixErr, stuErr] = await Promise.all([
          db.from('pixels').delete().eq('session_id', sessionId).then(r => r.error),
          db.from('students').delete().eq('session_id', sessionId).then(r => r.error),
        ]);
        if (pixErr) throw pixErr;
        if (stuErr) throw stuErr;
        const { error } = await db
          .from('sessions')
          .update({ cleared_at: new Date().toISOString() })
          .eq('id', sessionId);
        if (error) throw error;
        return json({ ok: true });
      }

      case 'broadcast': {
        if (!sessionId) return json({ error: 'sessionId required' }, 400);
        const message = String(body.message ?? '').slice(0, 200);
        const { error } = await db
          .from('sessions')
          .update({ broadcast_msg: message, broadcast_at: new Date().toISOString() })
          .eq('id', sessionId);
        if (error) throw error;
        return json({ ok: true });
      }

      default:
        return json({ error: `Unknown action: ${action}` }, 400);
    }
  } catch (err) {
    console.error('code-mob-admin error:', err);
    return json({ error: String(err) }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
