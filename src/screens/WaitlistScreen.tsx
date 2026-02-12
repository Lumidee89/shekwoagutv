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
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import api from '../api/axios';

const { width } = Dimensions.get('window');
const BASE_URL = 'https://shekwoagube.onrender.com';

interface Download {
  _id: string;
  movie: string;
  movieDetails: {
    title: string;
    thumbnailUrl: string;
    duration: number;
    releaseYear: number;
    genre: string[];
    description: string;
  };
  downloadDate: string;
  expiresAt: string;
  playProgress: number;
}

type WaitlistScreenNavigationProp = NativeStackNavigationProp<any, 'Waitlist'>;

const WaitlistScreen = () => {
  const navigation = useNavigation<WaitlistScreenNavigationProp>();
  const [downloads, setDownloads] = useState<Download[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch downloads when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      console.log('Waitlist screen focused - refreshing downloads');
      fetchDownloads();
    }, [])
  );

  // Also fetch on mount
  useEffect(() => {
    fetchDownloads();
  }, []);

  const fetchDownloads = async () => {
    try {
      setError(null);
      const response = await api.get('/downloads/my');
      setDownloads(response.data.data.downloads);
    } catch (error: any) {
      console.error('Error fetching downloads:', error);
      setError('Failed to load your downloads');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchDownloads();
  };

  const handleRemoveDownload = (download: Download) => {
    Alert.alert(
      'Remove Download',
      `Are you sure you want to remove "${download.movieDetails.title}" from your downloads?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/downloads/${download._id}`);
              // Optimistically update UI
              setDownloads(downloads.filter(d => d._id !== download._id));
              Alert.alert('Success', 'Movie removed from downloads');
            } catch (error) {
              Alert.alert('Error', 'Failed to remove download');
            }
          }
        }
      ]
    );
  };

  const handlePlayDownload = (download: Download) => {
    navigation.navigate('MoviePlayer', { 
      movieId: download.movie,
      downloadId: download._id 
    });
  };

  const getImageUrl = (thumbnailUrl: string) => {
    if (!thumbnailUrl) return null;
    if (thumbnailUrl.startsWith('http')) return thumbnailUrl;
    const cleanPath = thumbnailUrl.startsWith('/') ? thumbnailUrl.slice(1) : thumbnailUrl;
    return `${BASE_URL}/${cleanPath}`;
  };

  const calculateExpiryDays = (expiresAt: string) => {
    const expiry = new Date(expiresAt);
    const now = new Date();
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const renderDownloadItem = ({ item }: { item: Download }) => {
    const thumbnailUrl = getImageUrl(item.movieDetails.thumbnailUrl);
    const expiryDays = calculateExpiryDays(item.expiresAt);
    const downloadDate = new Date(item.downloadDate).toLocaleDateString();

    return (
      <TouchableOpacity
        style={styles.downloadCard}
        activeOpacity={0.8}
        onPress={() => handlePlayDownload(item)}
      >
        <View style={styles.downloadImageContainer}>
          {thumbnailUrl ? (
            <Image
              source={{ uri: thumbnailUrl }}
              style={styles.downloadImage}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.downloadImage, styles.placeholderImage]}>
              <Text style={styles.placeholderText}>🎬</Text>
            </View>
          )}
          
          {/* Progress Indicator */}
          {item.playProgress > 0 && (
            <View style={styles.progressOverlay}>
              <View style={[styles.progressBar, { width: `${item.playProgress}%` }]} />
            </View>
          )}

          {/* Duration Badge */}
          <View style={styles.durationBadge}>
            <Text style={styles.durationText}>
              {formatDuration(item.movieDetails.duration)}
            </Text>
          </View>
        </View>

        <View style={styles.downloadInfo}>
          <View style={styles.downloadHeader}>
            <Text style={styles.downloadTitle} numberOfLines={1}>
              {item.movieDetails.title}
            </Text>
            <TouchableOpacity
              style={styles.menuButton}
              onPress={() => handleRemoveDownload(item)}
            >
              <Ionicons name="ellipsis-vertical" size={20} color="#999999" />
            </TouchableOpacity>
          </View>

          <View style={styles.downloadMeta}>
            <Text style={styles.downloadMetaText}>
              Downloaded {downloadDate}
            </Text>
            <View style={styles.expiryBadge}>
              <Ionicons name="time-outline" size={12} color="#CCCCCC" />
              <Text style={styles.expiryText}>
                {expiryDays > 0 ? `${expiryDays} days left` : 'Expiring soon'}
              </Text>
            </View>
          </View>

          <View style={styles.genreContainer}>
            {item.movieDetails.genre.slice(0, 2).map((genre, index) => (
              <View key={index} style={styles.genreTag}>
                <Text style={styles.genreText}>{genre}</Text>
              </View>
            ))}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && !refreshing) {
    return (
      <LinearGradient colors={['#000000', '#141414', '#000000']} style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E50914" />
        <Text style={styles.loadingText}>Loading your downloads...</Text>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#000000', '#141414', '#000000']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.title}>My Downloads</Text>
          <Text style={styles.subtitle}>
            {downloads.length} {downloads.length === 1 ? 'movie' : 'movies'} available
          </Text>
        </View>

        {error && !refreshing && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={40} color="#E50914" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchDownloads}>
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        )}

        {downloads.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="download-outline" size={60} color="#E50914" />
            </View>
            <Text style={styles.emptyTitle}>No Downloads Yet</Text>
            <Text style={styles.emptyDescription}>
              Movies you download will appear here. You can download movies while watching to watch them offline.
            </Text>
            <TouchableOpacity
              style={styles.browseButton}
              onPress={() => navigation.navigate('Home')}
            >
              <Text style={styles.browseButtonText}>Browse Movies</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={downloads}
            renderItem={renderDownloadItem}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#E50914"
                colors={["#E50914"]}
                progressBackgroundColor="#1a1a1a"
              />
            }
          />
        )}
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  // ... keep all your existing styles exactly as they are
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#999999',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 12,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  downloadCard: {
    flexDirection: 'row',
    marginBottom: 16,
    backgroundColor: 'rgba(51, 51, 51, 0.3)',
    borderRadius: 8,
    overflow: 'hidden',
  },
  downloadImageContainer: {
    width: 120,
    height: 160,
    position: 'relative',
  },
  downloadImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    backgroundColor: '#333333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 40,
    color: '#666666',
  },
  progressOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#E50914',
  },
  durationBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  durationText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  downloadInfo: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  downloadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  downloadTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  menuButton: {
    padding: 4,
  },
  downloadMeta: {
    marginBottom: 8,
  },
  downloadMetaText: {
    color: '#999999',
    fontSize: 12,
    marginBottom: 4,
  },
  expiryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  expiryText: {
    color: '#CCCCCC',
    fontSize: 11,
    marginLeft: 4,
  },
  genreContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  genreTag: {
    backgroundColor: 'rgba(229, 9, 20, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 6,
    marginBottom: 4,
  },
  genreText: {
    color: '#E50914',
    fontSize: 10,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    marginTop: -50,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(229, 9, 20, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  emptyDescription: {
    fontSize: 15,
    color: '#999999',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  browseButton: {
    backgroundColor: '#E50914',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  browseButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 12,
    marginBottom: 20,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#E50914',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 6,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default WaitlistScreen;