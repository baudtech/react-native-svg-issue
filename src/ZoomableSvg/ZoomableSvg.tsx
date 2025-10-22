import {forwardRef, useEffect, useImperativeHandle} from 'react';
import {View} from 'react-native';
import {Gesture, GestureDetector} from 'react-native-gesture-handler';
import Animated, {
  useAnimatedProps,
  useSharedValue,
} from 'react-native-reanimated';
import {G, Svg} from 'react-native-svg';

import {
  HotspotOffset,
  initialPosition,
  MaxViewportZoom,
  MaxZoom,
  MinZoom,
  Speed,
} from './ZoomableSvg.constants';
import {styles} from './ZoomableSvg.styles';
import type {
  Position,
  ZoomableSvgProps,
  ZoomableSvgRef,
} from './ZoomableSvg.types';
import {runOnJS, runOnUI} from 'react-native-worklets';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

const AnimatedG = Animated.createAnimatedComponent(G);

const ZoomableSvg = forwardRef<ZoomableSvgRef, ZoomableSvgProps>(
  (props, ref) => {
    const {
      height,
      width,
      initialViewport,
      viewBoxSizeX,
      viewBoxSizeY,
      content,
      onZoomChanged,
    } = props;

    const position = useSharedValue<Position>(initialPosition);
    const savedPosition = useSharedValue<Position>(initialPosition);
    const scale = useSharedValue<number>(1);
    const savedScale = useSharedValue<number>(1);
    const origin = useSharedValue<Position>(initialPosition);

    const insets = useSafeAreaInsets();

    const clamp = (value: number, min: number, max: number): number => {
      'worklet';
      return Math.min(Math.max(value, min), max);
    };

    const clampPosition = (x: number, y: number, scale: number): Position => {
      'worklet';
      const clampedX = clamp(x, -(viewBoxSizeX * scale - viewBoxSizeX), 0);

      const clampedY = clamp(y, -(viewBoxSizeY * scale - viewBoxSizeY), 0);

      return {x: clampedX, y: clampedY};
    };

    const updateScaleAndPosition = (
      newScale: number,
    ): {scale: number; position: Position} => {
      'worklet';

      const scaleOffset = savedScale.value - newScale;
      scale.value = newScale;

      const x = savedPosition.value.x + origin.value.x * scaleOffset;
      const y = savedPosition.value.y + origin.value.y * scaleOffset;

      const newPosition = clampPosition(x, y, newScale);
      position.value = newPosition;

      return {scale: newScale, position: newPosition};
    };

    const saveScaleAndPosition = (
      newScale?: number,
      newPosition?: Position,
    ): void => {
      'worklet';
      savedScale.value = newScale ?? scale.value;
      savedPosition.value = newPosition ?? position.value;
    };

    const zoomToHotspot = (scale: number, x: number, y: number): void => {
      'worklet';
      origin.value = {x, y};
      const {scale: newScale, position: newPosition} =
        updateScaleAndPosition(scale);
      saveScaleAndPosition(newScale, newPosition);
    };

    useImperativeHandle(ref, () => ({
      zoomToHotspot(scale: number, x: number, y: number) {
        runOnUI(zoomToHotspot)(scale, x, y);
      },
    }));

    useEffect(() => {
      if (initialViewport) {
        const newScale = MaxViewportZoom;
        scale.value = newScale;
        savedScale.value = newScale;

        const x = -initialViewport.left + HotspotOffset;
        const y = -initialViewport.top + HotspotOffset;

        // viewBoxSize/2 is the max value for scale = 1.5
        const clampedX = clamp(x, -(viewBoxSizeX / 2), 0);
        const clampedY = clamp(y, -(viewBoxSizeY / 2), 0);

        const newPosition = {
          x: clampedX,
          y: clampedY,
        };
        position.value = newPosition;
        savedPosition.value = newPosition;
      }
    }, [initialViewport]);

    const pan = Gesture.Pan()
      .maxPointers(1)
      .onUpdate(e => {
        const speed = clamp(MaxZoom - savedScale.value, 2, 5) * Speed;
        const x = savedPosition.value.x + e.translationX * speed;
        const y = savedPosition.value.y + e.translationY * speed;

        position.value = clampPosition(x, y, savedScale.value);
      })
      .onEnd(e => {
        savedPosition.value = position.value;
        console.log('position:', position.value);
      });

    const pinch = Gesture.Pinch()
      .onStart(e => {
        origin.value = {
          x: (e.focalX / width) * viewBoxSizeX,
          y: (e.focalY / height) * viewBoxSizeY,
        };
      })
      .onUpdate(e => {
        const newScale = clamp(savedScale.value * e.scale, MinZoom, MaxZoom);

        updateScaleAndPosition(newScale);
        runOnJS(onZoomChanged)(newScale);
      })
      .onEnd(() => {
        saveScaleAndPosition();
      });

    //transform: `translate(${position.value.x}, ${position.value.y}) scale(${scale.value})`,
    //const animatedProps = useAnimatedProps(() => {
    //   if (Platform.OS === 'ios') {
    //     // iOS (Fabric) wants a string
    //     return {
    //       transform: `translate(${position.value.x}, ${position.value.y}) scale(${scale.value})`,
    //     };
    //   } else {
    //     // Android (Fabric) wants an array
    //     return {
    //       transform: [
    //         { translateX: position.value.x },
    //         { translateY: position.value.y },
    //         { scale: scale.value },
    //       ],
    //     };
    //   }
    // });

    const animatedProps = useAnimatedProps(() => {
      return {
        transform: [
          {translateX: position.value.x},
          {translateY: position.value.y},
          {scale: scale.value},
        ],
      };
    });

    const tap = Gesture.Tap().onEnd(e => {
      console.log('tap at ', e.x, e.y);
    });

    const gestures = Gesture.Exclusive(pan, pinch, tap);

    return (
      <GestureDetector gesture={gestures}>
        <View style={[styles.container, {top: insets.top}]}>
          <Svg
            width={width}
            height={height}
            viewBox={`0 0 ${viewBoxSizeX} ${viewBoxSizeY}`}
            preserveAspectRatio="xMinYMin meet">
            <AnimatedG animatedProps={animatedProps}>{content}</AnimatedG>
          </Svg>
        </View>
      </GestureDetector>
    );
  },
);

export default ZoomableSvg;
