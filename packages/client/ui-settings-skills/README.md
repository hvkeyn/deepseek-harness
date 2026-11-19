---
description: "Skills management tab in Web Plugins settings: list local skills, enable or disable them without deleting files, add a new one, and remove a user skill."
kind: "package-reference"
---

# @deepseek-ai/dsh-client-ui-settings-skills

English | [中文](README.zh.md)

## Summary

The package contributes one tab to the Settings Plugins section. It reads the `skills` Remote's management catalog (which includes skills withheld from the model), toggles a skill through `skills/setEnabled`, writes a new skill into `<dshHome>/skills` with `skills/create`, and deletes only files under that root with `skills/remove`. Project skills stay read-only here because their files belong to a repository.

## What the tab shows

- every catalog skill with its name, description, and instruction-file path;
- a switch per skill; turning it off withholds the skill from the model tool and the `/` suggestions while the file stays in place;
- an add form validating the local contract's name pattern (`a-z`, `0-9`, hyphen, starting with a letter) and the 12 000-byte size limit.

## Notes

The Host service is `SessionSkillCatalog` in `@deepseek-ai/dsh-api-session-controller`, exposed as the `skills` Remote namespace. Enablement persists in `<dshHome>/skills.json` and is applied to the skill registry on every catalog read, so the model and the composer always agree.
