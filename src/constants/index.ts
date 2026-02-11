import { OnboardingItem } from '../types';

export const ONBOARDING_DATA: OnboardingItem[] = [
  {
    id: '1',
    title: 'Unlimited Entertainment',
    description: 'Watch unlimited movies, TV shows, and more on your device.',
    image: require('../../assets/pic1.jpg'), 
  },
  {
    id: '2',
    title: 'Download & Go',
    description: 'Download your favorite content and watch offline.',
    image: require('../../assets/pic2.jpg'),
  },
  {
    id: '3',
    title: 'Watch Everywhere',
    description: 'Stream on your phone, tablet, laptop, and TV.',
    image: require('../../assets/pic3.jpg'),
  },
];

export const BACKGROUND_IMAGES = {
  login: require('../../assets/pic1.jpg'),
  register: require('../../assets/pic2.jpg'),
  onboarding: require('../../assets/pic3.jpg'),
};

export const API_BASE_URL = 'https://shekwoagube.onrender.com/api'; 