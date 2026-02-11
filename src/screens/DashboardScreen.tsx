import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Modal,
  Animated,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
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
  videoUrl: string;
  thumbnailUrl: string;
  isFeatured: boolean;
  createdAt: string;
}

const DashboardScreen = () => {
  const { user, logout } = useAuth();
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [moviesLoading, setMoviesLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scaleAnim = useState(new Animated.Value(0))[0];
  
  // Movie states
  const [allMovies, setAllMovies] = useState<Movie[]>([]);
  const [featuredMovies, setFeaturedMovies] = useState<Movie[]>([]);
  const [recentlyAdded, setRecentlyAdded] = useState<Movie[]>([]);
  const [actionMovies, setActionMovies] = useState<Movie[]>([]);
  const [comedyMovies, setComedyMovies] = useState<Movie[]>([]);
  const [dramaMovies, setDramaMovies] = useState<Movie[]>([]);
  const [horrorMovies, setHorrorMovies] = useState<Movie[]>([]);
  const [romanceMovies, setRomanceMovies] = useState<Movie[]>([]);
  const [sciFiMovies, setSciFiMovies] = useState<Movie[]>([]);
  const [imageErrors, setImageErrors] = useState<{[key: string]: boolean}>({});

  // Fetch all movies on component mount
  useEffect(() => {
    fetchAllMovies();
  }, []);

  // Function to get full image URL
  const getImageUrl = (thumbnailUrl: string) => {
    if (!thumbnailUrl) return null;
    
    // If it's already a full URL, return as is
    if (thumbnailUrl.startsWith('http')) {
      return thumbnailUrl;
    }
    
    // Remove leading slash if present to avoid double slashes
    const cleanPath = thumbnailUrl.startsWith('/') ? thumbnailUrl.slice(1) : thumbnailUrl;
    
    // Construct the full URL
    return `${BASE_URL}/${cleanPath}`;
  };

  // Handle image load error
  const handleImageError = (movieId: string) => {
    console.log(`Image failed to load for movie: ${movieId}`);
    setImageErrors(prev => ({ ...prev, [movieId]: true }));
  };

  const fetchAllMovies = async () => {
    try {
      setMoviesLoading(true);
      setError(null);
      const response = await api.get('/movies');
      const movies = response.data.data.movies;
      
      console.log(`Fetched ${movies.length} movies from backend`);
      
      // Log first movie's thumbnail URL for debugging
      if (movies.length > 0) {
        console.log('Sample thumbnail URL:', movies[0].thumbnailUrl);
        console.log('Full image URL:', getImageUrl(movies[0].thumbnailUrl));
      }
      
      // Store all movies
      setAllMovies(movies);
      
      // Filter featured movies
      const featured = movies.filter((movie: Movie) => movie.isFeatured === true);
      setFeaturedMovies(featured.length > 0 ? featured : movies.slice(0, 5));
      
      // Recently added (sort by createdAt)
      const recent = [...movies].sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ).slice(0, 10);
      setRecentlyAdded(recent);
      
      // Filter by genres
      const action = movies.filter((movie: Movie) => 
        movie.genre.some(g => g.toLowerCase().includes('action'))
      ).slice(0, 10);
      setActionMovies(action);
      
      const comedy = movies.filter((movie: Movie) => 
        movie.genre.some(g => g.toLowerCase().includes('comedy'))
      ).slice(0, 10);
      setComedyMovies(comedy);
      
      const drama = movies.filter((movie: Movie) => 
        movie.genre.some(g => g.toLowerCase().includes('drama'))
      ).slice(0, 10);
      setDramaMovies(drama);
      
      const horror = movies.filter((movie: Movie) => 
        movie.genre.some(g => g.toLowerCase().includes('horror'))
      ).slice(0, 10);
      setHorrorMovies(horror);
      
      const romance = movies.filter((movie: Movie) => 
        movie.genre.some(g => g.toLowerCase().includes('romance'))
      ).slice(0, 10);
      setRomanceMovies(romance);
      
      const sciFi = movies.filter((movie: Movie) => 
        movie.genre.some(g => g.toLowerCase().includes('sci-fi') || g.toLowerCase().includes('sci fi') || g.toLowerCase().includes('science'))
      ).slice(0, 10);
      setSciFiMovies(sciFi);
      
    } catch (error: any) {
      console.error('Error fetching movies:', error);
      setError(error.message || 'Failed to load movies');
    } finally {
      setMoviesLoading(false);
      setRefreshing(false);
    }
  };

  // Pull to refresh function
  const onRefresh = () => {
    setRefreshing(true);
    // Reset image errors on refresh
    setImageErrors({});
    fetchAllMovies();
  };

  const renderMovieCard = (movie: Movie, size: 'small' | 'medium' | 'large' = 'medium') => {
    const cardStyles = {
      small: styles.smallCard,
      medium: styles.mediumCard,
      large: styles.largeCard,
    };

    const imageStyles = {
      small: styles.smallMovieImage,
      medium: styles.mediumMovieImage,
      large: styles.largeMovieImage,
    };

    const hasImageError = imageErrors[movie._id];
    const imageUrl = getImageUrl(movie.thumbnailUrl);

    return (
      <TouchableOpacity 
        style={cardStyles[size]} 
        activeOpacity={0.8}
        onPress={() => console.log('Movie pressed:', movie.title)}
      >
        {!hasImageError && movie.thumbnailUrl && imageUrl ? (
          <Image 
            source={{ uri: imageUrl }}
            style={imageStyles[size]}
            resizeMode="cover"
            onError={() => handleImageError(movie._id)}
          />
        ) : (
          <View style={[imageStyles[size], styles.placeholderImage]}>
            <Text style={styles.placeholderText}>🎬</Text>
            <Text style={styles.placeholderTitle} numberOfLines={2}>{movie.title}</Text>
          </View>
        )}
        <View style={styles.movieInfo}>
          <Text style={styles.movieTitle} numberOfLines={1}>{movie.title}</Text>
          <Text style={styles.movieMeta}>
            {movie.releaseYear} • {movie.duration}min
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderFeaturedMovie = (movie: Movie) => {
    const hasImageError = imageErrors[movie._id];
    const imageUrl = getImageUrl(movie.thumbnailUrl);

    return (
      <TouchableOpacity 
        key={movie._id}
        style={styles.featuredCard}
        activeOpacity={0.9}
        onPress={() => console.log('Featured movie:', movie.title)}
      >
        {!hasImageError && movie.thumbnailUrl && imageUrl ? (
          <Image 
            source={{ uri: imageUrl }}
            style={styles.featuredImage}
            resizeMode="cover"
            onError={() => handleImageError(movie._id)}
          />
        ) : (
          <View style={[styles.featuredImage, styles.placeholderFeatured]}>
            <Text style={styles.placeholderFeaturedText}>🎬</Text>
            <Text style={styles.placeholderFeaturedTitle}>{movie.title}</Text>
          </View>
        )}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.9)']}
          style={styles.featuredGradient}
        >
          <Text style={styles.featuredTitle}>{movie.title}</Text>
          <View style={styles.genreContainer}>
            {movie.genre.slice(0, 3).map((genre, index) => (
              <View key={index} style={styles.genreBadge}>
                <Text style={styles.genreText}>{genre}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.featuredDescription} numberOfLines={2}>
            {movie.description}
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  const renderHorizontalSection = (title: string, movies: Movie[], size: 'small' | 'medium' | 'large' = 'medium') => {
    if (!movies || movies.length === 0) return null;
    
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {movies.map((movie) => (
            <View key={movie._id}>
              {renderMovieCard(movie, size)}
            </View>
          ))}
        </ScrollView>
      </View>
    );
  };

  if (moviesLoading && !refreshing) {
    return (
      <LinearGradient
        colors={['#000000', '#141414', '#000000']}
        style={styles.loadingContainer}
      >
        <ActivityIndicator size="large" color="#E50914" />
        <Text style={styles.loadingText}>Loading your movies...</Text>
        <Text style={styles.loadingSubText}>Fetching from ShekwoaguTV</Text>
      </LinearGradient>
    );
  }

  if (error && !refreshing) {
    return (
      <LinearGradient
        colors={['#000000', '#141414', '#000000']}
        style={styles.loadingContainer}
      >
        <Text style={styles.errorIcon}>😵</Text>
        <Text style={styles.errorText}>Failed to load movies</Text>
        <Text style={styles.errorSubText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchAllMovies}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={['#000000', '#141414', '#000000']}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <ScrollView 
          style={styles.scrollView} 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#E50914"
              colors={["#E50914"]}
              progressBackgroundColor="#1a1a1a"
              title="Pull to refresh"
              titleColor="#FFFFFF"
            />
          }
        >
          {/* Header with Image Logo and Logout Button */}
          <View style={styles.header}>
            <Image 
              source={require('../../assets/logowhite.png')} 
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          {/* Welcome Section */}
          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeText}>Welcome back, {user?.username || 'User'}!</Text>
            <View style={styles.movieCountContainer}>
              <Text style={styles.movieCount}>{allMovies.length} movies available</Text>
              {refreshing && (
                <ActivityIndicator size="small" color="#E50914" style={styles.refreshIndicator} />
              )}
            </View>
          </View>

          {/* Featured Movies - Hero Section */}
          {featuredMovies.length > 0 && (
            <View style={styles.featuredSection}>
              <Text style={styles.sectionTitle}>Featured</Text>
              <ScrollView 
                horizontal 
                pagingEnabled 
                showsHorizontalScrollIndicator={false}
                decelerationRate="fast"
              >
                {featuredMovies.map((movie) => renderFeaturedMovie(movie))}
              </ScrollView>
            </View>
          )}

          {/* Recently Added */}
          {recentlyAdded.length > 0 && renderHorizontalSection('Recently Added', recentlyAdded, 'medium')}

          {/* Action Movies */}
          {actionMovies.length > 0 && renderHorizontalSection('Action', actionMovies, 'medium')}

          {/* Comedy Movies */}
          {comedyMovies.length > 0 && renderHorizontalSection('Comedy', comedyMovies, 'small')}

          {/* Drama Movies */}
          {dramaMovies.length > 0 && renderHorizontalSection('Drama', dramaMovies, 'medium')}

          {/* Horror Movies */}
          {horrorMovies.length > 0 && renderHorizontalSection('Horror', horrorMovies, 'small')}

          {/* Romance Movies */}
          {romanceMovies.length > 0 && renderHorizontalSection('Romance', romanceMovies, 'medium')}

          {/* Sci-Fi Movies */}
          {sciFiMovies.length > 0 && renderHorizontalSection('Sci-Fi', sciFiMovies, 'medium')}

          {/* All Movies - Display everything at the bottom */}
          {allMovies.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>All Movies ({allMovies.length})</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {allMovies.map((movie) => (
                  <View key={movie._id} style={styles.smallCard}>
                    {renderMovieCard(movie, 'small')}
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Last updated timestamp */}
          <View style={styles.lastUpdated}>
            <Text style={styles.lastUpdatedText}>
              Last updated: {new Date().toLocaleTimeString()}
            </Text>
          </View>

          <View style={styles.footer} />
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 15,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 5,
  },
  logo: {
    width: 160,
    height: 35,
  },
  welcomeSection: {
    marginBottom: 20,
    marginTop: 10,
  },
  welcomeText: {
    color: '#FFFFFF',
    fontSize: 18,
  },
  movieCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  movieCount: {
    color: '#999999',
    fontSize: 14,
  },
  refreshIndicator: {
    marginLeft: 10,
  },
  featuredSection: {
    marginBottom: 30,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  // Card Sizes
  smallCard: {
    width: 100,
    marginRight: 8,
  },
  mediumCard: {
    width: 140,
    marginRight: 10,
  },
  largeCard: {
    width: 180,
    marginRight: 12,
  },
  // Movie Images
  smallMovieImage: {
    width: 100,
    height: 140,
    borderRadius: 4,
  },
  mediumMovieImage: {
    width: 140,
    height: 200,
    borderRadius: 6,
  },
  largeMovieImage: {
    width: 180,
    height: 250,
    borderRadius: 8,
  },
  movieInfo: {
    marginTop: 6,
  },
  movieTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  movieMeta: {
    color: '#999999',
    fontSize: 11,
    marginTop: 2,
  },
  // Featured Styles
  featuredCard: {
    width: width - 30,
    height: 250,
    marginRight: 15,
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  featuredImage: {
    width: '100%',
    height: '100%',
  },
  featuredGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 150,
    justifyContent: 'flex-end',
    padding: 15,
  },
  featuredTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  featuredDescription: {
    color: '#CCCCCC',
    fontSize: 13,
    marginTop: 6,
  },
  genreContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  genreBadge: {
    backgroundColor: 'rgba(229, 9, 20, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 8,
    marginBottom: 4,
  },
  genreText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  // Placeholders
  placeholderImage: {
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333333',
  },
  placeholderText: {
    fontSize: 30,
    color: '#666666',
    marginBottom: 8,
  },
  placeholderTitle: {
    color: '#999999',
    fontSize: 12,
    textAlign: 'center',
    paddingHorizontal: 5,
  },
  placeholderFeatured: {
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333333',
  },
  placeholderFeaturedText: {
    fontSize: 50,
    color: '#666666',
    marginBottom: 10,
  },
  placeholderFeaturedTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  // Last Updated
  lastUpdated: {
    alignItems: 'center',
    marginVertical: 20,
  },
  lastUpdatedText: {
    color: '#666666',
    fontSize: 11,
  },
  // Loading States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 18,
    marginTop: 16,
    fontWeight: '600',
  },
  loadingSubText: {
    color: '#999999',
    fontSize: 14,
    marginTop: 8,
  },
  // Error States
  errorIcon: {
    fontSize: 60,
    marginBottom: 16,
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  errorSubText: {
    color: '#999999',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 30,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#E50914',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    marginTop: 10,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    height: 30,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: width * 0.85,
    maxWidth: 400,
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(229, 9, 20, 0.3)',
    shadowColor: '#E50914',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  modalContent: {
    padding: 24,
    alignItems: 'center',
  },
  modalIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(229, 9, 20, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalIcon: {
    fontSize: 32,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  modalMessage: {
    fontSize: 16,
    color: '#CCCCCC',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    marginRight: 8,
    alignItems: 'center',
  },
  modalCancelText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalConfirmButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#E50914',
    borderRadius: 8,
    marginLeft: 8,
    alignItems: 'center',
  },
  modalConfirmText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default DashboardScreen;