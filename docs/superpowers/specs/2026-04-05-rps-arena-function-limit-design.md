# RPS Arena Function Limit Design

**Date:** 2026-04-05
**Status:** Approved

## Overview

Limit students to a configurable maximum number of unique function names per tournament. Students can submit unlimited versions of each function, but the total number of distinct function names is capped.

## Requirements

1. Students limited to N separate functions (default: 5)
2. Limit is adjustable per tournament in Admin UI
3. Students can submit many versions of each function
4. Only latest version appears in Admin UI functions grid and Room UI "Submitted Functions" sidebar
5. All versions appear in Room UI leaderboard with per-version stats
6. Archived functions don't count toward limit (only if ALL versions of that name are archived)
7. Hard block when limit reached — submission rejected with error message

## Database Changes

### New column on `rps_tournaments`

```sql
ALTER TABLE code_mob.rps_tournaments
ADD COLUMN max_functions_per_student INT NOT NULL DEFAULT 5;
```

### Modified `submit_rps_function` RPC

Add limit check before allowing a new function name:

1. Check if this is a NEW function name (no existing versions for this student + name)
2. If new, count distinct active function names for this student:
   ```sql
   SELECT COUNT(DISTINCT function_name)
   FROM rps_functions
   WHERE tournament_id = p_tournament_id
     AND student_name = p_student_name
     AND is_archived = false
   ```
3. If count >= `max_functions_per_student`, return error

A function name is "active" if at least one version is non-archived.

## Admin UI Changes

### Settings Panel

Add slider after existing settings:
- **Label:** "Max Functions Per Student"
- **Range:** 1-10
- **Default:** 5
- **Saved via:** existing `update_tournament` action

### Submitted Functions Grid

Show only the latest version per `(student_name, function_name)`:
- Fetch all non-archived functions
- Group by `student_name + function_name`
- Keep only the one with highest `version`
- Display: function name, student name, version badge, language

## Room UI Changes

### Left Sidebar — Submitted Functions

- Show only latest version per `(student_name, function_name)` (same deduplication as Admin)
- Add version badge (e.g., "v3") next to function name

### Right Sidebar — Leaderboard

- Show ALL versions with their individual per-version stats (no deduplication)
- Add version badge to distinguish versions (e.g., "BotA v1", "BotA v2")

### Match Queue

- Add version badge to function names in queue items
- No deduplication — matches are queued with specific function IDs

### Battle Arena — Fighter Cards

- Add version badge to fighter names

## Student UI Changes

### Error Handling

When RPC returns limit error, display in output area:
> "You've reached the maximum of 5 functions. Archive one to submit a new one."

### Limit Indicator

Update "My Submissions" section label to show usage:
> "MY SUBMISSIONS (3/5 FUNCTIONS)"

Requires fetching `max_functions_per_student` from tournament data.

### My Submissions List

No change — continue showing ALL versions so students can manage their history.

## Implementation Notes

### Deduplication Helper (JS)

```javascript
function getLatestVersions(functions) {
  const latest = new Map();
  for (const fn of functions) {
    const key = `${fn.student_name}|${fn.function_name}`;
    const existing = latest.get(key);
    if (!existing || fn.version > existing.version) {
      latest.set(key, fn);
    }
  }
  return Array.from(latest.values());
}
```

### Version Badge Format

Use existing styling patterns, display as "v1", "v2", etc.
