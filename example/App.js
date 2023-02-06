import React, { Component } from 'react';
import { AppRegistry } from 'react-native';
import Example from './Example.js';

class AwesomeProject extends Component {
    render() {
        return (
            <Example />
        );
    }
}

module.exports = AwesomeProject;
AppRegistry.registerComponent('AwesomeProject', () => AwesomeProject);
