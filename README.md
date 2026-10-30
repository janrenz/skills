# skills

**English** · [Deutsch](README.de.md)

A **plugin marketplace for Claude Code** with general-purpose skills by Jan Renz. For the software factory, see [janrenz/factory](https://github.com/janrenz/factory).

## Install

In Claude Code:

```
/plugin marketplace add janrenz/skills
/plugin install docs@janrenz-skills
/plugin install media@janrenz-skills
```

In a terminal the same works with `claude plugin marketplace add janrenz/skills` and `claude plugin install docs@janrenz-skills`.

## Skills

| Plugin | Skill | Purpose |
|---|---|---|
| `docs` | `pdf-microsite` | Turns a PDF paper into an accessible, searchable reading version as a static microsite, with text comparison against the PDF, an axe audit and layout checks. |
| `media` | `gemini-image` | Generates and edits images with a Gemini image model through the bundled `gen-image` script. |

## Requirements

- `pdf-microsite`: Python 3, `pdftotext`/`pdfinfo` (poppler), Node.js for the check scripts. Run `npm i` once in the skill's `scripts/` folder.
- `gemini-image`: [`uv`](https://docs.astral.sh/uv/) installs the `google-genai` dependency on first use. Without `uv`, `pip install google-genai` is enough.

## Configuring gemini-image

The script reads **environment variables**. They can also live in `~/.config/gen-image/config.env` (or the file `GEN_IMAGE_CONFIG` points to); variables that are set win over the file.

| Variable | Meaning |
|---|---|
| `GOOGLE_GENAI_USE_VERTEXAI` | `true` for Vertex AI; set automatically when only `GOOGLE_CLOUD_PROJECT` is present |
| `GOOGLE_CLOUD_PROJECT` | Google Cloud project id |
| `GOOGLE_CLOUD_LOCATION` | region, default `global` |
| `GOOGLE_APPLICATION_CREDENTIALS` | path to a service-account JSON with `roles/aiplatform.user`; without it, `gcloud` application default credentials apply |
| `GEMINI_API_KEY` | alternative to Vertex AI: an API key from Google AI Studio |
| `GENAI_IMAGE_MODEL` | default model, otherwise `gemini-3.1-flash-image` |

Example `~/.config/gen-image/config.env`:

```
GOOGLE_GENAI_USE_VERTEXAI=true
GOOGLE_CLOUD_PROJECT=my-project
GOOGLE_CLOUD_LOCATION=global
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
```

The file holds only **references**. The key itself belongs in a private place with `chmod 600` and **never in a repository**.

## Adding a skill

1. Create `plugins/<plugin>/skills/<skill>/` with a `SKILL.md` (frontmatter with `name` and `description`). Bundled scripts are referenced from `SKILL.md` via `${CLAUDE_SKILL_DIR}`.
2. For a new plugin, also add `plugins/<plugin>/.claude-plugin/plugin.json` and list the plugin in `.claude-plugin/marketplace.json`.
3. Bump `version` in `plugin.json` and add a line to `CHANGELOG.md`.
4. Check with `claude plugin validate .` and, before pushing, `gitleaks detect -s .`.

## License

MIT, see [LICENSE](LICENSE).
