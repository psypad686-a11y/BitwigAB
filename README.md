# AB Reference LUFS

A Bitwig Studio controller script. A/B comparison of your mix against a reference track with automatic LUFS matching.

---

## How it works

1. **Two tracks** — Reference (track 1) and Premaster (track 2) — both with dpMeter last in the chain.
2. **Analyze** (Numpad `*`): starts a 20-second timer. The script reads the Integrated LUFS of both tracks.
3. **Toggle** (Numpad `-`): mutes one track, unmutes the other. When switching to Reference, EBU Gain is automatically set to match the Premaster loudness.

`EBU Gain = LUFS(Premaster) − LUFS(Reference)`

---

## Requirements

| Component | Version |
|-----------|---------|
| Bitwig Studio | 5.0+ |
| [loopMIDI](https://www.tobias-erichsen.de/software/loopmidi.html) | any |
| [AutoHotkey](https://www.autohotkey.com/) | v2.0+ |
| [dpMeter](https://www.tbproaudio.de/products/dpmeter) (TBProAudio) | any |

---

## Installation

### 1 — loopMIDI

1. Install [loopMIDI](https://www.tobias-erichsen.de/software/loopmidi.html).
2. Create a port named **`AHK-Bitwig`** (case-sensitive).
3. Enable autostart: Options → Autostart.

> The port name must match the `portName := "AHK-Bitwig"` string in the AHK script.

### 2 — Controller script

1. Copy `AB_Reference.control.js` to your Controller Scripts folder:
   ```
   %USERPROFILE%\Documents\Bitwig Studio\Controller Scripts\
   ```
2. Restart Bitwig.
3. Preferences → Controllers → Add → **OatmillerTools / AB Reference LUFS**.
4. MIDI Input = `AHK-Bitwig`, MIDI Output = not needed.
5. It is recommended to add `AB_Reference.exe` to Windows startup — it is active only when Bitwig is running, so it won't interfere with anything else.

### 3 — Track layout

The script reads tracks by position in the project:

| Position | Role |
|----------|------|
| Track 1 (index 0) | Reference |
| Track/Group 2 (index 1) | Premaster (any name) |

> Counted top to bottom in the Arranger, including Group tracks.

### 4 — dpMeter Remote Controls

dpMeter must be the **last** device on each track. Assign Remote Controls slots (a preset with pre-assigned slots is included):

| Slot | Parameter |
|------|-----------|
| 0 | **OUT: EBU IL** (Integrated LUFS) |
| 5 | **Reset** |
| 6 | **EBU Gain** *(Reference track only)* |
| 7 | **Write Automation Data** |

Make sure dpMeter is set to **EBU R128 Integrated** mode.

### 5 — AutoHotkey

Compile `AB_Reference.ahk` and run the resulting .exe.
Hotkeys are active only when Bitwig is in focus.

It is recommended to add the script to Windows startup (`shell:startup`).

---

## Usage

```
1. Start playback
2. Numpad *  →  analyze (20 sec, don't stop!)
3. Numpad -  →  toggle A ↔ B
```

| Key | Action |
|-----|--------|
| Numpad `*` | Start LUFS analysis (20 sec) |
| Numpad `-` | Toggle Premaster (A) ↔ Reference (B) |

---

## Changing hotkeys

Numpad is used by default. If you don't have a numpad, there are ways to remap.

### Editing the AHK script

Open `AB_Reference.ahk` in any text editor and find these lines:

```ahk
; Analyze LUFS (20 sec)
NumpadMult:: {

; Toggle A/B
NumpadSub:: {
```

Replace `NumpadMult` / `NumpadSub` with the desired keys:

| Key | AHK name |
|-----|----------|
| F13–F24 | `F13`, `F14`, … |
| Ctrl+F1 | `^F1` |
| Alt+Z | `!z` |
| Ctrl+Alt+Z | `^!z` |

Save and compile the script to .exe.

### AHK modifier key syntax

| Modifier | AHK symbol |
|----------|------------|
| Ctrl | `^` |
| Alt | `!` |
| Shift | `+` |
| Right Ctrl | `>^` |
| Right Alt | `>!` |
| Right Shift | `>+` |
| Right Win | `>#` |

---

### You can also configure which MIDI notes Bitwig listens to from the AHK-Bitwig port.

Preferences → Controllers → AB Reference LUFS → **MIDI** section:

| Setting | Default |
|---------|---------|
| Analyze LUFS — MIDI note | 108 |
| Toggle A/B — MIDI note | 109 |

Change the values. Then update the note numbers in the AHK script (`MidiSendNote(midi, channel, 108, ...)` / `109`) and compile a new .exe with the same name.

After editing, run the `.ahk` file by double-clicking (AutoHotkey must be installed).

#### Compiling to .exe

1. Run `Ahk2Exe.exe` from `C:\Program Files\AutoHotkey\Compiler\`.
2. Source: `AB_Reference.ahk` → Destination: `AB_Reference.exe` → **Convert**.
3. Run the resulting .exe to activate the script. This .exe can also be added to Windows startup.

Or: right-click the `.ahk` file → **Compile Script GUI**.

---

## Limitations

- The Reference and Premaster tracks must be at positions 1 and 2 in the project.
- Analysis requires 20 seconds of uninterrupted playback.
- When switching to Reference, EBU Gain changes and may be written to automation — disable automation recording in Bitwig before toggling.
- dpMeter must remain the last device in the chain.

---

## Troubleshooting

`View → Control Surface Console`:

| Message | Meaning |
|---------|---------|
| `REF cursor device: dpMeter` | Cursor is on the correct device |
| `PREMASTER [0]: OUT:EBU IL` | Remote Controls are configured correctly |
| `Analysis complete!` | Analysis done, ready to toggle |
| `No LUFS data` | Analysis not run — press Numpad * |

**Hotkeys not working** → Is AHK running? Is the loopMIDI port created? Is Bitwig in focus?

**LUFS always -70** → Remote Controls not configured or dpMeter is not last in the chain.

**EBU Gain not changing** → Slot 6 not assigned on the Reference track.

---

## License

MIT — free to use, modify, and distribute with copyright notice preserved.  
© Ivan / OatmillerTools
