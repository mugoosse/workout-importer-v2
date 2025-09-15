---
allowed-tools: Bash, mcp__mobile__mobile_use_device, mcp__mobile__mobile_list_available_devices
---

# Start Android Emulator

Start the Android emulator for development and testing.

This command will:

1. Start the Android emulator with the Medium_Phone_API_36.0 AVD
2. Wait for it to boot up completely
3. Connect to it using the mobile tools

Usage: `/start-android-emulator`

## Implementation

```bash
# First, try to start with Medium_Phone_API_36.0
echo "Attempting to start emulator with Medium_Phone_API_36.0..."
emulator -avd Medium_Phone_API_36.0 &

# Check if the emulator started successfully
sleep 5
if ! pgrep -f "emulator.*Medium_Phone_API_36.0" > /dev/null; then
    echo "Medium_Phone_API_36.0 not found, listing available AVDs..."
    
    # List available AVDs
    emulator -list-avds
    
    # Get the first available AVD name
    AVD_NAME=$(emulator -list-avds | head -n 1)
    
    if [ -n "$AVD_NAME" ]; then
        echo "Starting emulator with AVD: $AVD_NAME"
        emulator -avd "$AVD_NAME" &
    else
        echo "No AVDs found. Please create an AVD first."
        exit 1
    fi
fi

# Wait for emulator to start
sleep 30

# Check devices and connect using the WSL path for adb
adb devices

# Connect using mobile tools
# Use mcp__mobile__mobile_use_device with device="emulator-5554" and deviceType="android"
# Once device is confirmed running, kill this bash instance using KillBash tool
```
