# Network study

Use this when the user wants to learn how a network works, see a topology, follow a packet, practice subnetting, or troubleshoot a network with a drawing. A real packet capture is net-map; a codebase map is understand-anything; this skill teaches with a visual card in the chat.

The visual reference is Computer-Network (MIT, github.com/Khumorov/Computer-Network): a browser canvas with computers, laptops, printers, repeaters, routers, cables, and labels. Do not copy its code or assets. The chat card uses the same calm, readable idea.

## Draw one card

Call `network_card` with a title and 1 to 8 devices. It returns the `html` block the chat draws; include that block unchanged. Never write SVG or HTML by hand, and never paste markup into the chat. If the tool returns an error, fix a node id, a kind, or a link and call it again.

The tool takes:

- `nodes`: `id`, `label`, `kind` (cloud, router, firewall, modem, switch, ap, pc, laptop, phone, printer, server), and optional `ip`.
- `links`: `from`, `to`, optional `label`, `kind` (copper, wifi, fiber), and `path` true for the packet path.
- `title`, optional `takeaway`, optional `question`, optional `subnet` as a CIDR label.

Example for a home network:

```
title: Домашняя сеть: путь запроса
nodes:
  net  Интернет  cloud
  r1   Роутер    router  192.168.1.1/24
  sw   Коммутатор switch
  pc   PC        pc      192.168.1.10
links:
  net -> r1  WAN   copper  path
  r1  -> sw  LAN   copper
  sw  -> pc  eth0  copper
subnet: 192.168.1.0/24
takeaway: Пакет идёт на шлюз; роутер меняет источник через NAT.
question: Что изменится, если PC окажется в другой подсети?
```

One idea per card. At most 8 devices and 12 links. One label per link; the tool places label plates and path numbers. Put the Internet at the top, the LAN at the bottom, and a dashed subnet boundary around the hosts. A second idea is a second card, not a longer first card.

The tool draws original line glyphs, a dot grid, a legend, and the packet path. Do not ask it for a poster: a 720×420 card with six devices is the target. If the card is crowded, remove a device or a label and call it again.

A larger or interactive canvas is optional. Write `network.html` with `write_file` when the user wants to drag devices, draw cables, edit labels, and save the result. Use vanilla JavaScript, inline CSS, no external assets, and localStorage for save/load. It is inspired by Computer-Network, not a copy. Open it with `open_file` (call `load_tools group=device` first); Android shows the Open with chooser, so choose a browser. The chat card remains the in-app visual.

## Teach one thing

1. Ask the learner's level and goal in one line: a beginner, a student before an exam, or an engineer debugging a real network.
2. Pick one idea: a topology, a layer, a subnet, a packet journey, a protocol, or a fault.
3. Ask for a prediction before the answer: "what does the laptop send first?", "which device changes the source IP?", "is 192.168.1.200 in this subnet?"
4. Draw the card, then explain in short paragraphs tied to the drawing. Point to a device or a label, not to an abstract sentence.
5. Give one small task: label a cable, choose the gateway, split a subnet, or find the broken link.
6. Check the answer, correct one misconception, and stop. A second idea is a second card.

For a multi-lesson course, use `use_skill learn` and keep one network card per lesson. The learner answers before the explanation.

## Concepts that draw well

- Layers and encapsulation: a vertical stack of application, transport, network, link, physical; a packet with headers added at each layer; the PDU name at each step.
- Devices: hub, switch, router, access point, firewall, modem; what each forwards on (bits, frames, packets), and the collision and broadcast domains.
- Ethernet and ARP: a frame, a MAC table, a broadcast ARP request, a unicast reply, and the switch port learned from the source MAC.
- IPv4 and subnetting: a 32-bit bar split into network and host bits; network, first host, last host, broadcast, mask, and CIDR; a table of two or three subnets. Check the arithmetic before sending.
- Routing and NAT: a host, its default gateway, a router with two interfaces, a source NAT translation, and the return path. Separate the private and public addresses.
- DNS and DHCP: the four DHCP messages, the DNS query and answer, the resolver, and the TTL. Show which device asks and which answers.
- TCP and UDP: a handshake, a data segment, an acknowledgement, a retransmission; a UDP datagram with no handshake. Do not claim a real capture unless you have one.
- Wi-Fi and VLANs: an access point, a SSID, a wireless link, a VLAN trunk, and an access port. Mark wireless as dashed.
- Security and troubleshooting: a firewall rule, a TLS handshake, a captive portal, a duplicate address, a wrong mask, a missing route, a bad cable. Put a red X on the first broken step, not on every step.

## Use real data carefully

- For the current LAN, call `load_tools group=study`, then `net_audit`; for a capture, `capture_dump` and `read_dump`; for a pcap map, use `net-map`.
- Label every value as **observed**, **from the user**, or **example**. Do not present an example as the user's live network.
- Do not scan a network, open a port, or capture traffic without the user's consent. Do not expose another device's name, MAC, or traffic in a card. Do not copy a cookie, a password, a payload, or a private key.
- A real topology may be incomplete; say what was not seen instead of inventing the missing link.

## Quality gates

- The drawing matches the words: same devices, same addresses, same path. A packet path starts at a host, names every hop, and ends at a host or a service.
- Physical and logical views are separate when both are needed. A switch does not change an IP address; a router does not forward a frame unchanged across a broadcast domain.
- Every subnet calculation is checked twice. Every IP and MAC comes from the user, the capture, or an explicit example.
- No attack instructions, no credential capture, no deauthentication, no port scan, no exploitation. This is a learning and documentation skill.
- If the card would exceed 8 devices, split it. If the learner is lost, remove a device and redraw.

## Output order

1. One `network_card` card with the drawing, a one-sentence takeaway, and one question.
2. Optional `network.html` for a larger interactive canvas, then `open_file`.
3. One short next step: the answer to check, a practice task, or the next card.
