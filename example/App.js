import { Component } from 'react';
import { AppRegistry } from 'react-native';
import Example from "./Example.js";
// import AutoTracking from "./AutoTracking.js";

// Auto Navigation Example.

class AwesomeProject extends Component {
  render() {
    return (
        <Example/>
      )
  }
}


module.exports = AwesomeProject;
AppRegistry.registerComponent('AwesomeProject', () => AwesomeProject);
