---
allowed-tools: Bash, mcp__mobile__mobile_use_device, mcp__mobile__mobile_list_available_devices
---

# Start Android Emulator

Start the Android emulator for development and testing.

This command will:

1. Start the Android emulator with the Medium_Phone_API_36.0 AVD
2. Wait for it to boot up completely
3. Connect to it using the mobile tools

Usage: `/start-emulator`

## Implementation

```bash
# Start the emulator in the background
/mnt/c/Users/user/AppData/Local/Android/Sdk/emulator/emulator.exe -avd Medium_Phone_API_36.0 &

# Wait for emulator to start
sleep 30

# Check devices and connect
/mnt/c/Users/user/AppData/Local/Android/Sdk/platform-tools/adb.exe devices

# Connect using mobile tools
# Use mcp__mobile__mobile_use_device with device="emulator-5554" and deviceType="android"
# Once device is confirmed running, kill this bash instance using KillBash tool
```
