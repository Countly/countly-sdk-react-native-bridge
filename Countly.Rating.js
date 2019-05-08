import React, { Component } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
} from 'react-native';
import Modal from 'react-native-modal';
import PropTypes from 'prop-types'; // eslint-disable-line import/no-extraneous-dependencies
import Countly from './Countly';

const styles = StyleSheet.create({
  modalContent: {
    backgroundColor: 'white',
    padding: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  selectedColor: {
    color: '#FF4946',
  },
  unSelectedColor: {
    color: '#999999',
  },
});

export default class StarRating extends Component {
  constructor(props) {
    super(props);
    this.state = {
      noOfStarsSelected: 0,
      selected: false,
    };
  }

  starsSelected = (stars) => {
    if (this.state.selected && stars === this.state.noOfStarsSelected) {
      this.setState({ noOfStarsSelected: 0, selected: false });
    } else {
      this.setState({ noOfStarsSelected: stars, selected: true });
    }
  }

  stars = (starColor, i) => (
    <View key={i} style={{ paddingHorizontal: 8 }}>
      <TouchableOpacity activeOpacity={0.20} onPress={() => this.starsSelected(i)}>
        <Text style={[starColor, { fontSize: 40 }]}>{'\u2605'}</Text>
      </TouchableOpacity>
    </View>
  )

  starRating = () => {
    if (this.state.noOfStarsSelected > 0) {
      Countly.starRating(this.state.noOfStarsSelected);
    }
    this.setState({ noOfStarsSelected: 0 });
    this.props.hideStar();
  }

  render() {
    const TotalStars = [];
    for (let i = 0; i < this.props.noOfStars; i += 1) {
      TotalStars.push(i + 1);
    }
    return (
      <View style={{ flex: 1 }}>
        <Modal isVisible={this.props.isVisible}>
          <View style={styles.modalContent}>
            <Text style={{ color: '#000', fontSize: 22 }}>{this.props.message}</Text>
            <View style={{ flexDirection: 'row', paddingVertical: 20 }}>
              {
                TotalStars.map((i) => {
                  let starColor = styles.unSelectedColor;
                  if (i <= this.state.noOfStarsSelected) {
                    starColor = styles.selectedColor;
                  }
                  return (this.stars(starColor, i));
                })
              }
            </View>
            <TouchableOpacity style={{ paddingTop: 10 }} onPress={() => this.starRating()}>
              <Text style={{ color: '#6ba7ff', fontSize: 22 }}>{this.props.dismissButtonTitle}</Text>
            </TouchableOpacity>
          </View>
        </Modal>
      </View>
    );
  }
}

StarRating.propTypes = {
  isVisible: PropTypes.bool.isRequired,
  message: PropTypes.string,
  dismissButtonTitle: PropTypes.string,
  hideStar: PropTypes.func.isRequired,
  noOfStars: PropTypes.number,
};

StarRating.defaultProps = {
  noOfStars: 5,
  message: 'How would you rate the app?',
  dismissButtonTitle: 'Dismiss',
};