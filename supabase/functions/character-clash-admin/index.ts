import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { action, token, ...params } = await req.json();
    const adminToken = Deno.env.get('ADMIN_TOKEN');

    if (token !== adminToken) {
      return Response.json({ error: 'Invalid admin token' }, { headers: corsHeaders, status: 401 });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { db: { schema: 'code_mob' } }
    );

    let result: Record<string, unknown> = { ok: false };

    switch (action) {
      case 'create_tournament': {
        const { name, locations, max_characters_per_student, encounter_delay_ms } = params;
        const insertData: Record<string, unknown> = { name };
        if (locations) insertData.locations = locations;
        if (max_characters_per_student) insertData.max_characters_per_student = max_characters_per_student;
        if (encounter_delay_ms) insertData.encounter_delay_ms = encounter_delay_ms;
        const { data, error } = await supabase
          .from('cc_tournaments')
          .insert(insertData)
          .select()
          .single();
        if (error) throw error;
        result = { ok: true, tournament: data };
        break;
      }

      case 'update_tournament': {
        const { tournamentId, ...updates } = params;
        const { error } = await supabase
          .from('cc_tournaments')
          .update(updates)
          .eq('id', tournamentId);
        if (error) throw error;
        result = { ok: true };
        break;
      }

      case 'set_approved_names': {
        const { tournamentId, names } = params;
        await supabase.from('cc_approved_names').delete().eq('tournament_id', tournamentId);
        if (names.length > 0) {
          const rows = names.map((name: string) => ({ tournament_id: tournamentId, name }));
          const { error } = await supabase.from('cc_approved_names').insert(rows);
          if (error) throw error;
        }
        result = { ok: true };
        break;
      }

      case 'archive_character': {
        const { characterId } = params;
        const { error } = await supabase
          .from('cc_characters')
          .update({ is_archived: true })
          .eq('id', characterId);
        if (error) throw error;
        result = { ok: true };
        break;
      }

      case 'queue_encounter': {
        const { tournamentId, characterAId, characterBId, location } = params;
        const { data: existing } = await supabase
          .from('cc_encounter_queue')
          .select('position')
          .eq('tournament_id', tournamentId)
          .order('position', { ascending: false })
          .limit(1);
        const nextPosition = (existing?.[0]?.position ?? 0) + 1;

        const { data, error } = await supabase
          .from('cc_encounter_queue')
          .insert({
            tournament_id: tournamentId,
            character_a_id: characterAId,
            character_b_id: characterBId,
            location,
            position: nextPosition,
          })
          .select()
          .single();
        if (error) throw error;
        result = { ok: true, encounter: data };
        break;
      }

      case 'queue_all_vs_all': {
        const { tournamentId } = params;
        const { data: characters } = await supabase
          .from('cc_characters')
          .select('id')
          .eq('tournament_id', tournamentId)
          .eq('is_archived', false);

        if (!characters || characters.length < 2) {
          result = { ok: true, queued: 0 };
          break;
        }

        const { data: tournament } = await supabase
          .from('cc_tournaments')
          .select('locations')
          .eq('id', tournamentId)
          .single();
        const locations = tournament?.locations || ['bathroom', 'cafeteria', 'cliff', 'city', 'airplane'];

        const { data: existing } = await supabase
          .from('cc_encounter_queue')
          .select('position')
          .eq('tournament_id', tournamentId)
          .order('position', { ascending: false })
          .limit(1);
        let nextPosition = (existing?.[0]?.position ?? 0) + 1;

        const encounters = [];
        for (let i = 0; i < characters.length; i++) {
          for (let j = i + 1; j < characters.length; j++) {
            const location = locations[Math.floor(Math.random() * locations.length)];
            encounters.push({
              tournament_id: tournamentId,
              character_a_id: characters[i].id,
              character_b_id: characters[j].id,
              location,
              position: nextPosition++,
            });
          }
        }

        if (encounters.length > 0) {
          const { error } = await supabase.from('cc_encounter_queue').insert(encounters);
          if (error) throw error;
        }
        result = { ok: true, queued: encounters.length };
        break;
      }

      case 'remove_encounter': {
        const { encounterId } = params;
        const { error } = await supabase
          .from('cc_encounter_queue')
          .delete()
          .eq('id', encounterId);
        if (error) throw error;
        result = { ok: true };
        break;
      }

      case 'clear_queue': {
        const { tournamentId } = params;
        const { error } = await supabase
          .from('cc_encounter_queue')
          .delete()
          .eq('tournament_id', tournamentId)
          .eq('status', 'pending');
        if (error) throw error;
        result = { ok: true };
        break;
      }

      case 'reorder_queue': {
        const { tournamentId, encounterIds } = params;
        for (let i = 0; i < encounterIds.length; i++) {
          await supabase
            .from('cc_encounter_queue')
            .update({ position: i + 1 })
            .eq('id', encounterIds[i])
            .eq('tournament_id', tournamentId);
        }
        result = { ok: true };
        break;
      }

      case 'pause_toggle': {
        const { tournamentId } = params;
        const { data: t } = await supabase
          .from('cc_tournaments')
          .select('paused')
          .eq('id', tournamentId)
          .single();
        const newPaused = !t?.paused;
        await supabase.from('cc_tournaments').update({ paused: newPaused }).eq('id', tournamentId);
        result = { ok: true, paused: newPaused };
        break;
      }

      default:
        result = { error: `Unknown action: ${action}` };
    }

    return Response.json(result, { headers: corsHeaders });
  } catch (err) {
    console.error('character-clash-admin error:', err);
    const errorMessage = err instanceof Error ? err.message : JSON.stringify(err);
    return Response.json({ error: errorMessage }, { headers: corsHeaders, status: 500 });
  }
});
