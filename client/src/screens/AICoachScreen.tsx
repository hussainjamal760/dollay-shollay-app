import { StyleSheet, Text, View } from 'react-native';

export default function AICoachScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>AI Coach Chat</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
  },
  text: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
  },
});
