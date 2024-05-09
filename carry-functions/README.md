## Setup Firebase Emulator

```shell
yarn db:dev:export
firebase emulators:start --only firestore --import=./dirs --export-on-exit
yarn db:emulator:import
```

## DEV

```
firebase use dev
server=https://chat-proxy-singapore.stream-io-api.com
```

## DEPLOY

### Only 1 function

```
firebase deploy --only functions:storage_onFinalize
firebase deploy --only functions:hook_streamIO
firebase deploy --only functions:hook_apple_iap
firebase deploy --only functions:group_onUpdate
firebase deploy --only functions:goal_onCreate
firebase deploy --only functions:user_onUpdate
firebase deploy --only functions:period_onCreate
firebase deploy --only functions:func_invite_get
firebase deploy --only functions:func_invite_get
firebase deploy --only functions:auth_onCreate
firebase deploy --only functions:follow_ups_onCreate,functions:follow_ups_onUpdate
```

### Only functions

```
firebase deploy --only functions
```
