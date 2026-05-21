loadAPI(20);

host.defineController("OatmillerTools", "AB Reference LUFS", "1.0", "01234567-0123-0123-0123-0123456789ab", "Ivan");
host.defineMidiPorts(1, 0);

var referenceTrack;
var premasterTrack;
var isShowingReference = false;
var referenceMute;
var premasterMute;

var premasterDpMeter;
var referenceDpMeter;
var premasterRemotes;
var referenceRemotes;

var premasterLUFSStored = -23.0;
var referenceLUFSStored = -23.0;

var premasterWriteAuto;
var referenceWriteAuto;
var premasterILParam;
var referenceILParam;

var premasterReset;
var referenceReset;

var referenceEBUGain;

var premasterILValueLive = 0;
var referenceILValueLive = 0;
var isAnalyzing = false;

var settings = {};
var showNotifications = true;
var analyzeNote = 108;
var toggleNote  = 109;

var isPlaying = false;

function init() {
    var trackBank = host.createMainTrackBank(100, 0, 0);
    
    referenceTrack = trackBank.getItemAt(0);
    premasterTrack = trackBank.getItemAt(1);
    
    referenceMute = referenceTrack.mute();
    premasterMute = premasterTrack.mute();
    
    referenceDpMeter = referenceTrack.createCursorDevice();
    premasterDpMeter = premasterTrack.createCursorDevice();
    
    referenceDpMeter.selectLast();
    premasterDpMeter.selectLast();

    referenceDpMeter.name().addValueObserver(function(name) {
        println("REF cursor device: " + name);
    });
    premasterDpMeter.name().addValueObserver(function(name) {
        println("PRE cursor device: " + name);
    });

    premasterRemotes = premasterDpMeter.createCursorRemoteControlsPage(8);
    referenceRemotes = referenceDpMeter.createCursorRemoteControlsPage(8);
    
    // Remote 0: OUT:EBU IL (LUFS)
    premasterILParam = premasterRemotes.getParameter(0);
    referenceILParam = referenceRemotes.getParameter(0);
    
    // Remote 5: Reset
    premasterReset = premasterRemotes.getParameter(5);
    referenceReset = referenceRemotes.getParameter(5);
    premasterReset.value().markInterested();
    referenceReset.value().markInterested();

    // Remote 6: EBU Gain (Reference only)
    referenceEBUGain = referenceRemotes.getParameter(6);

    // Remote 7: Write Automation Data
    premasterWriteAuto = premasterRemotes.getParameter(7);
    referenceWriteAuto = referenceRemotes.getParameter(7);
    
    // Subscribe to LUFS values
    premasterILParam.value().addValueObserver(function(value) {
        premasterILValueLive = value;
    });

    referenceILParam.value().addValueObserver(function(value) {
        referenceILValueLive = value;
    });

    // Enable EBU Gain for Reference
    referenceEBUGain.value().markInterested();

    var prefs = host.getPreferences();
    settings.showNotifications = prefs.getBooleanSetting("Show notifications", "General", true);
    settings.showNotifications.markInterested();
    settings.showNotifications.addValueObserver(function(show) {
        showNotifications = show;
    });

    settings.analyzeNote = prefs.getNumberSetting("Analyze LUFS — MIDI note", "MIDI", 0, 127, 1, "", 108);
    settings.toggleNote  = prefs.getNumberSetting("Toggle A/B — MIDI note",   "MIDI", 0, 127, 1, "", 109);
    settings.analyzeNote.markInterested();
    settings.toggleNote.markInterested();
    settings.analyzeNote.addValueObserver(function(n) { analyzeNote = Math.round(n); });
    settings.toggleNote.addValueObserver(function(n)  { toggleNote  = Math.round(n); });

    var transport = host.createTransport();
    transport.isPlaying().addValueObserver(function(playing) {
        isPlaying = playing;
    });

    host.getMidiInPort(0).setMidiCallback(onMidi);
    
    println("===== PREMASTER dpMeter remotes =====");
    for (var i = 0; i < 8; i++) {
        var p = premasterRemotes.getParameter(i);
        p.name().addValueObserver(function(index) {
            return function(name) {
                if (name && name.length > 0) {
                    println("PREMASTER [" + index + "]: " + name);
                }
            };
        }(i));
    }
    
    println("===== REFERENCE dpMeter remotes =====");
    for (var i = 0; i < 8; i++) {
        var p = referenceRemotes.getParameter(i);
        p.name().addValueObserver(function(index) {
            return function(name) {
                if (name && name.length > 0) {
                    println("REFERENCE [" + index + "]: " + name);
                }
            };
        }(i));
    }
    
    println("========================================");
    println("AB Reference Script LOADED");
    println("========================================");
    println("MIDI Controls:");
    println("  Note 108 (C8) = Analyze LUFS (Numpad *)");
    println("  Note 109 (C#8) = Toggle A/B (Numpad -)");
    println("========================================");
}

function onMidi(status, data1, data2) {
    if (status == 144 && data2 > 0) {
        if (data1 == analyzeNote) {
            analyzeLUFS();
        } else if (data1 == toggleNote) {
            toggleAB();
        }
    }
}

function hostValueToLUFS(hostValue) {
    return hostValue * 94.0 - 70.0;
}

function dBToEBUGain(db) {
    // EBU Gain: -60 to +60 dB
    return (db + 60.0) / 120.0;
}

function notify(msg) {
    println(msg);
    if (showNotifications) {
        host.showPopupNotification(msg);
    }
}

function analyzeLUFS() {
    if (isAnalyzing) {
        notify("Already analyzing — please wait...");
        return;
    }

    if (!isPlaying) {
        notify("Start playback first!");
        return;
    }

    isAnalyzing = true;

    referenceDpMeter.selectLast();
    premasterDpMeter.selectLast();

    premasterReset.set(1.0);
    referenceReset.set(1.0);
    host.scheduleTask(function() {
        premasterReset.set(0.0);
        referenceReset.set(0.0);
    }, 100);

    println("");
    println("========================================");
    println("ANALYZING LUFS (20 seconds)...");
    println("Keep playback running for 20 seconds!");
    println("========================================");
    notify("Analyzing LUFS — 20s...");

    for (var i = 1; i <= 19; i++) {
        (function(elapsed) {
            host.scheduleTask(function() {
                if (!isAnalyzing) return;
                host.showPopupNotification((20 - elapsed) + "s...");
            }, elapsed * 1000);
        })(i);
    }

    if (premasterWriteAuto) {
        premasterWriteAuto.set(1.0);
        println("PREMASTER Write Auto: ON");
    }
    if (referenceWriteAuto) {
        referenceWriteAuto.set(1.0);
        println("REFERENCE Write Auto: ON");
    }

    host.scheduleTask(function() {
        if (!isAnalyzing) return;

        var premasterBad = hostValueToLUFS(premasterILValueLive) <= -69.9;
        var referenceBad = hostValueToLUFS(referenceILValueLive) <= -69.9;

        if (premasterBad || referenceBad) {
            var badTrack = (premasterBad && referenceBad) ? "Premaster + Reference"
                         : premasterBad ? "Premaster" : "Reference";

            if (premasterWriteAuto) {
                premasterWriteAuto.set(0.0);
                println("PREMASTER Write Auto: OFF");
            }
            if (referenceWriteAuto) {
                referenceWriteAuto.set(0.0);
                println("REFERENCE Write Auto: OFF");
            }

            notify("No sound on " + badTrack + " → Check if there is sound playing, if there is — deactivate and reactivate dpMeter on that track");
            isAnalyzing = false;
        }
    }, 2000);

    host.scheduleTask(function() {
        if (!isAnalyzing) return;

        premasterLUFSStored = hostValueToLUFS(premasterILValueLive);
        referenceLUFSStored = hostValueToLUFS(referenceILValueLive);

        if (premasterWriteAuto) {
            premasterWriteAuto.set(0.0);
            println("PREMASTER Write Auto: OFF");
        }
        if (referenceWriteAuto) {
            referenceWriteAuto.set(0.0);
            println("REFERENCE Write Auto: OFF");
        }

        var premasterBad = premasterLUFSStored <= -69.9;
        var referenceBad = referenceLUFSStored <= -69.9;

        if (premasterBad || referenceBad) {
            var badTrack = (premasterBad && referenceBad) ? "Premaster + Reference"
                         : premasterBad ? "Premaster" : "Reference";
            notify("No sound on " + badTrack + " → Check if there is sound playing, if there is — deactivate and reactivate dpMeter on that track");
            isAnalyzing = false;
            return;
        }

        var delta = premasterLUFSStored - referenceLUFSStored;

        println("");
        println("Analysis complete!");
        println("  PREMASTER: " + premasterLUFSStored.toFixed(2) + " LUFS");
        println("  Reference: " + referenceLUFSStored.toFixed(2) + " LUFS");
        println("  Delta: " + delta.toFixed(2) + " dB");
        println("Ready! Press Numpad - to toggle A/B");
        println("========================================");
        println("");

        notify(
            "Done  PRE " + premasterLUFSStored.toFixed(1) +
            " / REF " + referenceLUFSStored.toFixed(1) +
            " LUFS  (" + (delta >= 0 ? "+" : "") + delta.toFixed(1) + " dB)"
        );

        isAnalyzing = false;

    }, 20000);
}

function toggleAB() {
    if (isAnalyzing) {
        notify("Analyzing — wait for it to finish");
        return;
    }

    if (!isShowingReference) {
        isShowingReference = true;
        premasterMute.set(true);
        referenceMute.set(false);
        matchByLUFS(premasterLUFSStored);
        println(">>> Switched to REFERENCE (B)");
        notify("[ B ]  Reference");
    } else {
        isShowingReference = false;
        premasterMute.set(false);
        referenceMute.set(true);
        println(">>> Switched to PREMASTER (A)");
        notify("[ A ]  Premaster");
    }
}

function matchByLUFS(targetLUFS) {
    var refLUFS = referenceLUFSStored;

    if (refLUFS > -70 && targetLUFS > -70) {
        var deltaLUFS = targetLUFS - refLUFS;
        var newGainHostValue = Math.max(0.0, Math.min(1.0, dBToEBUGain(deltaLUFS)));

        println("MATCHING LUFS:");
        println("  PREMASTER: " + targetLUFS.toFixed(2) + " LUFS");
        println("  Reference: " + refLUFS.toFixed(2) + " LUFS");
        println("  Delta: " + deltaLUFS.toFixed(2) + " dB -> EBU Gain " + deltaLUFS.toFixed(2) + " dB");

        referenceEBUGain.set(newGainHostValue);

    } else {
        notify("No LUFS data — press Numpad * to analyze first");
    }
}

function exit() {
    println("AB Reference Script Exited");
}