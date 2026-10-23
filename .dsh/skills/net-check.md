# Check network reachability

Use this when a request depends on the network: a download fails, an update does not arrive, an API call times out, or the user asks whether a host, DNS, port, or TLS endpoint is reachable.

1. Name the target: host, port, protocol, and the exact operation that failed (download, update check, API call).
2. Resolve the name first: run `Resolve-DnsName <host>` (PowerShell) or `nslookup <host>`. A resolution failure is the answer; do not retry the connection.
3. Test the transport: `Test-NetConnection <host> -Port <port>` for TCP, or `curl.exe -sSI --max-time 15 https://<host>/` for HTTPS. Record status, certificate, and timing.
4. Separate local causes from remote ones: check proxy variables, VPN/DNS settings, and whether the same URL fails in a second client (browser or `curl`).
5. Report one line per check: target, what was attempted, the exact result, and the next action. A failed check is not retried unchanged.
6. When the failure is remote and reproducible, attach the command and its output; do not summarize a network error without its code.
