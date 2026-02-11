import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  SafeAreaView,
  ImageBackground,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import OnboardingSlider from '../components/OnboardingSlider';
import Button from '../components/Button';
import { SliderItem } from '../types';

type RootStackParamList = {
  Onboarding: undefined;
  Login: undefined;
  Register: undefined;
  Dashboard: undefined;
};

type OnboardingScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Onboarding'
>;

const onboardingData: SliderItem[] = [
  {
    id: '1',
    title: 'Unlimited Entertainment',
    description: 'Stream movies, TV shows, and exclusive content anytime, anywhere.',
    image: require('../assets/slide1.jpg'), // Add your images
  },
  {
    id: '2',
    title: 'Download & Go',
    description: 'Download your favorites and watch offline on the go.',
    image: require('../assets/slide2.jpg'), // Add your images
  },
  {
    id: '3',
    title: 'Watch on Any Device',
    description: 'Stream on your TV, tablet, phone, and more.',
    image: require('../assets/slide3.jpg'), // Add your images
  },
];

const OnboardingScreen: React.FC = () => {
  const navigation = useNavigation<OnboardingScreenNavigationProp>();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" />
      <OnboardingSlider data={onboardingData} />
      <View style={styles.footer}>
        <Button
          title="Login"
          onPress={() => navigation.navigate('Login')}
          variant="primary"
          style={styles.button}
        />
        <Button
          title="Register"
          onPress={() => navigation.navigate('Register')}
          variant="secondary"
          style={styles.button}
        />
        <Text style={styles.legal}>
          By signing in, you agree to our Terms and Privacy Policy.
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  footer: {
    position: 'absolute',
    bottom: 50,
    left: 20,
    right: 20,
  },
  button: {
    width: '100%',
  },
  legal: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 20,
  },
});

export default OnboardingScreen;