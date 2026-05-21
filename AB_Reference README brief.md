# AB Reference LUFS — Quick Start

A/B comparison with auto LUFS matching. Numpad `*` = analyze, Numpad `-` = toggle.

---

## Requirements

- Bitwig Studio 5+
- [loopMIDI](https://www.tobias-erichsen.de/software/loopmidi.html)
- AutoHotkey v2
- [dpMeter](https://www.tbproaudio.de/products/dpmeter) (TBProAudio)

---

## Setup

**1. loopMIDI** — create a port named `AHK-Bitwig`, enable autostart.

**2. Script** — copy `AB_Reference.control.js` to the Controller Scripts folder.

**3. Bitwig** — Preferences → Controllers → Add → **OatmillerTools / AB Reference LUFS**.
MIDI Input = `AHK-Bitwig`.

**4. Project** — tracks top to bottom in the Arranger:
- Track 1 — Reference
- Track/Group 2 — Premaster

dpMeter is last on both tracks. Remote Controls (a preset with pre-assigned slots is included):

| Slot | Parameter |
|------|-----------|
| 0 | OUT: EBU IL |
| 5 | Reset |
| 6 | EBU Gain (Reference only) |
| 7 | Write Automation Data |

dpMeter mode: **EBU R128 Integrated**.

**5. AHK** — compile `AB_Reference.ahk` to .exe and run it. It is recommended to add it to Windows startup.
Hotkeys are active only when Bitwig is in focus.

---

## Usage

```
1. Start playback
2. Numpad *   →  analyze 20 sec (don't stop!)
3. Numpad -   →  toggle A ↔ B
```

---

## Changing hotkeys

**No numpad** — edit `AB_Reference.ahk`: replace `NumpadMult` / `NumpadSub` with the desired AHK key names (`^F1`, `!z`, `F13`, etc.), compile to .exe via Ahk2Exe or **Compile Script GUI**.

**MIDI notes** — Preferences → Controllers → AB Reference LUFS → **MIDI** section (defaults: 108 / 109). After changing, update the note numbers in the AHK script.

---

## Troubleshooting

| Problem | Solution |
|---------|---------|
| Hotkeys not working | Is AHK running? loopMIDI port created? Bitwig in focus? |
| LUFS always -70 | Remote Controls not configured or dpMeter not last |
| EBU Gain not changing | Slot 6 not assigned on Reference |
| MsgBox about MIDI | Start loopMIDI before AHK |

See `AB_Reference README.md` for more details.

---

MIT © Ivan / OatmillerTools
