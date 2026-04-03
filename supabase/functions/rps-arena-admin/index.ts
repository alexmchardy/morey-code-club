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
        const { name, mode, team_mode, team_a_name, team_b_name } = params;
        const { data, error } = await supabase
          .from('rps_tournaments')
          .insert({ name, mode, team_mode, team_a_name, team_b_name })
          .select()
          .single();
        if (error) throw error;
        result = { ok: true, tournament: data };
        break;
      }

      case 'set_approved_names': {
        const { tournamentId, names } = params;
        await supabase.from('rps_approved_names').delete().eq('tournament_id', tournamentId);
        if (names.length > 0) {
          const rows = names.map((name: string) => ({ tournament_id: tournamentId, name }));
          const { error } = await supabase.from('rps_approved_names').insert(rows);
          if (error) throw error;
        }
        result = { ok: true };
        break;
      }

      case 'assign_team': {
        const { tournamentId, studentName, team } = params;
        const { error } = await supabase
          .from('rps_students')
          .upsert({ tournament_id: tournamentId, name: studentName, team });
        if (error) throw error;
        result = { ok: true };
        break;
      }

      case 'randomize_teams': {
        const { tournamentId } = params;
        const { data: students } = await supabase
          .from('rps_students')
          .select('name')
          .eq('tournament_id', tournamentId);
        if (students && students.length > 0) {
          const shuffled = [...students].sort(() => Math.random() - 0.5);
          const half = Math.ceil(shuffled.length / 2);
          for (let i = 0; i < shuffled.length; i++) {
            const team = i < half ? 'a' : 'b';
            await supabase.from('rps_students')
              .update({ team })
              .eq('tournament_id', tournamentId)
              .eq('name', shuffled[i].name);
          }
        }
        result = { ok: true };
        break;
      }

      case 'archive_function': {
        const { functionId } = params;
        const { error } = await supabase
          .from('rps_functions')
          .update({ is_archived: true })
          .eq('id', functionId);
        if (error) throw error;
        result = { ok: true };
        break;
      }

      case 'queue_match': {
        const { tournamentId, functionAId, functionBId } = params;
        const { data: existing } = await supabase
          .from('rps_match_queue')
          .select('position')
          .eq('tournament_id', tournamentId)
          .order('position', { ascending: false })
          .limit(1);
        const nextPosition = (existing?.[0]?.position ?? 0) + 1;

        const { data, error } = await supabase
          .from('rps_match_queue')
          .insert({
            tournament_id: tournamentId,
            function_a_id: functionAId,
            function_b_id: functionBId,
            position: nextPosition,
          })
          .select()
          .single();
        if (error) throw error;
        result = { ok: true, match: data };
        break;
      }

      case 'update_match': {
        const { matchId, status, winnerFunctionId, isTie } = params;
        const updates: Record<string, unknown> = { status };
        if (winnerFunctionId !== undefined) updates.winner_function_id = winnerFunctionId;
        if (isTie !== undefined) updates.is_tie = isTie;
        const { error } = await supabase
          .from('rps_match_queue')
          .update(updates)
          .eq('id', matchId);
        if (error) throw error;
        result = { ok: true };
        break;
      }

      case 'next_match': {
        const { tournamentId, matchId } = params;
        if (matchId) {
          await supabase.from('rps_match_queue')
            .update({ status: 'playing' })
            .eq('id', matchId);
        } else {
          const { data } = await supabase.from('rps_match_queue')
            .select('id')
            .eq('tournament_id', tournamentId)
            .eq('status', 'pending')
            .order('position')
            .limit(1);
          if (data?.[0]) {
            await supabase.from('rps_match_queue')
              .update({ status: 'playing' })
              .eq('id', data[0].id);
          }
        }
        result = { ok: true };
        break;
      }

      case 'complete_match': {
        const { matchId, winnerFunctionId, isTie, functionAId, functionBId, functionARoundWins, functionBRoundWins } = params;
        await supabase.from('rps_match_queue')
          .update({ status: 'completed', winner_function_id: isTie ? null : winnerFunctionId, is_tie: isTie || false })
          .eq('id', matchId);
        // Update function A stats
        const { data: fnA } = await supabase.from('rps_functions').select('match_wins, match_losses, round_wins').eq('id', functionAId).single();
        if (fnA) {
          const aWon = !isTie && winnerFunctionId === functionAId;
          await supabase.from('rps_functions').update({
            match_wins: fnA.match_wins + (aWon || isTie ? 1 : 0),
            match_losses: fnA.match_losses + (!aWon && !isTie ? 1 : 0),
            round_wins: fnA.round_wins + (functionARoundWins || 0),
          }).eq('id', functionAId);
        }
        // Update function B stats
        const { data: fnB } = await supabase.from('rps_functions').select('match_wins, match_losses, round_wins').eq('id', functionBId).single();
        if (fnB) {
          const bWon = !isTie && winnerFunctionId === functionBId;
          await supabase.from('rps_functions').update({
            match_wins: fnB.match_wins + (bWon || isTie ? 1 : 0),
            match_losses: fnB.match_losses + (!bWon && !isTie ? 1 : 0),
            round_wins: fnB.round_wins + (functionBRoundWins || 0),
          }).eq('id', functionBId);
        }
        result = { ok: true };
        break;
      }

      case 'update_function_stats': {
        const { functionId, matchWinsDelta, matchLossesDelta, roundWinsDelta } = params;
        const { data: fn } = await supabase
          .from('rps_functions')
          .select('match_wins, match_losses, round_wins')
          .eq('id', functionId)
          .single();
        if (fn) {
          await supabase.from('rps_functions').update({
            match_wins: fn.match_wins + (matchWinsDelta || 0),
            match_losses: fn.match_losses + (matchLossesDelta || 0),
            round_wins: fn.round_wins + (roundWinsDelta || 0),
          }).eq('id', functionId);
        }
        result = { ok: true };
        break;
      }

      case 'update_tournament': {
        const { tournamentId, ...updates } = params;
        const { error } = await supabase
          .from('rps_tournaments')
          .update(updates)
          .eq('id', tournamentId);
        if (error) throw error;
        result = { ok: true };
        break;
      }

      case 'pause_toggle': {
        const { tournamentId } = params;
        const { data: t } = await supabase
          .from('rps_tournaments')
          .select('paused')
          .eq('id', tournamentId)
          .single();
        const newPaused = !t?.paused;
        await supabase.from('rps_tournaments').update({ paused: newPaused }).eq('id', tournamentId);
        result = { ok: true, paused: newPaused };
        break;
      }

      default:
        result = { error: `Unknown action: ${action}` };
    }

    return Response.json(result, { headers: corsHeaders });
  } catch (err) {
    return Response.json({ error: String(err) }, { headers: corsHeaders, status: 500 });
  }
});
