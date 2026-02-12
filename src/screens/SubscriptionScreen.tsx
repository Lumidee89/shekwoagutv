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
  Alert,
  Linking,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { WebView } from 'react-native-webview';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

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

interface UserSubscription {
  _id: string;
  planName: string;
  amount: number;
  status: string;
  endDate: string;
  autoRenew: boolean;
}

const SubscriptionScreen = () => {
  const { user } = useAuth();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState('');
  const [paymentLoading, setPaymentLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setError(null);
      // Fetch subscription status first, then plans if needed
      await fetchCurrentSubscription();
      await fetchSubscriptionPlans();
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchSubscriptionPlans = async () => {
    try {
      const response = await api.get('/subscriptions');
      const fetchedPlans = response.data.data.subscriptions;
      const sortedPlans = fetchedPlans.sort((a: SubscriptionPlan, b: SubscriptionPlan) => a.amount - b.amount);
      setPlans(sortedPlans);
    } catch (error: any) {
      console.error('Error fetching subscription plans:', error);
      // Fallback to default plans
      setPlans([
        {
          _id: '1',
          name: 'Basic',
          amount: 1500,
          currency: 'NGN',
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
          amount: 3000,
          currency: 'NGN',
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
          amount: 5000,
          currency: 'NGN',
          billingCycle: 'monthly',
          features: ['Watch on 4 screens', 'Best video quality', '4K+HDR resolution', 'Download on 4 devices', 'Dolby Atmos'],
          quality: 'Best',
          resolution: '4K+HDR',
          screens: 4,
          devices: 'All Devices',
          isActive: true
        }
      ]);
    }
  };

  const fetchCurrentSubscription = async () => {
    try {
      const response = await api.get('/subscriptions/my/status');
      console.log('Subscription status response:', response.data);
      
      if (response.data.data && response.data.data.subscription) {
        setCurrentSubscription(response.data.data.subscription);
      } else {
        setCurrentSubscription(null);
      }
    } catch (error: any) {
      console.log('No active subscription:', error.response?.status);
      setCurrentSubscription(null);
    }
  };

  const handleSubscribe = async (plan: SubscriptionPlan) => {
    if (currentSubscription) {
      Alert.alert(
        'Active Subscription',
        'You already have an active subscription. Would you like to cancel it first?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Manage Subscription', 
            onPress: () => {
              Alert.alert('Coming Soon', 'Subscription management will be available soon.');
            }
          }
        ]
      );
      return;
    }

    setSelectedPlan(plan);
    setPaymentLoading(true);

    try {
      const response = await api.post('/subscriptions/initialize-payment', {
        planId: plan._id,
        billingCycle: 'monthly',
        autoRenew: true
      });

      const { authorizationUrl, reference } = response.data.data;
      setPaymentUrl(authorizationUrl);
      setPaymentModalVisible(true);
    } catch (error: any) {
      Alert.alert('Payment Failed', error.response?.data?.message || 'Failed to initialize payment');
    } finally {
      setPaymentLoading(false);
    }
  };

  const handlePaymentSuccess = async (reference: string) => {
    try {
      setPaymentModalVisible(false);
      setPaymentLoading(true);
      
      const response = await api.get(`/subscriptions/verify-payment/${reference}`);
      
      if (response.data.status === 'success') {
        Alert.alert(
          'Payment Successful',
          `You have successfully subscribed to the ${selectedPlan?.name} plan!`,
          [
            { 
              text: 'OK', 
              onPress: async () => {
                // Force refresh subscription status immediately
                await fetchCurrentSubscription();
                setSelectedPlan(null);
              }
            }
          ]
        );
      }
    } catch (error: any) {
      Alert.alert('Verification Failed', error.response?.data?.message || 'Failed to verify payment');
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!currentSubscription) return;

    Alert.alert(
      'Cancel Subscription',
      'Are you sure you want to cancel your subscription? You will lose access to all content at the end of your billing period.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.patch(`/subscriptions/my/${currentSubscription._id}/cancel`);
              Alert.alert('Success', 'Your subscription has been cancelled');
              await fetchCurrentSubscription();
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.message || 'Failed to cancel subscription');
            }
          }
        }
      ]
    );
  };

  const handleToggleAutoRenew = async () => {
    if (!currentSubscription) return;

    try {
      const response = await api.patch(`/subscriptions/my/${currentSubscription._id}/auto-renew`, {
        autoRenew: !currentSubscription.autoRenew
      });
      
      if (response.data.status === 'success') {
        setCurrentSubscription({
          ...currentSubscription,
          autoRenew: !currentSubscription.autoRenew
        });
        Alert.alert('Success', `Auto-renew ${!currentSubscription.autoRenew ? 'enabled' : 'disabled'} successfully`);
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to toggle auto-renew');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCurrentSubscription();
    await fetchSubscriptionPlans();
    setRefreshing(false);
  };

  const formatCurrency = (amount: number, currency: string = 'NGN') => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getPlanFeatures = (plan: SubscriptionPlan) => {
    const features = [];
    features.push({ emoji: '🎥', text: `${plan.quality || 'Good'} quality` });
    features.push({ emoji: '📺', text: plan.resolution || '720p' });
    features.push({ emoji: '📱', text: plan.devices || 'Phone + Tablet' });
    features.push({ emoji: '👥', text: `${plan.screens || 1} screen${plan.screens > 1 ? 's' : ''}` });
    return features;
  };

  const isPopular = (planName: string) => {
    return planName.toLowerCase() === 'standard';
  };

  if (loading && !refreshing) {
    return (
      <LinearGradient colors={['#000000', '#141414', '#000000']} style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E50914" />
        <Text style={styles.loadingText}>Loading subscription plans...</Text>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#000000', '#141414', '#000000']} style={styles.container}>
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
          {/* Header - Dynamic based on subscription status */}
          <View style={styles.header}>
            <Text style={styles.title}>
              {currentSubscription ? 'Your Subscription' : 'Choose Your Plan'}
            </Text>
            <Text style={styles.subtitle}>
              {currentSubscription 
                ? 'Manage your current subscription plan' 
                : 'Watch anywhere. Cancel anytime.'}
            </Text>
          </View>

          {/* Enhanced Current Subscription Card */}
          {currentSubscription && (
            <View style={styles.currentSubscriptionCard}>
              <View style={styles.currentSubscriptionHeader}>
                <Text style={styles.currentSubscriptionTitle}>Active Plan</Text>
                <View style={styles.activeBadge}>
                  <Text style={styles.activeBadgeText}>ACTIVE</Text>
                </View>
              </View>
              
              <Text style={styles.currentPlanName}>{currentSubscription.planName}</Text>
              
              <View style={styles.currentPlanPriceContainer}>
                <Text style={styles.currentPlanAmount}>
                  {formatCurrency(currentSubscription.amount, 'NGN')}
                </Text>
                <Text style={styles.currentPlanPeriod}>/month</Text>
              </View>
              
              <View style={styles.currentPlanDivider} />
              
              <View style={styles.currentPlanDetailsGrid}>
                <View style={styles.currentPlanDetailItem}>
                  <Text style={styles.currentPlanDetailEmoji}>📅</Text>
                  <View>
                    <Text style={styles.currentPlanDetailLabel}>Valid Until</Text>
                    <Text style={styles.currentPlanDetailValue}>
                      {new Date(currentSubscription.endDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </Text>
                  </View>
                </View>
                
                <TouchableOpacity 
                  style={styles.currentPlanDetailItem}
                  onPress={handleToggleAutoRenew}
                  activeOpacity={0.7}
                >
                  <Text style={styles.currentPlanDetailEmoji}>🔄</Text>
                  <View>
                    <Text style={styles.currentPlanDetailLabel}>Auto-Renew</Text>
                    <Text style={[
                      styles.currentPlanDetailValue,
                      currentSubscription.autoRenew ? styles.autoRenewEnabled : styles.autoRenewDisabled
                    ]}>
                      {currentSubscription.autoRenew ? 'Enabled' : 'Disabled'}
                    </Text>
                    <Text style={styles.tapToChangeText}>Tap to change</Text>
                  </View>
                </TouchableOpacity>
              </View>
              
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancelSubscription}
              >
                <Text style={styles.cancelButtonText}>Cancel Subscription</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.changePlanButton}
                onPress={() => Alert.alert('Coming Soon', 'Plan change feature will be available soon.')}
              >
                <Text style={styles.changePlanButtonText}>Change Plan</Text>
              </TouchableOpacity>
            </View>
          )}

          {error && !refreshing && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorIcon}>⚠️</Text>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={fetchData}>
                <Text style={styles.retryButtonText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Only show available plans if user has NO active subscription - FIXED */}
          {!currentSubscription && (
            <View style={styles.plansContainer}>
              <Text style={styles.sectionSubtitle}>Available Plans</Text>
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
                      
                      {plan.features?.slice(4).map((feature, index) => (
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
                      onPress={() => handleSubscribe(plan)}
                      disabled={paymentLoading}
                    >
                      <Text style={styles.selectButtonText}>Select Plan</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}

          {plans.length === 0 && !error && !currentSubscription && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📦</Text>
              <Text style={styles.emptyText}>No subscription plans available</Text>
            </View>
          )}

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              By subscribing, you agree to our Terms of Service and Privacy Policy. 
              Your subscription will automatically renew unless cancelled. 
              Payments are processed securely via Paystack.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* Paystack Payment Modal */}
      <Modal
        visible={paymentModalVisible}
        animationType="slide"
        onRequestClose={() => setPaymentModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setPaymentModalVisible(false)}
            >
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Complete Payment</Text>
            <View style={{ width: 40 }} />
          </View>

          <WebView
            source={{ uri: paymentUrl }}
            onNavigationStateChange={(navState) => {
              if (navState.url.includes('callback') || navState.url.includes('success')) {
                const matches = navState.url.match(/reference=([^&]*)/);
                if (matches && matches[1]) {
                  handlePaymentSuccess(matches[1]);
                }
              }
            }}
            startInLoadingState={true}
            renderLoading={() => (
              <View style={styles.webviewLoading}>
                <ActivityIndicator size="large" color="#E50914" />
                <Text style={styles.webviewLoadingText}>Loading payment gateway...</Text>
              </View>
            )}
          />
        </SafeAreaView>
      </Modal>

      {/* Payment Loading Modal */}
      <Modal
        visible={paymentLoading}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.paymentLoadingOverlay}>
          <View style={styles.paymentLoadingContainer}>
            <ActivityIndicator size="large" color="#E50914" />
            <Text style={styles.paymentLoadingText}>Processing payment...</Text>
          </View>
        </View>
      </Modal>
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
  // Section Subtitle
  sectionSubtitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
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
  // Enhanced Current Subscription Styles
  currentSubscriptionCard: {
    backgroundColor: 'rgba(229, 9, 20, 0.1)',
    borderRadius: 16,
    padding: 24,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#E50914',
  },
  currentSubscriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  currentSubscriptionTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  activeBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  currentPlanName: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  currentPlanPriceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 20,
  },
  currentPlanAmount: {
    color: '#E50914',
    fontSize: 28,
    fontWeight: 'bold',
  },
  currentPlanPeriod: {
    color: '#CCCCCC',
    fontSize: 16,
    marginLeft: 4,
  },
  currentPlanDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginVertical: 20,
  },
  currentPlanDetailsGrid: {
    marginBottom: 24,
  },
  currentPlanDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  currentPlanDetailEmoji: {
    fontSize: 24,
    marginRight: 16,
    width: 40,
    textAlign: 'center',
  },
  currentPlanDetailLabel: {
    color: '#999999',
    fontSize: 13,
    marginBottom: 2,
  },
  currentPlanDetailValue: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '500',
  },
  autoRenewEnabled: {
    color: '#4CAF50',
  },
  autoRenewDisabled: {
    color: '#FF9800',
  },
  tapToChangeText: {
    color: '#999999',
    fontSize: 11,
    marginTop: 2,
  },
  cancelButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E50914',
    marginBottom: 8,
  },
  cancelButtonText: {
    color: '#E50914',
    fontSize: 16,
    fontWeight: '600',
  },
  changePlanButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  changePlanButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.5,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1a1a1a',
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  webviewLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  webviewLoadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 12,
  },
  paymentLoadingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentLoadingContainer: {
    backgroundColor: '#1a1a1a',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(229, 9, 20, 0.3)',
  },
  paymentLoadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 12,
  },
});

export default SubscriptionScreen;