---
name: net-map
description: "Use this when a network must be understood from the machine itself: adapters, routes, DNS, open listeners, reachability, or a packet capture."
---

# Map a network from this machine

Use this when the user asks what is on the network, why a host is unreachable, or which ports a process listens on. Switch it off when the task is not about networking.

1. Inventory first, with `pwsh`: `Get-NetAdapter`, `Get-NetIPConfiguration`, `Get-NetRoute -DestinationPrefix 0.0.0.0/0`. Record the interface, its address, the gateway, and the DNS servers — a missing default route explains most failures.
2. Resolve and probe: `Resolve-DnsName <host>` for names, `Test-NetConnection <host> -Port <port>` for TCP, `Test-Connection <host> -Count 2` for ICMP. A DNS failure is the answer; do not retry the connection.
3. List local listeners with `Get-NetTCPConnection -State Listen | Sort-Object LocalPort` and match the owning process with `Get-Process -Id <pid>`. Do not print a process command line that may contain a credential.
4. For a capture, use the built-in `pktmon` (`pktmon start --capture --pkt-size 128 --file-name net.etl`, then `pktmon stop`) or `netsh trace`; read the summary before the raw bytes. Never record another person's device.
5. Report one line per fact: target, what was tried, the exact result, and the next action. Mark a guess as a guess. Stop at the first permission or policy denial and say which one.
