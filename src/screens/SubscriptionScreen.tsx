import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../api/axios';

const { width } = Dimensions.get('window');

interface SubscriptionPlan {
  _id: string;
  name: string;
  amount: number;
  currency: string;
  billingCycle: string;
  features: string[];
  quality: string;
  resolution: string;
  screens: number;
  devices: string;
  isActive: boolean;
}

const SubscriptionScreen = () => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch subscription plans on component mount
  useEffect(() => {
    fetchSubscriptionPlans();
  }, []);

  const fetchSubscriptionPlans = async () => {
    try {
      setError(null);
      const response = await api.get('/subscriptions');
      const fetchedPlans = response.data.data.subscriptions;
      
      // Sort plans by amount (Basic -> Standard -> Premium)
      const sortedPlans = fetchedPlans.sort((a: SubscriptionPlan, b: SubscriptionPlan) => a.amount - b.amount);
      setPlans(sortedPlans);
      
      console.log(`Fetched ${sortedPlans.length} subscription plans`);
    } catch (error: any) {
      console.error('Error fetching subscription plans:', error);
      setError(error.response?.data?.message || 'Failed to load subscription plans');
      
      // Fallback to default plans if API fails
      setPlans([
        {
          _id: '1',
          name: 'Basic',
          amount: 9.99,
          currency: 'USD',
          billingCycle: 'monthly',
          features: ['Watch on 1 screen', 'Good video quality', '720p resolution'],
          quality: 'Good',
          resolution: '720p',
          screens: 1,
          devices: 'Phone + Tablet',
          isActive: true
        },
        {
          _id: '2',
          name: 'Standard',
          amount: 14.99,
          currency: 'USD',
          billingCycle: 'monthly',
          features: ['Watch on 2 screens', 'Better video quality', '1080p resolution', 'Download on 2 devices'],
          quality: 'Better',
          resolution: '1080p',
          screens: 2,
          devices: 'Phone + Tablet + TV',
          isActive: true
        },
        {
          _id: '3',
          name: 'Premium',
          amount: 19.99,
          currency: 'USD',
          billingCycle: 'monthly',
          features: ['Watch on 4 screens', 'Best video quality', '4K+HDR resolution', 'Download on 4 devices', 'Dolby Atmos'],
          quality: 'Best',
          resolution: '4K+HDR',
          screens: 4,
          devices: 'All Devices',
          isActive: true
        }
      ]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Pull to refresh
  const onRefresh = () => {
    setRefreshing(true);
    fetchSubscriptionPlans();
  };

  // Format currency
  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    }).format(amount);
  };

  // Get plan features to display
  const getPlanFeatures = (plan: SubscriptionPlan) => {
    const features = [];
    
    // Add quality feature
    features.push({
      emoji: '🎥',
      text: `${plan.quality || 'Good'} quality`
    });
    
    // Add resolution feature
    features.push({
      emoji: '📺',
      text: plan.resolution || '720p'
    });
    
    // Add devices feature
    features.push({
      emoji: '📱',
      text: plan.devices || 'Phone + Tablet'
    });
    
    // Add screens feature
    features.push({
      emoji: '👥',
      text: `${plan.screens || 1} screen${plan.screens > 1 ? 's' : ''}`
    });
    
    return features;
  };

  // Check if plan is Standard (most popular)
  const isPopular = (planName: string) => {
    return planName.toLowerCase() === 'standard';
  };

  if (loading && !refreshing) {
    return (
      <LinearGradient
        colors={['#000000', '#141414', '#000000']}
        style={styles.loadingContainer}
      >
        <ActivityIndicator size="large" color="#E50914" />
        <Text style={styles.loadingText}>Loading subscription plans...</Text>
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
          contentContainerStyle={styles.scrollContent}
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
        >
          <View style={styles.header}>
            <Text style={styles.title}>Choose Your Plan</Text>
            <Text style={styles.subtitle}>Watch anywhere. Cancel anytime.</Text>
          </View>

          {error && !refreshing && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorIcon}>⚠️</Text>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={fetchSubscriptionPlans}>
                <Text style={styles.retryButtonText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.plansContainer}>
            {plans.filter(plan => plan.isActive).map((plan) => (
              <View key={plan._id} style={styles.planWrapper}>
                {isPopular(plan.name) && (
                  <View style={styles.popularBadge}>
                    <Text style={styles.popularText}>MOST POPULAR</Text>
                  </View>
                )}
                <View style={[
                  styles.planCard,
                  isPopular(plan.name) && styles.popularCard
                ]}>
                  <Text style={styles.planName}>{plan.name}</Text>
                  <Text style={styles.planPrice}>
                    {formatCurrency(plan.amount, plan.currency)}
                    <Text style={styles.planPeriod}>/{plan.billingCycle === 'yearly' ? 'yr' : 'mo'}</Text>
                  </Text>

                  <View style={styles.planFeatures}>
                    {getPlanFeatures(plan).map((feature, index) => (
                      <View key={index} style={styles.featureItem}>
                        <Text style={styles.featureEmoji}>{feature.emoji}</Text>
                        <Text style={styles.featureText}>{feature.text}</Text>
                      </View>
                    ))}
                    
                    {/* Additional features from the database */}
                    {plan.features && plan.features.slice(4).map((feature, index) => (
                      <View key={`extra-${index}`} style={styles.featureItem}>
                        <Text style={styles.featureEmoji}>✓</Text>
                        <Text style={styles.featureText}>{feature}</Text>
                      </View>
                    ))}
                  </View>

                  <TouchableOpacity 
                    style={[
                      styles.selectButton,
                      isPopular(plan.name) && styles.popularButton
                    ]}
                    onPress={() => console.log(`Selected ${plan.name} plan`)}
                  >
                    <Text style={styles.selectButtonText}>Select Plan</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>

          {plans.length === 0 && !error && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📦</Text>
              <Text style={styles.emptyText}>No subscription plans available</Text>
            </View>
          )}

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              HD (720p), Full HD (1080p), Ultra HD (4K) and HDR availability subject to your internet service and device capabilities. Not all content is available in all resolutions. See our Terms of Service for more details.
            </Text>
          </View>
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
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  header: {
    marginTop: 40,
    marginBottom: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#CCCCCC',
  },
  // Loading Styles
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
  // Error Styles
  errorContainer: {
    backgroundColor: 'rgba(229, 9, 20, 0.1)',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(229, 9, 20, 0.3)',
  },
  errorIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 12,
  },
  retryButton: {
    backgroundColor: '#E50914',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 6,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  // Empty State Styles
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    color: '#999999',
    fontSize: 16,
  },
  // Plan Styles
  plansContainer: {
    marginBottom: 30,
  },
  planWrapper: {
    marginBottom: 20,
    position: 'relative',
  },
  popularBadge: {
    position: 'absolute',
    top: -12,
    left: 20,
    right: 20,
    backgroundColor: '#E50914',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignSelf: 'center',
    zIndex: 1,
    alignItems: 'center',
  },
  popularText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  planCard: {
    backgroundColor: 'rgba(51, 51, 51, 0.5)',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  popularCard: {
    borderColor: '#E50914',
    borderWidth: 2,
    backgroundColor: 'rgba(229, 9, 20, 0.05)',
  },
  planName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  planPrice: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#E50914',
    marginBottom: 20,
  },
  planPeriod: {
    fontSize: 16,
    color: '#CCCCCC',
    fontWeight: 'normal',
  },
  planFeatures: {
    marginBottom: 24,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureEmoji: {
    fontSize: 18,
    marginRight: 12,
    width: 24,
    textAlign: 'center',
  },
  featureText: {
    color: '#CCCCCC',
    fontSize: 15,
    flex: 1,
  },
  selectButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  popularButton: {
    backgroundColor: '#E50914',
  },
  selectButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    marginTop: 20,
    paddingHorizontal: 10,
    marginBottom: 100,
  },
  footerText: {
    color: '#999999',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default SubscriptionScreen;  