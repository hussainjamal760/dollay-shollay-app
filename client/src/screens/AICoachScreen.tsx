import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import api from '../utils/api';

export default function AICoachScreen() {
  const [messages, setMessages] = useState([
    { role: 'system', content: 'Hi! I am your Dollay-Shollay AI Coach. How can I help you crush your goals today?' }
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const sendMessage = async () => {
    if (!inputText.trim()) return;
    
    const userMsg = { role: 'user', content: inputText.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setLoading(true);

    try {
      const response = await api.post('/ai/chat', { 
        prompt: userMsg.content,
        history: messages.filter(m => m.role !== 'system') 
      });

      if (response.data.success) {
        setMessages(prev => [...prev, { role: 'assistant', content: response.data.reply }]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: 'Oops! Something went wrong on my end.' }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Network error. Please try again later.' }]);
    } finally {
      setLoading(false);
    }
  };

  const chartData = {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    datasets: [
      {
        data: [20, 45, 28, 80, 99, 43, 50],
        color: (opacity = 1) => `rgba(139, 92, 246, ${opacity})`, // Indigo
        strokeWidth: 3
      }
    ],
    legend: ["Weekly Consistency Score"]
  };

  return (
    <View style={styles.container}>
      <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
        <View style={styles.headerTitleRow}>
          <Ionicons name="chatbubbles" size={24} color="#8B5CF6" />
          <Text style={styles.headerTitle}>AI Coach</Text>
        </View>
        <Text style={styles.headerSubtitle}>Powered by Dollay-Shollay AI</Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.chartContainer}>
        <LineChart
          data={chartData}
          width={Dimensions.get('window').width - 48}
          height={180}
          chartConfig={{
            backgroundColor: '#18181B',
            backgroundGradientFrom: '#18181B',
            backgroundGradientTo: '#18181B',
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(139, 92, 246, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(161, 161, 170, ${opacity})`,
            style: { borderRadius: 16 },
            propsForDots: { r: '4', strokeWidth: '2', stroke: '#8B5CF6' }
          }}
          bezier
          style={{ borderRadius: 16 }}
        />
      </Animated.View>

      <ScrollView 
        ref={scrollViewRef}
        style={styles.chatArea}
        contentContainerStyle={{ padding: 24, paddingBottom: 10 }}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((msg, index) => {
          if (msg.role === 'system' && index === 0) {
            return (
              <Animated.View entering={FadeIn.delay(200)} key={index} style={[styles.messageBubble, styles.assistantBubble]}>
                <Ionicons name="sparkles" size={16} color="#8B5CF6" style={{marginBottom: 6}} />
                <Text style={styles.messageText}>{msg.content}</Text>
              </Animated.View>
            );
          }
          if (msg.role === 'system') return null;

          const isUser = msg.role === 'user';
          return (
            <Animated.View entering={FadeIn} key={index} style={[styles.messageBubble, isUser ? styles.userBubble : styles.assistantBubble]}>
              {isUser ? (
                <LinearGradient colors={['#6366F1', '#8B5CF6']} style={styles.userBubbleGradient}>
                  <Text style={styles.userMessageText}>{msg.content}</Text>
                </LinearGradient>
              ) : (
                <View>
                  <Ionicons name="sparkles" size={16} color="#8B5CF6" style={{marginBottom: 6}} />
                  <Text style={styles.messageText}>{msg.content}</Text>
                </View>
              )}
            </Animated.View>
          );
        })}
        {loading && (
          <View style={[styles.messageBubble, styles.assistantBubble]}>
            <ActivityIndicator color="#8B5CF6" />
          </View>
        )}
      </ScrollView>

      <View style={styles.inputArea}>
        <TextInput
          style={styles.input}
          placeholder="Ask for workout advice..."
          placeholderTextColor="#71717A"
          value={inputText}
          onChangeText={setInputText}
          onSubmitEditing={sendMessage}
        />
        <TouchableOpacity style={styles.sendButton} onPress={sendMessage} disabled={loading || !inputText.trim()}>
          <LinearGradient colors={['#6366F1', '#8B5CF6']} style={styles.sendButtonGradient}>
            <Ionicons name="send" size={18} color="#FFF" style={{ marginLeft: 2 }} />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090B', // Zinc 950
  },
  header: {
    padding: 24,
    paddingTop: 60,
    backgroundColor: '#09090B',
    alignItems: 'center',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FAFAFA',
    marginLeft: 10,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#A1A1AA',
    fontWeight: '500',
  },
  chartContainer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    alignItems: 'center',
  },
  chatArea: {
    flex: 1,
  },
  messageBubble: {
    maxWidth: '85%',
    marginBottom: 16,
  },
  userBubble: {
    alignSelf: 'flex-end',
    borderRadius: 20,
    borderBottomRightRadius: 4,
    overflow: 'hidden',
  },
  userBubbleGradient: {
    padding: 16,
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#18181B',
    borderRadius: 20,
    borderBottomLeftRadius: 4,
    padding: 16,
    borderWidth: 1,
    borderColor: '#27272A',
  },
  messageText: {
    color: '#E4E4E7',
    fontSize: 15,
    lineHeight: 22,
  },
  userMessageText: {
    color: '#FFF',
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
  },
  inputArea: {
    flexDirection: 'row',
    padding: 16,
    paddingBottom: 32,
    backgroundColor: '#18181B',
    borderTopWidth: 1,
    borderTopColor: '#27272A',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: '#27272A',
    color: '#FAFAFA',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 14,
    fontSize: 16,
  },
  sendButton: {
    marginLeft: 12,
    borderRadius: 24,
    overflow: 'hidden',
  },
  sendButtonGradient: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
