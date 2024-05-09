#!/usr/bin/env bash

BUILD_MODE=dev

if [[ "$APPCENTER_BUILD_MODE" == "prod" ]]; then
  BUILD_MODE=prod
fi

echo "Installing gem dependencies..."
bundle install

echo "Remove SmartLook podspec to prevent crash when building on AppCenter"
rm -rf node_modules/smartlook-react-native-wrapper/smartlook-react-native-bridge.podspec

if [ "$BUILD_MODE" == "prod" ]; then
  echo "Config production mode"
else
  echo "Config development mode"

  echo "Config RN entry file"
  export ENTRY_FILE=index.internal.js
fi
