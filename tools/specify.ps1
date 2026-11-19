# Scaffold a Spec Kit feature the way this harness reads it.
#
# Every feature gets its own directory under specs/: a specification with
# prioritized user stories, a plan, and an ordered task list. The script writes
# the files the `spec-kit` skill fills in; it never invents the content.
[CmdletBinding()]
param(
  [string]$Feature,
  [string]$Slug,
  [switch]$List
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$specs = Join-Path $root 'specs'

if ($List) {
  Get-ChildItem $specs -Directory -ErrorAction SilentlyContinue |
    Sort-Object Name |
    ForEach-Object { $_.Name }
  exit 0
}

if (-not $Feature) { throw 'give -Feature "<feature name>" or -List' }
if (-not $Slug) {
  $Slug = ($Feature.ToLowerInvariant() -replace '[^a-z0-9]+', '-').Trim('-')
}
if ($Slug -notmatch '^[a-z0-9][a-z0-9-]{1,60}$') { throw "slug is not kebab-case: $Slug" }

New-Item -ItemType Directory -Force $specs | Out-Null
$numbers = Get-ChildItem $specs -Directory -ErrorAction SilentlyContinue |
  ForEach-Object { if ($_.Name -match '^(\d{3})-') { [int]$Matches[1] } }
$next = if ($numbers) { ($numbers | Measure-Object -Maximum).Maximum + 1 } else { 1 }
$directory = Join-Path $specs ('{0:000}-{1}' -f $next, $Slug)
New-Item -ItemType Directory -Force $directory | Out-Null
$date = (Get-Date).ToString('yyyy-MM-dd')
$leafName = Split-Path $directory -Leaf

$specPath = Join-Path $directory 'spec.md'
if (-not (Test-Path $specPath)) {
  @"
# Feature Specification: $Feature

**Feature directory**: $leafName
**Created**: $date
**Status**: Draft
**Input**: $Feature

## User Scenarios & Testing

### User Story 1 - [title] (Priority: P1)

[the journey in plain language]

**Why this priority**: [the value and why it is first]

**Independent Test**: [how this story is proven alone]

**Acceptance Scenarios**:

1. **Given** [state], **When** [action], **Then** [outcome]

## Requirements

- **FR-001**: [what the system must do]
- **FR-002**: [what the system must do]

## Success Criteria

- **SC-001**: [a measurable outcome]

## Assumptions

- [an assumption, or "none"]
"@ | Set-Content $specPath -Encoding UTF8
}

$planPath = Join-Path $directory 'plan.md'
if (-not (Test-Path $planPath)) {
  @"
# Implementation Plan: $Feature

**Spec**: `spec.md`
**Created**: $date
**Status**: Draft

## Technical Context

- Runtime and language: [from the repository]
- Primary dependencies: [names and versions]
- Storage: [what changes, what stays]
- Tests: [the owning suites]

## Constitution Check

- [each project rule that constrains this feature, or "none"]

## Design

- Files touched: [paths]
- Data flow: [caller to observable result]
- Failure modes: [what can fail and who reports it]

## Risks

- [risk, its trigger, its mitigation]
"@ | Set-Content $planPath -Encoding UTF8
}

$tasksPath = Join-Path $directory 'tasks.md'
if (-not (Test-Path $tasksPath)) {
  @"
# Tasks: $Feature

**Spec**: `spec.md` | **Plan**: `plan.md`

## Phase 1 - Setup

- [ ] T001 [one concrete edit or command]

## Phase 2 - Implementation

- [ ] T002 [file: change]

## Phase 3 - Verification

- [ ] T003 [the check that proves the change]
"@ | Set-Content $tasksPath -Encoding UTF8
}

$researchPath = Join-Path $directory 'research.md'
if (-not (Test-Path $researchPath)) {
  @"
# Research: $Feature

Each entry answers one open question from `plan.md`; delete the file when nothing is open.

## [question]

- Decision:
- Evidence:
- Alternatives:
"@ | Set-Content $researchPath -Encoding UTF8
}

"created $(Split-Path $directory -Leaf)"
Get-ChildItem $directory -File | ForEach-Object { "  $($_.Name)" }
