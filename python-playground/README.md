# Python Playground

A browser-based Python editor and runner for Morey Code Club students.

## Usage

Open in browser:
- `python-playground/` — Free-form sandbox mode
- `python-playground/?project=snarky-calculator` — Load a specific project

## Adding New Projects

1. Create a new file in `projects/` (e.g., `projects/my-project.js`)

2. Export a project config:

```javascript
export default {
  id: 'my-project',           // URL-safe identifier
  title: 'My Project',        // Display name
  description: 'Optional tagline',

  steps: [
    {
      id: 'step-1',
      text: 'Do the first thing',
      detect: (code) => /some_pattern/.test(code)  // Auto-detect
    },
    {
      id: 'step-2',
      text: 'Manually check this step',
      manual: true  // Student clicks to complete
    },
  ],

  hints: [
    { title: 'Hint 1', content: 'Code example here' },
  ],

  starterCode: `# My Project\n\n`,
};
```

3. Add to manifest in `projects/index.js`:

```javascript
export default [
  { id: 'snarky-calculator', title: 'Snarky Calculator' },
  { id: 'my-project', title: 'My Project' },  // Add here
];
```

## Tech Stack

- **Skulpt 1.2.0** — Python execution in browser
- **CodeMirror 5.65.16** — Code editor
- **localStorage** — Code and progress persistence
