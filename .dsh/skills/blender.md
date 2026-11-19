---
name: blender
description: "Use this when a Blender task or a 3D model must be produced or checked: modeling, UV, PBR, rigging, animation, LOD, export, render, or asset QA, driven headless."
---

# Work with Blender and 3D models

Use this when the user asks for a model, a scene, a rig, an animation, an export, or a QA pass on a 3D asset. Works with Blender 5.x headless; a live `blender-mcp` session is optional and never required.

1. Check the environment first: `pwsh tools/blender-run.ps1 -ListOnly` prints the executable and version. If Blender is missing, say so and give the download link; do not install it silently.
2. Never edit the source asset in place. Copy the `.blend` into the workspace and save results to a new file (`bpy.ops.wm.save_as_mainfile(filepath=...)`). Keep a one-line note of what changed.
3. Drive everything through a Python script, not a GUI: `pwsh tools/blender-run.ps1 -BlendFile model.blend -Script step.py`. Run one step per script, print only the numbers you need (`len(mesh.polygons)`, material count, bounding box), and stop on the first `Traceback`.
4. Follow the pipeline in order and skip what the task does not need: units and naming → modeling → UV (unwrap, texel density) → materials (Principled BSDF, color space) → rigging → animation → optimization (poly budget, LODs) → export → render → QA.
5. Use enum discovery instead of guessed names: `print([e.identifier for e in bpy.types.X.bl_rna.properties['prop'].enum_items])`, and node inputs by identifier (`node.inputs['Base Color']`), because localized labels differ between builds.
6. Export explicitly: glTF/GLB for web and engines, FBX for Unity/Unreal, USD when asked. Set `export_apply=True`, check the file size, and re-import the result in a fresh Blender run to prove it loads.
7. QA before delivery, with numbers: triangle count against the stated budget, materials assigned to every face, no non-manifold geometry on a game asset, applied scale, and a rendered preview at the requested resolution.
8. Report: what was built, the budget numbers, the export path and format, and the checks that ran. A model is not delivered on a screenshot alone.

Source of the pipeline: EL4CTEO/blender-skills (MIT), condensed for this harness; the upstream scripts are a reference, not a dependency.
