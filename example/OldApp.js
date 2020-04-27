/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow
 */

import React, {Component} from 'react';
import {Platform, StyleSheet, Text, View} from 'react-native';
import { AppRegistry,  Button, ScrollView, Image, Alert } from 'react-native';
import Example from './Example.js';

type Props = {};
export default class App extends Component<Props> {
  constructor(props) { super(props); };
  render() {
      return (
         <Example />
      );
  }
}


