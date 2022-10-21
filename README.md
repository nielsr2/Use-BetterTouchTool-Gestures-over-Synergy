# Use-BetterTouchTool-Gestures-over-Synergy
a node-js solution that watched for changes to the Synergy log-file (i.e., cursor entering/leaving), set a BTT variable accordingly, in order to trigger desired actions to the corresponding computer.

Want to send gestures or other commands to another mac using [Synergy](https://symless.com/synergy)?

(NOTE: [Barrier](https://github.com/debauchee/barrier) hasn't been checked, but due to the similarities between it and synergy, I believe it should work, possibly with some minor changes)

## Overview

This solution uses a NodeJS-script to watch for changes to the synergy log-file. When changes occur (i.e. cursor entering/leaving), a BetterTouchTool variable gets updated.  This can then be checked against in order to an action on the cursor-active computer.

This guide shows you how to setup only a single trigger (4 finger swipe up -> maximize window), but you can customize it to your needs.

**Remember to use 'shared secret's for BTT if safety is a concern**

## Guide

**BetterTouchTool**:

**On Host:**
Add a variable to your BTT user variables plist
(~/Library/Application Support/BetterTouchTool/btt_user_variables. plist)
NOTE: can only be edited when BTT is closed.

Use software like Plistedit Pro (create a variable called 'synergy', with a string-type value), or just replace the file with:

```plist
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>synergy</key>
	<string>1</string>
</dict>
</plist>

```



**On both computers:**
	- create named triggers for some action (e.g. maximize window)
```json

[
  {
    "BTTTriggerType" : 643,
    "BTTTriggerTypeDescription" : "Named Trigger: max",
    "BTTTriggerClass" : "BTTTriggerTypeOtherTriggers",
    "BTTPredefinedActionType" : 21,
    "BTTPredefinedActionName" : "Maximize Window",
    "BTTTriggerName" : "max",
    "BTTEnabled2" : 1,
    "BTTAlternateModifierKeys" : 0,
    "BTTRepeatDelay" : 0,
    "BTTUUID" : "E678811C-7FD3-465B-AC6B-D95FC3468C63",
    "BTTNotesInsteadOfDescription" : 0,
    "BTTEnabled" : 1,
    "BTTModifierMode" : 0,
    "BTTOrder" : 12,
    "BTTDisplayOrder" : 0
  }
]

```
- Ensure that webserver is enabled on bother computers, and note the clients IP for the next step.

**On Host:**
create a action for e.g. 4-finger swipe up call the following applescript (async in background) :

```applescript
tell application "BetterTouchTool"
	set syn to get_string_variable "synergy"

	if syn is equal to "0" then
    do shell script "curl http://YOURCLIENTIP:50019/trigger_named/?trigger_name=max"

	else
    tell application "BetterTouchTool"
			trigger_named "max"
		end tell
	end if
end tell
```

**In Synergy:**
- Ensure that Synergy saves info-level logs to file, and take note of the path

**NodeJS Script:**
- Update the folder path of the nodejs index.js
- cd into folder, npm install, and run it!
- If you want the script to start on boot, [read this](https://stackoverflow.com/questions/60699738/how-to-start-node-js-server-on-each-system-boot-in-mac-and-windows)


# DISCLAIMER
* I haven't throughly tested this yet. You might wanna disable/backup your current BTT-settings.
