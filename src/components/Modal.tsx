import React from 'react';
import {StyleSheet, Animated, Keyboard, Easing} from 'react-native';

type setContentsFunc = (
  contents: React.ReactNode,
  onClose?: () => any,
  unregisterOnClose?: boolean,
) => any;

interface Props {
  id: number;
}
interface State {
  visible: boolean;
  bOpacity: Animated.AnimatedInterpolation; // backdrop opacity
  cScale: Animated.Value; // child scale
  child: React.ReactNode;
  onClose: () => void;
  kbListeners: {show: any; hide: any};
  kbIsUp: boolean;
  unregisterOnClose: boolean;
}

export default class Modal extends React.Component<Props, State> {
  static inst: Modal[] = [null as unknown as Modal, null as unknown as Modal];

  constructor(props: Props) {
    super(props);

    const cScale = new Animated.Value(0);

    this.state = {
      visible: false,
      cScale: cScale,
      bOpacity: cScale.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 1],
      }),
      child: <></>,
      onClose: () => {},
      kbListeners: {show: null, hide: null},
      kbIsUp: false,
      unregisterOnClose: true,
    };

    Modal.inst[props.id] = this;
  }

  componentDidMount() {
    this.setState(prevState => ({
      ...prevState,
      kbListeners: {
        show: Keyboard.addListener('keyboardDidShow', () =>
          this._setKbIsUp(true),
        ),
        hide: Keyboard.addListener('keyboardDidHide', () =>
          this._setKbIsUp(false),
        ),
      },,
    }));
  }

  componentWillUnmount() {
    this.state.kbListeners.show.remove();
    this.state.kbListeners.hide.remove();
  }

  _setKbIsUp = (isUp: boolean) => {
    this.setState(prevState => ({...prevState, kbIsUp: isUp}));
  };

  _setVisible = (visible: boolean) => {
    this.setState(prevState => ({...prevState, visible: visible}));
  };

  isVisible = () => {
    return this.state.visible;
  };

  backdropDismiss = () => {
    if (!this.state.kbIsUp)
      {this.hide();} // Only dismiss backdrop on touch if keyboard is down
    else {
      Keyboard.dismiss();
    }
  };

  show = (doShow = true) => {
    if (doShow) {
      this._setVisible(true);
    }

    Animated.timing(this.state.cScale, {
      toValue: doShow ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
      easing: doShow ? Easing.out(Easing.exp) : Easing.in(Easing.quad),
    }).start(() => {
      if (!doShow) {
        this._setVisible(false);
        this.state.onClose();
        this.state.unregisterOnClose && this.reset();
      }
    });
  };

  hide = () => {
    this.show(false);
  };

  setContents: setContentsFunc = (
    contents,
    onClose = () => {},
    unregisterOnClose = true,
  ) => {
    this.setState(prevState => ({
      ...prevState,
      child: contents,
      onClose: onClose,
      unregisterOnClose: unregisterOnClose,
    }));
  };

  showContents: setContentsFunc = (
    contents,
    onClose = () => {},
    unregisterOnClose = true,
  ) => {
    this.setContents(contents, onClose, unregisterOnClose);
    this.show();
  };

  reset = () => {
    this.setState(prevState => ({
      ...prevState,
      child: <></>,
      onClose: () => {},
    }));
  };

  render() {
    if (!this.state.visible) {
      return <></>;
    }

    return (
      <>
        {/* MODAL BACKDROP */}
        <Animated.View
          style={[styles.backdrop, {opacity: this.state.bOpacity}]}
          onTouchStart={() => this.backdropDismiss()}
        />

        <Animated.View
          pointerEvents="box-none"
          style={[styles.container, {transform: [{scale: this.state.cScale}]}]}>
          {this.state.child}
        </Animated.View>
      </>
    );
  }
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
  },
  container: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
