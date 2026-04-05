# RPS Arena Function Limit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Limit students to a configurable maximum number of unique function names per tournament, with deduplication in Admin/Room UIs showing only latest versions.

**Architecture:** Database-enforced limit via modified RPC, with client-side deduplication for display. Tournament settings store the limit, RPC validates on submission, UIs filter to show latest versions where appropriate.

**Tech Stack:** PostgreSQL (Supabase), vanilla JavaScript, HTML/CSS

---

## File Structure

| File | Changes |
|------|---------|
| `supabase/migrations/20260405000000_rps_function_limit.sql` | Create: Add column + modify RPC |
| `rps-arena/admin.html` | Modify: Add slider, deduplicate functions grid |
| `rps-arena/room.html` | Modify: Deduplicate sidebar, add version badges |
| `rps-arena/student.html` | Modify: Add limit indicator, handle limit error |

---

## Task 1: Database Migration

**Files:**
- Create: `supabase/migrations/20260405000000_rps_function_limit.sql`

- [ ] **Step 1: Create migration file with column addition**

Create `supabase/migrations/20260405000000_rps_function_limit.sql`:

```sql
-- Add max functions per student setting to tournaments
ALTER TABLE code_mob.rps_tournaments
ADD COLUMN max_functions_per_student INT NOT NULL DEFAULT 5;
```

- [ ] **Step 2: Add modified RPC to migration**

Append to the migration file:

```sql
-- Replace submit_rps_function to enforce function limit
CREATE OR REPLACE FUNCTION code_mob.submit_rps_function(
  p_tournament_id UUID,
  p_student_name TEXT,
  p_function_name TEXT,
  p_code TEXT,
  p_language TEXT DEFAULT 'js'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = code_mob
AS $$
DECLARE
  v_tournament code_mob.rps_tournaments%ROWTYPE;
  v_next_version INT;
  v_function_id UUID;
  v_active_function_count INT;
  v_function_exists BOOLEAN;
BEGIN
  -- Check tournament exists and is active
  SELECT * INTO v_tournament FROM code_mob.rps_tournaments WHERE id = p_tournament_id AND is_active;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Tournament not found or inactive');
  END IF;

  -- Check student name is approved
  IF NOT EXISTS (
    SELECT 1 FROM code_mob.rps_approved_names
    WHERE tournament_id = p_tournament_id AND name = p_student_name
  ) THEN
    RETURN jsonb_build_object('error', 'Name not approved for this tournament');
  END IF;

  -- Check if this function name already exists for this student (any version)
  SELECT EXISTS (
    SELECT 1 FROM code_mob.rps_functions
    WHERE tournament_id = p_tournament_id
      AND student_name = p_student_name
      AND function_name = p_function_name
  ) INTO v_function_exists;

  -- If this is a NEW function name, check the limit
  IF NOT v_function_exists THEN
    -- Count distinct active function names (those with at least one non-archived version)
    SELECT COUNT(DISTINCT function_name) INTO v_active_function_count
    FROM code_mob.rps_functions
    WHERE tournament_id = p_tournament_id
      AND student_name = p_student_name
      AND is_archived = false;

    IF v_active_function_count >= v_tournament.max_functions_per_student THEN
      RETURN jsonb_build_object(
        'error',
        format('You''ve reached the maximum of %s functions. Archive one to submit a new one.', v_tournament.max_functions_per_student)
      );
    END IF;
  END IF;

  -- Ensure student record exists
  INSERT INTO code_mob.rps_students (tournament_id, name)
  VALUES (p_tournament_id, p_student_name)
  ON CONFLICT DO NOTHING;

  -- Get next version number for this function name
  SELECT COALESCE(MAX(version), 0) + 1 INTO v_next_version
  FROM code_mob.rps_functions
  WHERE tournament_id = p_tournament_id
    AND student_name = p_student_name
    AND function_name = p_function_name;

  -- Insert the function
  INSERT INTO code_mob.rps_functions (
    tournament_id, student_name, function_name, version, code, language
  ) VALUES (
    p_tournament_id, p_student_name, p_function_name, v_next_version, p_code, p_language
  )
  RETURNING id INTO v_function_id;

  RETURN jsonb_build_object(
    'ok', true,
    'function_id', v_function_id,
    'version', v_next_version
  );
END;
$$;
```

- [ ] **Step 3: Apply migration locally**

Run:
```bash
supabase db push
```

Expected: Migration applies successfully, no errors.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260405000000_rps_function_limit.sql
git commit -m "feat(db): add max_functions_per_student and enforce limit in RPC"
```

---

## Task 2: Admin UI — Settings Slider

**Files:**
- Modify: `rps-arena/admin.html`

- [ ] **Step 1: Add slider HTML after match delay slider**

In `admin.html`, find the Settings panel (around line 583-610). After the "Match Delay" slider row, add:

```html
<div class="slider-row">
  <div class="slider-header">
    <label class="label">Max Functions Per Student</label>
    <span class="slider-value" id="max-functions-value">5</span>
  </div>
  <input type="range" id="max-functions-slider" min="1" max="10" value="5">
</div>
```

- [ ] **Step 2: Add slider event listener**

Find where the other slider event listeners are defined (around line 1003-1010). Add after `matchDelaySlider.addEventListener`:

```javascript
const maxFunctionsSlider = document.getElementById('max-functions-slider');

maxFunctionsSlider.addEventListener('input', () => {
  document.getElementById('max-functions-value').textContent = maxFunctionsSlider.value;
});
```

- [ ] **Step 3: Include max_functions_per_student in save settings**

Find the `btn-save-settings` click handler (around line 1013). Update to include the new setting:

```javascript
document.getElementById('btn-save-settings').addEventListener('click', async () => {
  const data = await adminAction('update_tournament', {
    rounds_per_match: parseInt(roundsSlider.value, 10),
    round_delay_ms: parseInt(roundDelaySlider.value, 10),
    match_delay_ms: parseInt(matchDelaySlider.value, 10),
    max_functions_per_student: parseInt(maxFunctionsSlider.value, 10),
  });

  if (data?.ok) {
    showFeedback('settings-feedback', 'Settings saved!', true);
  } else if (data?.error) {
    showFeedback('settings-feedback', data.error, false);
  }
});
```

- [ ] **Step 4: Load max_functions_per_student in loadTournament**

Find the `loadTournament` function (around line 1028). After loading other slider values, add:

```javascript
maxFunctionsSlider.value = data.max_functions_per_student || 5;
document.getElementById('max-functions-value').textContent = data.max_functions_per_student || 5;
```

- [ ] **Step 5: Test manually**

1. Open `admin.html` in browser
2. Verify new slider appears in Settings panel
3. Adjust slider, click Save Settings
4. Refresh page, verify value persisted

- [ ] **Step 6: Commit**

```bash
git add rps-arena/admin.html
git commit -m "feat(admin): add max functions per student setting slider"
```

---

## Task 3: Admin UI — Deduplicate Functions Grid

**Files:**
- Modify: `rps-arena/admin.html`

- [ ] **Step 1: Add getLatestVersions helper function**

In `admin.html`, add this helper function near the top of the script section (after the state variables around line 673):

```javascript
function getLatestVersions(funcs) {
  const latest = new Map();
  for (const fn of funcs) {
    const key = `${fn.student_name}|${fn.function_name}`;
    const existing = latest.get(key);
    if (!existing || fn.version > existing.version) {
      latest.set(key, fn);
    }
  }
  return Array.from(latest.values());
}
```

- [ ] **Step 2: Apply deduplication in renderFunctions**

Find the `renderFunctions` function (around line 869). Modify to deduplicate:

```javascript
function renderFunctions() {
  const grid = document.getElementById('functions-grid');
  const latestFunctions = getLatestVersions(functions);

  if (latestFunctions.length === 0) {
    grid.innerHTML = '<div class="no-students">No functions submitted yet</div>';
    return;
  }

  grid.innerHTML = latestFunctions.map(fn => `
    <div class="function-card ${selectedFunctions.includes(fn.id) ? 'selected' : ''}" data-id="${fn.id}">
      <div class="function-card-name">${escapeHtml(fn.function_name)}</div>
      <div class="function-card-student">${escapeHtml(fn.student_name)}</div>
      <div class="function-card-version">v${fn.version} · ${fn.language.toUpperCase()}</div>
    </div>
  `).join('');

  document.querySelectorAll('.function-card').forEach(card => {
    card.addEventListener('click', () => toggleFunctionSelection(card.dataset.id));
  });

  updateAddQueueButton();
}
```

- [ ] **Step 3: Test manually**

1. Submit multiple versions of the same function from student.html
2. Open admin.html, verify only latest version shows in functions grid
3. Verify you can still select and queue matches

- [ ] **Step 4: Commit**

```bash
git add rps-arena/admin.html
git commit -m "feat(admin): show only latest function versions in grid"
```

---

## Task 4: Room UI — Deduplicate Submitted Functions Sidebar

**Files:**
- Modify: `rps-arena/room.html`

- [ ] **Step 1: Add getLatestVersions helper function**

In `room.html`, add this helper function near the top of the script section (after the state variables around line 660):

```javascript
function getLatestVersions(funcs) {
  const latest = new Map();
  for (const fn of funcs) {
    const key = `${fn.student_name}|${fn.function_name}`;
    const existing = latest.get(key);
    if (!existing || fn.version > existing.version) {
      latest.set(key, fn);
    }
  }
  return Array.from(latest.values());
}
```

- [ ] **Step 2: Update renderFunctions for left sidebar only**

Find the `renderFunctions` function (around line 746). Update to use deduplication for sidebar but not for team mode leaderboard areas:

```javascript
function renderFunctions() {
  const latestFunctions = getLatestVersions(functions);

  if (tournament?.team_mode) {
    const teamALatest = latestFunctions.filter(f => f.team === 'a');
    const teamBLatest = latestFunctions.filter(f => f.team === 'b');

    functionsList.innerHTML = teamALatest.map(f => `
      <div class="function-item team-a">
        <div class="function-item-name">${escapeHtml(f.function_name)} <span style="color:var(--text-dim);font-size:8px;">v${f.version}</span></div>
        <div class="function-item-student">${escapeHtml(f.student_name)}</div>
        <div class="function-item-stats">W:${f.match_wins} L:${f.match_losses}</div>
      </div>
    `).join('') || '<div style="color:var(--text-dim);font-size:10px;padding:10px;">No functions</div>';

    leaderboard.innerHTML = teamBLatest.map(f => `
      <div class="function-item team-b">
        <div class="function-item-name">${escapeHtml(f.function_name)} <span style="color:var(--text-dim);font-size:8px;">v${f.version}</span></div>
        <div class="function-item-student">${escapeHtml(f.student_name)}</div>
        <div class="function-item-stats">W:${f.match_wins} L:${f.match_losses}</div>
      </div>
    `).join('') || '<div style="color:var(--text-dim);font-size:10px;padding:10px;">No functions</div>';

  } else {
    functionsList.innerHTML = latestFunctions.map(f => `
      <div class="function-item">
        <div class="function-item-name">${escapeHtml(f.function_name)} <span style="color:var(--text-dim);font-size:8px;">v${f.version}</span></div>
        <div class="function-item-student">${escapeHtml(f.student_name)}</div>
        <div class="function-item-stats">W:${f.match_wins} L:${f.match_losses}</div>
      </div>
    `).join('') || '<div style="color:var(--text-dim);font-size:10px;padding:10px;">No functions</div>';
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add rps-arena/room.html
git commit -m "feat(room): deduplicate submitted functions sidebar, add version badges"
```

---

## Task 5: Room UI — Version Badges in Leaderboard

**Files:**
- Modify: `rps-arena/room.html`

- [ ] **Step 1: Update renderLeaderboard to include version badges**

Find the `renderLeaderboard` function (around line 779). Update to include version:

```javascript
function renderLeaderboard() {
  if (tournament?.team_mode) return;

  const sorted = [...functions].sort((a, b) => b.match_wins - a.match_wins);
  leaderboard.innerHTML = sorted.slice(0, 15).map((f, i) => `
    <div class="lb-row">
      <span class="lb-rank">${i + 1}</span>
      <span class="lb-name">${escapeHtml(f.function_name)} <span style="color:var(--text-dim);font-size:8px;">v${f.version}</span></span>
      <span class="lb-score">${f.match_wins}W</span>
    </div>
  `).join('') || '<div style="color:var(--text-dim);font-size:10px;">No data</div>';
}
```

- [ ] **Step 2: Commit**

```bash
git add rps-arena/room.html
git commit -m "feat(room): add version badges to leaderboard"
```

---

## Task 6: Room UI — Version Badges in Queue and Battle Arena

**Files:**
- Modify: `rps-arena/room.html`

- [ ] **Step 1: Update renderMatchQueue to include version badges**

Find the `renderMatchQueue` function (around line 814). Update:

```javascript
function renderMatchQueue() {
  queueItems.innerHTML = matchQueue.map(m => `
    <div class="queue-item ${m.status === 'playing' ? 'playing' : ''}">
      <span class="queue-item-name">${escapeHtml(m.function_a?.function_name || '?')} v${m.function_a?.version || '?'}</span>
      <span class="queue-item-vs">vs</span>
      <span class="queue-item-name">${escapeHtml(m.function_b?.function_name || '?')} v${m.function_b?.version || '?'}</span>
    </div>
  `).join('') || '<span style="color:var(--text-dim);font-size:9px;">No matches queued</span>';
}
```

- [ ] **Step 2: Update startMatch to show version in fighter names**

Find the `startMatch` function (around line 974). Update the fighter name setup:

```javascript
document.getElementById('fighter-a-name').textContent = `${fnA.function_name} v${fnA.version}`;
document.getElementById('fighter-a-student').textContent = fnA.student_name;
// ...
document.getElementById('fighter-b-name').textContent = `${fnB.function_name} v${fnB.version}`;
document.getElementById('fighter-b-student').textContent = fnB.student_name;
```

- [ ] **Step 3: Test manually**

1. Queue a match in admin.html
2. Open room.html, verify version badges appear in queue
3. Start match, verify version appears in fighter cards

- [ ] **Step 4: Commit**

```bash
git add rps-arena/room.html
git commit -m "feat(room): add version badges to match queue and battle arena"
```

---

## Task 7: Student UI — Limit Indicator

**Files:**
- Modify: `rps-arena/student.html`

- [ ] **Step 1: Add state variable for max functions**

In `student.html`, find the state variables (around line 671). Add:

```javascript
let MAX_FUNCTIONS_PER_STUDENT = 5;
```

- [ ] **Step 2: Update loadTournament to capture max_functions_per_student**

Find the `loadTournament` function (around line 1176). Update to capture the limit:

```javascript
async function loadTournament() {
  const { data, error } = await db
    .from('rps_tournaments')
    .select('id, name, mode, max_functions_per_student')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    const select = document.getElementById('name-select');
    select.innerHTML = '<option value="">No active tournament</option>';
    return false;
  }

  TOURNAMENT_ID = data.id;
  TOURNAMENT_MODE = data.mode || 'strict';
  MAX_FUNCTIONS_PER_STUDENT = data.max_functions_per_student || 5;
  return true;
}
```

- [ ] **Step 3: Add function to count active functions**

Add this helper function after `loadMySubmissions`:

```javascript
function countActiveFunctions() {
  const activeNames = new Set();
  for (const fn of mySubmissions) {
    activeNames.add(fn.function_name);
  }
  return activeNames.size;
}
```

- [ ] **Step 4: Update section label to show limit indicator**

Find the section label HTML (around line 601). Change from:

```html
<div class="section-label">My Submissions</div>
```

To:

```html
<div class="section-label">My Submissions <span id="function-count"></span></div>
```

- [ ] **Step 5: Update loadMySubmissions to update the count display**

Find the `loadMySubmissions` function (around line 1101). At the end, after setting `mySubmissions = data;`, add:

```javascript
const activeCount = countActiveFunctions();
document.getElementById('function-count').textContent = `(${activeCount}/${MAX_FUNCTIONS_PER_STUDENT})`;
```

Also update the empty state to show 0:

```javascript
if (error || !data || data.length === 0) {
  list.innerHTML = '<div class="no-submissions">No submissions yet</div>';
  mySubmissions = [];
  document.getElementById('function-count').textContent = `(0/${MAX_FUNCTIONS_PER_STUDENT})`;
  return;
}
```

- [ ] **Step 6: Test manually**

1. Open student.html
2. Submit a function, verify count shows "(1/5)"
3. Submit more functions with different names, verify count increases
4. Archive all versions of a function, verify count decreases

- [ ] **Step 7: Commit**

```bash
git add rps-arena/student.html
git commit -m "feat(student): add function limit indicator in sidebar"
```

---

## Task 8: Student UI — Handle Limit Error

**Files:**
- Modify: `rps-arena/student.html`

- [ ] **Step 1: Verify error handling already works**

The `submitCode` function (around line 1050) already displays errors from the RPC:

```javascript
if (error) throw new Error(error.message);
if (data?.error) throw new Error(data.error);
```

And errors are shown via:

```javascript
} catch (e) {
  showError(e.message);
  updateSubmitButton();
}
```

The RPC now returns a formatted error message when limit is reached. No code changes needed — just verify it works.

- [ ] **Step 2: Test manually**

1. Set max functions to 1 in admin.html
2. As a student, submit a function
3. Try to submit a second function with a different name
4. Verify error message appears: "You've reached the maximum of 1 functions. Archive one to submit a new one."

- [ ] **Step 3: Commit (documentation only if needed)**

If no code changes were needed, skip this commit.

---

## Task 9: Final Integration Test

- [ ] **Step 1: Test full flow**

1. Create a new tournament with max functions = 3
2. As student, submit 3 functions with different names
3. Verify limit indicator shows "(3/3)"
4. Try to submit a 4th function, verify error
5. Archive one function
6. Verify limit indicator shows "(2/3)"
7. Submit new function, verify it succeeds
8. Open admin.html, verify only latest versions in grid
9. Open room.html, verify sidebars show latest versions with version badges
10. Queue and run a match, verify version badges appear throughout

- [ ] **Step 2: Commit any final fixes**

```bash
git add -A
git commit -m "fix: final adjustments from integration testing"
```
