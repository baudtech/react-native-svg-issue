/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, {useEffect, useMemo, useRef, useState} from 'react';
import {Dimensions, View} from 'react-native';

import {svgMap} from './src/SvgMap';
import {getMapViewbox} from './src/utils';
import {hotspots} from './src/constants';
import LoungerMapHotspot from './src/LoungerMapHotspot';
import {SvgCss} from 'react-native-svg/css';
import ZoomableSvg from './src/ZoomableSvg/ZoomableSvg';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

const HotspotZoomLimit = 3;
const initialZoom = 1;

function AppContent(): React.JSX.Element {
  // tweak the svg data in order to render inside the native svg component
  const replacedMap = svgMap?.replace(/(<svg).*?(>)/s, '$1$2');
  const viewbox = getMapViewbox(svgMap);

  const [initialViewport, setInitialViewport] = useState(null);
  const [currentZoom, setCurrentZoom] = useState(initialZoom);
  const zoomableSvgRef = useRef(null);

  const insets = useSafeAreaInsets();

  const onHotspotPressed = (x, y) => {
    setCurrentZoom(HotspotZoomLimit);
    console.log('zooming to hotspot at ', x, y);
    zoomableSvgRef.current?.zoomToHotspot(HotspotZoomLimit, x, y);
  };

  useEffect(() => {
    let top = Number.MAX_SAFE_INTEGER;
    let bottom = Number.MIN_SAFE_INTEGER;
    let left = Number.MAX_SAFE_INTEGER;
    let right = Number.MIN_SAFE_INTEGER;

    if (hotspots?.length > 0) {
      hotspots.map(h => {
        if (h.y < top) {
          top = h.y;
        }
        if (h.y > bottom) {
          bottom = h.y;
        }
        if (h.x < left) {
          left = h.x;
        }
        if (h.x > right) {
          right = h.x;
        }
      });

      const width = right - left;
      const height = bottom - top;
      const center = {
        x: left + width / 2,
        y: top + height / 2,
      };
      setCurrentZoom(initialZoom);
      setInitialViewport({
        top,
        bottom,
        left,
        right,
        width,
        height,
        center,
      });
    }
  }, []);

  // decide between the hotspot or lounger render
  const showHotspotContent = useMemo(() => {
    return currentZoom < HotspotZoomLimit;
  }, [currentZoom]);

  // memo with hotspot data spots
  const hotspotContent = useMemo(() => {
    if (!showHotspotContent) {
      return null;
    }

    return hotspots?.map(hotspot => (
      <LoungerMapHotspot
        key={hotspot.hotspotId}
        hotspot={hotspot}
        onPress={onHotspotPressed}
      />
    ));
  }, [hotspots, showHotspotContent]);

  // merge the svg content created above
  const svgContent = (
    <>
      <SvgCss xml={replacedMap} />
      {hotspotContent}
    </>
  );

  // zoom changes callback
  const onZoomChanged = newZoomValue => {
    if (currentZoom === newZoomValue) {
      return;
    }
    setCurrentZoom(newZoomValue);
  };

  if (svgMap == null) {
    return null;
  }

  const windowWidth = Dimensions.get('window').width;
  const windowHeight = Dimensions.get('window').height / 2;

  const dotPosition = {
    top:
      ((hotspots[0].y / viewbox.viewboxSizeY) *
        windowWidth *
        viewbox.viewboxSizeY) /
        viewbox.viewboxSizeX -
      5 +
      insets.top,
    left: (hotspots[0].x / viewbox.viewboxSizeX) * windowWidth - 5,
  };

  return (
    <GestureHandlerRootView
      style={{
        flex: 1,
        backgroundColor: 'black',
      }}>
      <ZoomableSvg
        ref={zoomableSvgRef}
        width={windowWidth}
        height={windowHeight}
        initialViewport={initialViewport}
        viewBoxSizeX={viewbox?.viewboxSizeX}
        viewBoxSizeY={viewbox?.viewboxSizeY}
        align="end"
        content={svgContent}
        onZoomChanged={onZoomChanged}
      />
      <View
        style={{
          height: 10,
          width: 10,
          backgroundColor: 'red',
          position: 'absolute',
          top: dotPosition.top,
          left: dotPosition.left,
        }}
        pointerEvents="none"
      />
    </GestureHandlerRootView>
  );
}

function App(): React.JSX.Element {
  return (
    <SafeAreaProvider>
      <AppContent />
    </SafeAreaProvider>
  );
}

export default App;
