# Claude Repo Config

- Repo: DeeprSoni/linkedin-extension
- Default work branch: development
- Protected branch: master
- Coding style:
  - Prefer many small helper functions and class methods.
  - Absolutely avoid repeating identical code blocks.
  - When changing code, show only the minimal diff or only changed functions, not entire files unless asked.
  - No long inline explanations or comments unless explicitly requested.
- Commit policy:
  - Every logically complete change = 1 commit.
  - Commit messages: present-tense, concise, e.g. "add bulk messaging helper for connection requests".
  - Always push to `development` branch.
- Safety rules:
  - Never modify config files like .gitignore, package.json, manifest.json, or build config unless explicitly requested.
  - Never touch master directly.
  - If a change is risky or ambiguous, explain the risk briefly before committing.
- Tech stack (to remind you):
  - Browser extension for LinkedIn automation (scraping profiles, sending connection requests and messages in bulk).
