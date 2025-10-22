import {Circle, G, Text} from 'react-native-svg';

const LoungerMapHotspot = ({hotspot, onPress}) => {
  const onPressIn = () => {
    onPress(hotspot.x, hotspot.y);
  };

  return (
    <G onPressIn={onPressIn} x={hotspot.x} y={hotspot.y}>
      <Circle r={90} fill={'blue'} stroke={'green'} strokeWidth={30} />
      <Text y={30} fill={'white'} fontSize="80" textAnchor="middle">
        {hotspot.availableQuantity}
      </Text>
    </G>
  );
};

export default LoungerMapHotspot;
