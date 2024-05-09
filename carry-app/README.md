# Carry app

Welcome to Carry!

This repo contains the source code of Carry app (ReactNative, iOS and Android).

## Development setup

### Installation

```shell
> yarn install
> npx pod-install
```

### Start app

To install app on simulator (emulator), you can use following commands or open XCode and Android Studio respectively.

```shell
// iOS
> yarn ios

// Android
> yarn android --variant=DevDebug
```

In order to load the RN code, you need to bootstrap the Metro server

```shell
> yarn start
```

To connect Android emulator with Metro server, run following command:

```
adb reverse tcp:8001 tcp:8001
```

### Change config environment

To switch between `dev` and `prod` environment, you can choose below commands

```shell
// Use production config
> yarn fl:prod

// Use dev config
> yarn fl:dev
```

After running above commands, remember to build the native app again.

### Debug tools

We use [Reactotron](https://github.com/infinitered/reactotron/blob/master/docs/installing.md) to show log, inspect app network, redux store...

> In order to use Reactotron with Android emulator, remeber to run `adb reverse tcp:9090 tcp:9090`

## Tech stack

### Firebase

We heavily depend on many Firebase services in our app. 
We suggest that you should go through the document of [Firebase](https://firebase.google.com/docs?authuser=0&hl=en) first.

Below is some main services that we usually use

#### Authentication

We integrate with Fire Authentication service to provide login feature and identify our users. 

#### Database

To store user data, we use Firebase Firestore service.
This is the most important service in our app.

#### API

To interact with our server side, we use Firebase Functions service. 

### Redux

We store and sync from Firestore user data, group data and many others' data in a single Redux store.

To handle asynchronous actions, we use Redux Saga.

### Steam IO

Our app provide many chat features that empowered by [Steam IO](https://getstream.io/chat/).

### Branch IO

In order to support deep link, universal link or app link...
We use Branch IO to help us handle all the hard work.

### Tracking, analysis libraries
- AppFlyers
- Mixpanel (already removed from source code)

### Monitoring
- Smartlook