import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
  StatusBar,
  Platform,
  Animated,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import api from '../api/axios';

const { width, height } = Dimensions.get('window');
const BASE_URL = 'https://shekwoagube.onrender.com';

interface Movie {
  _id: string;
  title: string;
  description: string;
  genre: string[];
  releaseYear: number;
  duration: number;
  videoUrl?: string;
  thumbnailUrl: string;
  isFeatured: boolean;
  createdAt: string;
}

type MoviePlayerScreenNavigationProp = NativeStackNavigationProp<any, 'MoviePlayer'>;

const MoviePlayerScreen = () => {
  const navigation = useNavigation<MoviePlayerScreenNavigationProp>();
  const route = useRoute();
  const { movieId } = route.params as { movieId: string };
  
  const [movie, setMovie] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(true);
  const [videoLoading, setVideoLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<AVPlaybackStatus | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [requiresSubscription, setRequiresSubscription] = useState(false);
  
  const videoRef = useRef<Video>(null);
  const controlsTimeout = useRef<NodeJS.Timeout | null>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    fetchMovieDetails();
  }, [movieId]);

  useEffect(() => {
    if (isPlaying && showControls) {
      if (controlsTimeout.current) {
        clearTimeout(controlsTimeout.current);
      }
      controlsTimeout.current = setTimeout(() => {
        hideControls();
      }, 3000);
    }
    return () => {
      if (controlsTimeout.current) {
        clearTimeout(controlsTimeout.current);
      }
    };
  }, [isPlaying, showControls]);

  const fetchMovieDetails = async () => {
    try {
      setLoading(true);
      // Use the watch endpoint which requires subscription
      const response = await api.get(`/movies/watch/${movieId}`);
      const movieData = response.data.data.movie;
      setMovie(movieData);
      setRequiresSubscription(false);
    } catch (error: any) {
      console.error('Error fetching movie details:', error);
      
      // Check if error is due to missing subscription
      if (error.response?.status === 403 && error.response?.data?.requiresSubscription) {
        setRequiresSubscription(true);
        setError('This content requires an active subscription');
      } else {
        setError(error.response?.data?.message || 'Failed to load movie details');
      }
    } finally {
      setLoading(false);
    }
  };

  const getVideoUrl = (videoUrl: string) => {
    if (!videoUrl) return null;
    if (videoUrl.startsWith('http')) {
      return videoUrl;
    }
    const cleanPath = videoUrl.startsWith('/') ? videoUrl.slice(1) : videoUrl;
    return `${BASE_URL}/${cleanPath}`;
  };

  const togglePlayPause = async () => {
    if (!videoRef.current) return;
    
    if (isPlaying) {
      await videoRef.current.pauseAsync();
    } else {
      await videoRef.current.playAsync();
    }
    setIsPlaying(!isPlaying);
  };

  const toggleControls = () => {
    if (showControls) {
      hideControls();
    } else {
      showControlsWithAnimation();
    }
  };

  const hideControls = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setShowControls(false));
  };

  const showControlsWithAnimation = () => {
    setShowControls(true);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const handlePlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    setStatus(status);
    if (status.isLoaded) {
      setVideoLoading(false);
      setIsPlaying(status.isPlaying);
    }
  };

  const formatTime = (millis: number | undefined) => {
    if (!millis) return '0:00';
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const seekForward = async () => {
    if (!videoRef.current || !status?.isLoaded) return;
    const newPosition = (status.positionMillis || 0) + 10000;
    await videoRef.current.setPositionAsync(newPosition);
  };

  const seekBackward = async () => {
    if (!videoRef.current || !status?.isLoaded) return;
    const newPosition = (status.positionMillis || 0) - 10000;
    await videoRef.current.setPositionAsync(Math.max(0, newPosition));
  };

  const getFullImageUrl = (thumbnailUrl: string) => {
    if (!thumbnailUrl) return null;
    if (thumbnailUrl.startsWith('http')) return thumbnailUrl;
    const cleanPath = thumbnailUrl.startsWith('/') ? thumbnailUrl.slice(1) : thumbnailUrl;
    return `${BASE_URL}/${cleanPath}`;
  };

  const handleSubscribePress = () => {
    navigation.goBack();
    // Navigate to subscription tab
    navigation.navigate('MainTabs', { screen: 'Subscription' });
  };

  if (loading) {
    return (
      <LinearGradient colors={['#000000', '#141414']} style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E50914" />
        <Text style={styles.loadingText}>Loading video player...</Text>
      </LinearGradient>
    );
  }

  if (requiresSubscription) {
    return (
      <LinearGradient colors={['#000000', '#141414']} style={styles.loadingContainer}>
        <View style={styles.lockIconContainer}>
          <Ionicons name="lock-closed" size={60} color="#E50914" />
        </View>
        <Text style={styles.errorText}>Subscription Required</Text>
        <Text style={styles.errorSubText}>
          You need an active subscription to watch this content.
        </Text>
        <TouchableOpacity 
          style={styles.subscribeButton} 
          onPress={handleSubscribePress}
        >
          <Text style={styles.subscribeButtonText}>View Subscription Plans</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.goBackButton} 
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.goBackButtonText}>Go Back</Text>
        </TouchableOpacity>
      </LinearGradient>
    );
  }

  if (error || !movie) {
    return (
      <LinearGradient colors={['#000000', '#141414']} style={styles.loadingContainer}>
        <Ionicons name="alert-circle-outline" size={60} color="#E50914" />
        <Text style={styles.errorText}>{error || 'Movie not found'}</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </LinearGradient>
    );
  }

  const videoUrl = getVideoUrl(movie.videoUrl || '');
  const thumbnailUrl = getFullImageUrl(movie.thumbnailUrl);

  return (
    <View style={styles.container}>
      <StatusBar hidden={isFullscreen} />
      
      {/* Video Player */}
      <TouchableOpacity
        activeOpacity={1}
        style={styles.videoContainer}
        onPress={toggleControls}
      >
        <Video
          ref={videoRef}
          source={{ uri: videoUrl! }}
          style={styles.video}
          resizeMode={ResizeMode.CONTAIN}
          onLoadStart={() => setVideoLoading(true)}
          onLoad={() => setVideoLoading(false)}
          onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
          useNativeControls={false}
          shouldPlay={false}
          isLooping={false}
        />

        {videoLoading && (
          <View style={styles.videoLoadingContainer}>
            <ActivityIndicator size="large" color="#E50914" />
            <Text style={styles.videoLoadingText}>Buffering...</Text>
          </View>
        )}

        {showControls && (
          <Animated.View style={[styles.controlsOverlay, { opacity: fadeAnim }]}>
            <LinearGradient
              colors={['rgba(0,0,0,0.7)', 'transparent', 'rgba(0,0,0,0.7)']}
              style={styles.controlsGradient}
            >
              <SafeAreaView style={styles.topBar}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.topBarButton}>
                  <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <Text style={styles.topBarTitle}>{movie.title}</Text>
                <TouchableOpacity style={styles.topBarButton}>
                  <Ionicons name="ellipsis-vertical" size={24} color="#FFFFFF" />
                </TouchableOpacity>
              </SafeAreaView>

              <View style={styles.centerControls}>
                <TouchableOpacity onPress={seekBackward} style={styles.controlButton}>
                  <Ionicons name="play-back" size={40} color="#FFFFFF" />
                  <Text style={styles.controlButtonText}>10</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={togglePlayPause} style={styles.playButton}>
                  <Ionicons 
                    name={isPlaying ? 'pause' : 'play'} 
                    size={50} 
                    color="#FFFFFF" 
                  />
                </TouchableOpacity>

                <TouchableOpacity onPress={seekForward} style={styles.controlButton}>
                  <Ionicons name="play-forward" size={40} color="#FFFFFF" />
                  <Text style={styles.controlButtonText}>10</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.bottomBar}>
                <View style={styles.progressContainer}>
                  <Text style={styles.timeText}>
                    {formatTime(status?.isLoaded ? status.positionMillis : 0)}
                  </Text>
                  <View style={styles.progressBar}>
                    <View 
                      style={[
                        styles.progressFill,
                        {
                          width: status?.isLoaded
                            ? `${(status.positionMillis || 0) / (status.durationMillis || 1) * 100}%`
                            : '0%'
                        }
                      ]} 
                    />
                  </View>
                  <Text style={styles.timeText}>
                    {formatTime(status?.isLoaded ? status.durationMillis : 0)}
                  </Text>
                </View>

                <View style={styles.bottomControls}>
                  <TouchableOpacity style={styles.bottomButton}>
                    <Ionicons name="volume-high" size={20} color="#FFFFFF" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.bottomButton}>
                    <Ionicons name="settings-outline" size={20} color="#FFFFFF" />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.bottomButton}
                    onPress={() => setIsFullscreen(!isFullscreen)}
                  >
                    <Ionicons 
                      name={isFullscreen ? 'contract' : 'expand'} 
                      size={20} 
                      color="#FFFFFF" 
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </LinearGradient>
          </Animated.View>
        )}
      </TouchableOpacity>

      {/* Movie Details Section */}
      <ScrollView style={styles.detailsContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.titleSection}>
          <Text style={styles.movieTitle}>{movie.title}</Text>
          <View style={styles.movieMeta}>
            <Text style={styles.metaText}>{movie.releaseYear}</Text>
            <View style={styles.dot} />
            <Text style={styles.metaText}>{movie.duration} min</Text>
            <View style={styles.dot} />
            <Text style={styles.ratingText}>PG-13</Text>
          </View>
        </View>

        <View style={styles.genreSection}>
          {movie.genre.map((genre, index) => (
            <View key={index} style={styles.genreTag}>
              <Text style={styles.genreTagText}>{genre}</Text>
            </View>
          ))}
        </View>

        <View style={styles.descriptionSection}>
          <Text style={styles.descriptionTitle}>Description</Text>
          <Text style={styles.descriptionText}>{movie.description}</Text>
        </View>

        <View style={styles.footer} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 12,
  },
  lockIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(229, 9, 20, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  errorSubText: {
    color: '#CCCCCC',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  subscribeButton: {
    backgroundColor: '#E50914',
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 8,
    marginBottom: 12,
    width: '80%',
    alignItems: 'center',
  },
  subscribeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  goBackButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 8,
    width: '80%',
    alignItems: 'center',
  },
  goBackButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  videoContainer: {
    width: width,
    height: width * 0.5625,
    backgroundColor: '#000000',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  videoLoadingContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoLoadingText: {
    color: '#FFFFFF',
    fontSize: 14,
    marginTop: 8,
  },
  controlsOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  controlsGradient: {
    flex: 1,
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 0 : 16,
  },
  topBarButton: {
    padding: 8,
  },
  topBarTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  centerControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButton: {
    padding: 15,
    marginHorizontal: 10,
    position: 'relative',
  },
  controlButtonText: {
    position: 'absolute',
    bottom: 5,
    right: 10,
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  playButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 20,
  },
  bottomBar: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  progressBar: {
    flex: 1,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginHorizontal: 10,
    borderRadius: 1.5,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#E50914',
    borderRadius: 1.5,
  },
  timeText: {
    color: '#FFFFFF',
    fontSize: 12,
  },
  bottomControls: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  bottomButton: {
    padding: 8,
    marginLeft: 12,
  },
  detailsContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  titleSection: {
    marginBottom: 12,
  },
  movieTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  movieMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    color: '#CCCCCC',
    fontSize: 14,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CCCCCC',
    marginHorizontal: 8,
  },
  ratingText: {
    color: '#CCCCCC',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#CCCCCC',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 2,
  },
  genreSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  genreTag: {
    backgroundColor: 'rgba(229,9,20,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(229,9,20,0.5)',
  },
  genreTagText: {
    color: '#E50914',
    fontSize: 12,
    fontWeight: '600',
  },
  descriptionSection: {
    marginBottom: 24,
  },
  descriptionTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  descriptionText: {
    color: '#CCCCCC',
    fontSize: 14,
    lineHeight: 20,
  },
  footer: {
    height: 30,
  },
  backButton: {
    backgroundColor: '#E50914',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 6,
    marginTop: 20,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default MoviePlayerScreen;