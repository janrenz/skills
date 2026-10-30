# skills

Ein **Plugin-Marketplace für Claude Code** mit allgemeinen Skills von Jan Renz.

## Installation

In Claude Code:

```
/plugin marketplace add janrenz/skills
/plugin install docs@janrenz-skills
/plugin install media@janrenz-skills
```

Im Terminal geht dasselbe mit `claude plugin marketplace add janrenz/skills` und `claude plugin install docs@janrenz-skills`.

## Skills

| Plugin | Skill | Zweck |
|---|---|---|
| `docs` | `pdf-microsite` | Macht aus einem PDF-Papier eine barrierefreie, durchsuchbare Lesefassung als statische Microsite, mit Textabgleich, axe-Audit und Layoutprüfung. |
| `media` | `gemini-image` | Erzeugt und bearbeitet Bilder mit einem Gemini-Bildmodell über das mitgelieferte Skript `gen-image`. |

## Voraussetzungen

- `pdf-microsite`: Python 3, `pdftotext`/`pdfinfo` (poppler), Node.js für die Prüfskripte. Die Node-Abhängigkeiten installiert einmalig `npm i` im Ordner `scripts/` des Skills.
- `gemini-image`: [`uv`](https://docs.astral.sh/uv/) installiert die Abhängigkeit `google-genai` beim ersten Aufruf selbst. Ohne `uv` reicht `pip install google-genai`.

## Konfiguration von gemini-image

Das Skript liest **Umgebungsvariablen**. Sie können auch in `~/.config/gen-image/config.env` stehen (oder in der Datei, auf die `GEN_IMAGE_CONFIG` zeigt); gesetzte Variablen haben Vorrang vor der Datei.

| Variable | Bedeutung |
|---|---|
| `GOOGLE_GENAI_USE_VERTEXAI` | `true` für Vertex AI; wird automatisch gesetzt, wenn nur `GOOGLE_CLOUD_PROJECT` vorhanden ist |
| `GOOGLE_CLOUD_PROJECT` | Projekt-ID in Google Cloud |
| `GOOGLE_CLOUD_LOCATION` | Region, Standard `global` |
| `GOOGLE_APPLICATION_CREDENTIALS` | Pfad zur JSON-Datei eines Service-Accounts mit `roles/aiplatform.user`; ohne sie gelten die Application Default Credentials von `gcloud` |
| `GEMINI_API_KEY` | Alternative zu Vertex AI: API-Key aus Google AI Studio |
| `GENAI_IMAGE_MODEL` | Standardmodell, sonst `gemini-3.1-flash-image` |

Beispiel für `~/.config/gen-image/config.env`:

```
GOOGLE_GENAI_USE_VERTEXAI=true
GOOGLE_CLOUD_PROJECT=mein-projekt
GOOGLE_CLOUD_LOCATION=global
GOOGLE_APPLICATION_CREDENTIALS=/pfad/zu/service-account.json
```

Die Datei enthält nur **Verweise**. Der Schlüssel selbst gehört mit `chmod 600` an einen privaten Ort und **nie in ein Repository**.

## Einen Skill hinzufügen

1. Ordner `plugins/<plugin>/skills/<skill>/` mit einer `SKILL.md` anlegen (Frontmatter mit `name` und `description`). Mitgelieferte Skripte referenziert die `SKILL.md` über `${CLAUDE_SKILL_DIR}`.
2. Für ein neues Plugin zusätzlich `plugins/<plugin>/.claude-plugin/plugin.json` anlegen und das Plugin in `.claude-plugin/marketplace.json` eintragen.
3. `version` in der `plugin.json` erhöhen und eine Zeile in `CHANGELOG.md` ergänzen.
4. Prüfen mit `claude plugin validate .` und vor dem Push mit `gitleaks detect -s .`.

## Lizenz

MIT, siehe [LICENSE](LICENSE).
