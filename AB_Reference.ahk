#Requires AutoHotkey v2.0
#SingleInstance Force

portName := "AHK-Bitwig"
channel  := 0   ; MIDI ch1

midi := MidiOutOpen(portName)
if !midi
    MsgBox "MIDI output not found. Check loopMIDI: " portName

#HotIf WinActive("ahk_exe BitwigStudioApp.exe")

; Analyze LUFS (20 sec)
NumpadMult:: {
    global midi, channel
    if midi {
        MidiSendNote(midi, channel, 108, 127)
        Sleep 50
        MidiSendNote(midi, channel, 108, 0)
    }
}

; Toggle A/B
NumpadSub:: {
    global midi, channel
    if midi {
        MidiSendNote(midi, channel, 109, 127)
        Sleep 50
        MidiSendNote(midi, channel, 109, 0)
    }
}

#HotIf

; ── MIDI ──────────────────────────────────────────────────────────────────────

MidiOutOpen(nameWanted) {
    devs := ListMidiOutDevices()
    idx  := -1
    for i, name in devs {
        if (name = nameWanted) {
            idx := i - 1
            break
        }
    }
    if idx = -1 {
        for i, name in devs {
            if InStr(name, nameWanted, true) {
                idx := i - 1
                break
            }
        }
    }
    if idx = -1
        return 0
    h := 0
    if DllCall("winmm\midiOutOpen", "Ptr*", &h, "UInt", idx, "Ptr", 0, "Ptr", 0, "UInt", 0) = 0
        return h
    return 0
}

ListMidiOutDevices() {
    arr := []
    buf := Buffer(52, 0)
    Loop DllCall("winmm\midiOutGetNumDevs", "UInt") {
        DllCall("winmm\midiOutGetDevCapsA", "UInt", A_Index - 1, "Ptr", buf, "UInt", buf.Size)
        arr.Push(StrGet(buf.Ptr + 8, "CP0"))
    }
    return arr
}

MidiSendNote(hMidi, ch, note, vel) {
    status := (vel > 0 ? 0x90 : 0x80) | (ch & 0x0F)
    DllCall("winmm\midiOutShortMsg", "Ptr", hMidi, "UInt", status | (note << 8) | (vel << 16))
}
