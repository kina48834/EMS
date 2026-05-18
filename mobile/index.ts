import 'react-native-get-random-values';
import 'react-native-gesture-handler';
import { registerRootComponent } from 'expo';
import React from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import App from './App';
import ErrorBoundary from './src/components/ErrorBoundary';

function Root() {
  return React.createElement(
    GestureHandlerRootView,
    { style: styles.root },
    React.createElement(
      SafeAreaProvider,
      null,
      React.createElement(ErrorBoundary, null, React.createElement(App)),
    ),
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});

registerRootComponent(Root);
