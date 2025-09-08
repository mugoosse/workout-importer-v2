# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   bun install
   ```

2. Install mobile MCP for development

   For macOS:

   ```bash
   claude mcp add mobile --env ANDROID_HOME=/Users/mgo/Library/Android/sdk -- npx -y @mobilenext/mobile-mcp@latest
   ```

   For Windows with WSL:

   ```bash
   claude mcp add mobile --env ANDROID_HOME=/mnt/c/Users/user/AppData/Local/Android/Sdk -- npx -y @mobilenext/mobile-mcp@latest
   ```

   More info: https://github.com/mobile-next/mobile-mcp

3. Run prebuild (if needed for native code)

   ```bash
   bun prebuild
   ```

4. Start the backend (Convex)

   ```bash
   bun convex:dev
   ```

5. Start the app

   ```bash
   bun start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

## Import test data

To import test todo list data into Convex:

```bash
bun convex import --table tasks sampleData.jsonl
```

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
bun reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
