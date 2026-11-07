import React, { useState } from 'react';
import { SafeAreaView, Text, Pressable, StyleSheet } from 'react-native';

export default function App() {
  const [count, setCount] = useState(0);
  return (
    <SafeAreaView style={styles.screen}>
      <Text style={styles.title}>Dimensia Mobile</Text>
      <Text style={styles.subtitle}>Buton sayacı: {count}</Text>
      <Pressable style={styles.button} onPress={() => setCount(count + 1)}>
        <Text style={styles.buttonText}>Dokun</Text>
      </Pressable>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#17262b' },
  title: { color: '#f0f5ee', fontSize: 27, fontWeight: '700', marginBottom: 12 },
  subtitle: { color: '#b5cecb', fontSize: 17, marginBottom: 20 },
  button: { backgroundColor: '#54988c', padding: 15, borderRadius: 12 },
  buttonText: { color: 'white', fontSize: 16 }
});
