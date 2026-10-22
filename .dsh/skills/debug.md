# Debug a failure

Use this when something fails: a command, a test, a build, or a behavior the user reports.

1. Restate the failure from the output you actually saw — the exact line, not a paraphrase.
2. Form one hypothesis that names the component and the evidence that would confirm it.
3. Run one read or one command that tests that hypothesis. If it disproves it, drop the hypothesis and form the next one; do not patch and hope.
4. Apply the smallest fix that addresses the cause. A long failure stays unpatched until the hypothesis holds.
5. Finish with the review skill: show the diff, run the check that would fail if the fix were wrong, and say what remains unverified.
