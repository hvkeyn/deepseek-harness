# Reverse engineering a program

Use this when a program, an APK or DEX, a native library, a firmware image, or a script must be understood beyond its screen: recover the real algorithm, a hidden branch, a key, a protocol, a packer, or a backdoor inserted by a developer or by someone redistributing the software. A surface APK check is android-apk; this skill goes to the logic.

## Before the sample

1. Authorization and provenance. Analyze only software you own or are allowed to inspect. Record the SHA-256, the size, the source, the date, and who asked. Work on a copy. A sample from a victim is evidence: do not clean it, rename it, or run it in place.
2. Isolation. Static analysis first. A suspected malware sample is not run on this daily phone. Dynamic work uses a disposable device, a second profile, an emulator, or a PC that can be wiped. If no isolation is available, stop at static analysis and say so. Never contact a live command server, log in, pay, or replay a request. Capture traffic with capture_dump and read it with read_dump; do not send a payload to a remote host.
3. Evidence. Hash every file you touch (SHA-256 at minimum; MD5, SHA-1, and imphash when a corpus uses them). Note the file type, architecture, bitness, sections, entropy, imports, exports, signatures, manifest, and the exact tool command. Keep the sample outside the project in a quarantine folder; put only hashes, notes, and extracted facts in the project. Do not upload the sample to a reader, a scanner, a paste host, or a model.
4. No fabrication. A function exists only where an address, a disassembly, or a cross-reference supports it. A key is recovered only when a test vector decrypts. A backdoor is proven only by a trigger and an action path, not by one suspicious string. Say "proven", "inferred", or "unresolved" for each claim. Do not name a malware family from a single string.

## Map the target

- File type and container: APK (ZIP), DEX/ODEX/VDEX, ELF shared object, PE, Mach-O, firmware, or script. Architecture: AArch64, ARM32 or Thumb, x86, x86-64. Bitness, endianness, and whether the file is packed.
- Android layers: Java or Kotlin to DEX and smali; JNI to a native library; assets and resources; split APKs and dynamic features; React Native, Flutter, Unity, Cordova, or Xamarin; packers such as Jiagu, Bangcle, Legu, DexGuard, or a custom loader; encrypted DEX and dynamic loading; virtual-machine protectors.
- First pass: sha256sum, unzip -l, file, strings -a and strings -el, readelf -h -S -l -d -s, objdump -d, aapt2 dump badging, apktool d, jadx. Check the signing certificate, the manifest, exported components, permissions, native libraries, and every asset that is not an image.
- Annotations: keep a table of address or offset, name, what it does, and the evidence. Use the same names in every note. Paranoia and the desktop tools key annotations by SHA-256, so the same sample keeps its names.

## Recover the logic

1. Entry points. Manifest components, services, receivers, providers, Application, the native JNI_OnLoad, the init array, exported functions, TLS callbacks, and main. For each, the first question is what input reaches it and what output leaves it.
2. Call graph and cross-references. Walk from the entry to the decision. Name functions by behavior, not by a guessed source name. Follow reflection, dynamic loading, JNI RegisterNatives, invoke-custom, and string decryption. Do not trust a function name that the obfuscator left behind.
3. Data first. Recover constants, ASCII and UTF-16 strings, resources, encrypted blobs, keys, IVs, URLs, user agents, headers, JSON or protobuf schemes, file paths, package names, certificate pins, and feature flags. Map each value to the code that reads it and to the code that acts on it.
4. Control flow. Branches, switches, loops, state machines, and exception handlers. Build a decision table: input or environment, condition, action. Look for triggers: time or date, locale, SIM or carrier, build properties, installed package, network answer, license, debugger, emulator, root, signature, battery or screen state, and a second stage.
5. Algorithm. Identify crypto by constants and structure: AES S-box and round count, SHA initial words, ChaCha or Salsa constants, RC4, CRC, Base64, XOR, compression (zlib, gzip, lz4), serialization, and custom bytecode. Recover the key schedule, the IV or nonce, the mode, and every transform around the cipher. Reproduce it in Python or Java and check it against a known plaintext, a captured request, or a test vector. A decryptor is not proven until it round-trips.
6. Native code. ELF headers, sections, imports (libc, JNI, OpenSSL, curl), JNI entry points, syscalls, anti-debug checks (ptrace, TracerPid, /proc/self/status), anti-VM checks (QEMU properties, sensors, build fields), packing, and the init array. Use readelf, objdump, strings, and Paranoia on a PC. Note that ARM32 and Thumb are not covered by Paranoia; use objdump or radare2 there.
7. Dynamic work, only when isolated. Logcat filtered to the package, a filesystem watch, a memory dump of a decrypted DEX or a native payload, Java and JNI hooks with Frida if the disposable device already has it, and a network capture. Do not install a hooking framework on the daily phone. Do not let the sample reach its live server.
8. Reconstruct. Write the recovered function as C-like pseudocode, the data structures, the protocol messages, the key schedule, and the state table. Mark every original name as a guess. Keep a list of what is still unresolved.

## Paranoia on a computer

Paranoia (github.com/Altumptic/paranoia, Apache-2.0) is a local-first disassembler and analysis platform for PE, ELF, and Mach-O on x86, x86-64, and AArch64. Its CLI is useful when a PC is available:

```
paranoia info SAMPLE
paranoia functions SAMPLE
paranoia disasm SAMPLE --at main -n 40
paranoia pseudo SAMPLE main
paranoia xrefs SAMPLE CreateFileW
paranoia strings --referenced SAMPLE --json
```

It provides recursive-descent function discovery, basic blocks, switch-table recovery, imports and exports, cross-references, a call graph, a partial x86/x64 pseudocode view, entropy, sections, mitigations (ASLR, DEP, CFG, RELRO, PIE, canaries, FORTIFY), bookmarks, patching, and IDC export. Use it on a copy; it has no network access and never uploads the file. Do not install it on this phone.

Limits to state in the report: no DEX or APK loader, no ARM32 or Thumb, no debugger, no type libraries or FLIRT signatures, and the pseudocode is partial (x86/x64 only, no full SSA or types). It is not a full decompiler and it does not recover original source. For an Android APK, use apktool, jadx, smali, and the native tools; for a PE or ELF on a PC, Paranoia is a fast first pass. A user-owned remote PC with the CLI can be reached with remote_put and ssh_exec; never send a sample to a third-party server.

## Backdoors and supply-chain insertions

Compare the official build with the redistributed build: signature and certificate, SHA-256, section and asset hashes, manifest and permissions, component list, native libraries, endpoints, and build metadata. An extra class, asset, native library, permission, receiver, or endpoint is a lead, not a verdict.

Look for both halves of a backdoor:

- Trigger: a date or time, a locale or country, a carrier or SIM, a device property, an installed app, a server response, a license check, a debugger or emulator check, a root check, a signature check, a first-run counter, a file marker, or a remote configuration flag.
- Action: exfiltration of contacts, SMS, call log, clipboard, files, screen, camera, microphone, or keys; an overlay or accessibility abuse; device admin; notification access; a remote shell; an install or update; a crypto miner; ransomware; a proxy; a DNS tunnel; steganography; an encrypted configuration; a kill switch.
- Evasion: packers, string encryption, control-flow flattening, virtual-machine protectors, anti-debug and anti-VM checks, certificate pinning, split payloads, dynamic loading, reflection, native code, direct syscalls, timing checks, and environment fingerprints. Name the protection only when a signature or a behavior supports it; otherwise say "custom or unknown".

A hidden branch is proven when the trigger is reached in a controlled copy and the action is observed or reconstructed. A suspicious URL alone is an indicator, not a backdoor. Report indicators (domains, IPs, paths, registry keys, certificates, mutexes, user agents, hashes) without copying a secret payload.

## Prove it and report

- Every claim gets an evidence line: address or offset, function, tool, and the bytes or output that support it. A table with Claim, Evidence, and Confidence is enough.
- A crypto recovery gets a test vector: input, key, IV, expected output, and the command that produced it. A protocol gets at least one captured message and a decoded reply.
- A backdoor gets a trigger and an action path, plus what would happen on a clean device. A packer gets a signature or an unpacking trace.
- Report the sample hash and provenance, the protection, the entry points, the call graph, the algorithms, the triggers, the indicators, the capabilities, the confidence, the commands that were not run, and the containment or removal advice.
- Keep the sample out of the project and out of the chat. Do not paste a key, a cookie, a password, or a private payload; name the field and its location instead.

## On this phone

`run_command`, `read_file`, `write_file`, `edit_file`, `grep`, `http_request`, and `load_tools` are already on every turn. Call `load_tools group=build` for `install_android_sdk`, `install_jdk`, `install_module`, and `install_program`; `group=device` for `shizuku_exec`, `install_apk`, and `open_file`; `group=study` for `capture_dump`, `read_dump`, and `net_audit`; `group=remote` only for `remote_put` and `ssh_exec` to the user's own PC. Aapt2, java, apktool, and jadx come through those installers on this phone. Keep the sample outside the project; `open_file` a report, not the sample.

## Quality gates

- Static first; dynamic only in isolation. No live command server, no credentials, no exploitation, no payment, no upload of the sample.
- A function, a key, a packer, or a backdoor is not claimed without evidence. A failed command stays failed; do not rerun it unchanged.
- Keep the original and every patched copy hashed. Patch only a copy, never the evidence.
- If the target is Android malware and no disposable device is available, stop at static analysis and say the dynamic behavior was not observed.
- When the question is only "is this APK safe to install", use android-apk; when it is "what does this program really do", stay here and go to the logic.
