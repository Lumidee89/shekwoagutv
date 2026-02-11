import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ImageBackground,
  Dimensions,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import OnboardingSlider from '../components/OnboardingSlider';
import Button from '../components/Button';
import { ONBOARDING_DATA } from '../constants';
import { AuthStackParamList } from '../navigation/AuthNavigator';

const { width, height } = Dimensions.get('window');

type OnboardingScreenNavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  'Onboarding'
>;

const OnboardingScreen = () => {
  const navigation = useNavigation<OnboardingScreenNavigationProp>();
  const [showButtons, setShowButtons] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (showButtons) {
      // Subtle zoom animation for background
      Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.05,
            duration: 8000,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 8000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [showButtons]);

  const handleGetStarted = () => {
    setShowButtons(true);
  };

  if (showButtons) {
    return (
      <View style={styles.container}>
        <Animated.View
          style={[
            styles.backgroundImageContainer,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <ImageBackground
            source={require('../../assets/pic1.jpg')}
            style={styles.backgroundImage}
            resizeMode="cover"
          />
        </Animated.View>

        {/* Dark overlay gradient */}
        <LinearGradient
          colors={[
            'rgba(0,0,0,0.5)',
            'rgba(0,0,0,0.7)',
            'rgba(0,0,0,0.9)',
            'rgba(0,0,0,0.95)',
          ]}
          style={styles.overlay}
        >
          <SafeAreaView style={styles.content}>
            <View style={styles.logoContainer}>
              <Text style={styles.logo}>ShekwoaguTV</Text>
              <Text style={styles.tagline}>
                Unlimited movies, TV shows, and more.
              </Text>
            </View>

            <View style={styles.middleContent}>
              <View style={styles.buttonContainer}>
                <Button
                  title="Sign In"
                  onPress={() => navigation.navigate('Login')}
                  variant="primary"
                  size="large"
                  style={styles.loginButton}
                />
                <Button
                  title="Create Account"
                  onPress={() => navigation.navigate('Register')}
                  variant="outline"
                  size="large"
                />
              </View>

              <TouchableOpacity style={styles.skipContainer}>
                <Text style={styles.skipText}>Continue as Guest</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.footer}>
              <Text style={styles.legalText}>
                By signing in, you agree to our Terms of Service and Privacy
                Policy.
              </Text>
            </View>
          </SafeAreaView>
        </LinearGradient>
      </View>
    );
  }

  return (
    <OnboardingSlider
      data={ONBOARDING_DATA}
      onGetStarted={handleGetStarted}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  backgroundImageContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  backgroundImage: {
    width: width,
    height: height,
  },
  overlay: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 60,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 200,
  },
  logo: {
    fontSize: 38,
    fontWeight: 'bold',
    color: '#E50914',
    marginBottom: 12,
    textShadowColor: 'rgba(0,0,0,0.75)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 5,
  },
  tagline: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  middleContent: {
    alignItems: 'center',
  },
  buttonContainer: {
    width: '80%',
    maxWidth: 400,
    marginBottom: 16,
  },
  loginButton: {
    marginBottom: 12,
  },
  skipContainer: {
    padding: 12,
  },
  skipText: {
    color: '#FFFFFF',
    fontSize: 16,
    textDecorationLine: 'underline',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    color: '#FFFFFF',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 12,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  emailButton: {
    backgroundColor: '#E50914',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 4,
    marginBottom: 16,
    width: '100%',
    maxWidth: 300,
    alignItems: 'center',
  },
  emailButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  legalText: {
    color: '#CCCCCC',
    fontSize: 11,
    textAlign: 'center',
    paddingHorizontal: 20,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
});

export default OnboardingScreen;