---
name: gemini-image
description: >
  Generate or edit an image locally with a Gemini image model ("Nano Banana"),
  on Vertex AI with a service account or with a Gemini API key. Use whenever an
  image has to be produced on this machine — a hero image for a blog post, an
  illustration for a post or slide, a mockup, a variation of an existing
  picture. Triggers: "generate an image", "make a hero image", "Bild erzeugen",
  "Hero-Bild", "Illustration", "nano banana", "Gemini image", "edit this
  picture", image variations, aspect-ratio changes.
---

# Generating images with Gemini

The skill ships a ready-made command. Do not reach for an external service, a
different agent, or a web UI — and never write image-generation code from
scratch.

```bash
${CLAUDE_SKILL_DIR}/scripts/gen-image --prompt "..." --out ./pic.png
```

The script runs with `uv run --script`, which installs its one dependency
(`google-genai`) into a cached environment on first use. Without `uv`:
`pip install google-genai` and run `python3 ${CLAUDE_SKILL_DIR}/scripts/gen-image …`.

## Options

| Flag | Meaning |
|---|---|
| `--prompt`, `-p` | what to draw (required) |
| `--out`, `-o` | output file, `.png` (required) |
| `--aspect`, `-a` | `16:9` (default), `1:1`, `3:2`, `4:3`, `9:16`, `21:9`, … |
| `--model`, `-m` | override the model (see below) |
| `--ref FILE` | reference image to edit or extend; repeatable |
| `--force`, `-f` | overwrite an existing output file |

Exit codes: `1` usage or config problem, `2` API error, `3` the model returned no
image (the message then quotes what it said instead — usually a safety refusal or
a prompt it read as a text request).

## Model choice

- `gemini-3.1-flash-image` — the default. Good quality, cheap, fast. Right for
  abstract editorial illustrations without text in the image.
- `gemini-3-pro-image` — higher fidelity and, importantly, **legible text inside
  the image**. Use it when the motif needs labels, signage, or UI text, or when
  Flash produced something muddy.

Start with the default and only escalate when the result does not hold up.

## Workflow

1. Generate into the place the image belongs, named after what it is for:
   ```bash
   ${CLAUDE_SKILL_DIR}/scripts/gen-image -p "<motif>" -o static/img/blog/<slug>/hero-<slug>.png
   ```
2. Look at the result (read the PNG) before offering it. Regenerate rather than
   shipping something that misses the motif.
3. Write alt text from the image that was actually produced, not from the
   prompt. Multilingual sites get alt text in each language.
4. A reliable style for hero images: abstract editorial illustration, muted
   palette, no text in the image, one concrete visual metaphor for the thesis.
   If the project already has images, match their format and style.

## Configuration

All configuration is environment variables. They can be set in the shell or kept
in a `KEY=VALUE` file — `~/.config/gen-image/config.env` by default, or the file
named by `GEN_IMAGE_CONFIG`. Variables already in the environment win over the
file. The file holds only **pointers**, never key material.

Vertex AI with a service account:

```
GOOGLE_GENAI_USE_VERTEXAI=true
GOOGLE_CLOUD_PROJECT=<project id>
GOOGLE_CLOUD_LOCATION=global
GOOGLE_APPLICATION_CREDENTIALS=<path to the service-account key JSON>
GENAI_IMAGE_MODEL=gemini-3.1-flash-image
```

Without `GOOGLE_APPLICATION_CREDENTIALS`, Vertex AI uses Application Default
Credentials (`gcloud auth application-default login`). With only
`GEMINI_API_KEY` set (and no `GOOGLE_CLOUD_PROJECT`), the script uses the
Gemini API instead. `GOOGLE_CLOUD_LOCATION` defaults to `global`,
`GENAI_IMAGE_MODEL` to `gemini-3.1-flash-image`.

**Rules that are not negotiable:**

- Never `cat`, `head`, `grep`, or otherwise print the key file or an API key, and
  never echo either into a tool call. Everything printed lands in a transcript.
- Never copy the key into a repository, a scratchpad, or `/tmp`.
- If a key ever does leak into output, say so plainly and tell the user to
  delete and recreate it (Cloud Console or AI Studio). Rotation is the only fix.
- Reading the project id out of the key file is fine, but write it straight into
  the config file — do not print it on the way.

## When it fails

- `no configuration found` → nothing is set yet; ask the user where the key file
  is, move it to a private location such as `~/.secrets/` with `chmod 600`
  (moving does not read it), then write the config file.
- `credential file not found` → `GOOGLE_APPLICATION_CREDENTIALS` points nowhere.
- `403` / `permission denied` → the service account needs `roles/aiplatform.user`
  on the project.
- `404` on the model → that model is not enabled in this project or region; try
  `GOOGLE_CLOUD_LOCATION=global`, then a specific region such as `europe-west4`.
- `no image in the response` → usually a safety filter or a prompt the model read
  as a request for text. Rephrase the motif concretely and visually.
