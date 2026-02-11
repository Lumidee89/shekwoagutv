import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Switch,
  Modal,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';

const { width } = Dimensions.get('window');

const ProfileScreen = () => {
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState(true);
  const [autoplay, setAutoplay] = useState(true);
  const [downloadQuality, setDownloadQuality] = useState('Auto');
  
  // Logout Modal States
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const scaleAnim = useState(new Animated.Value(0))[0];

  const handleLogoutPress = () => {
    setLogoutModalVisible(true);
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 50,
      friction: 7,
    }).start();
  };

  const handleCancel = () => {
    Animated.timing(scaleAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setLogoutModalVisible(false);
    });
  };

  const handleConfirmLogout = async () => {
    try {
      setLoading(true);
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLoading(false);
      setLogoutModalVisible(false);
    }
  };

  const menuItems = [
    {
      id: 1,
      title: 'Account Settings',
      icon: '⚙️',
      items: [
        { label: 'Email', value: user?.email, type: 'info' },
        { label: 'Username', value: user?.username, type: 'info' },
        { label: 'Change Password', type: 'link' },
      ],
    },
    {
      id: 2,
      title: 'Playback Settings',
      icon: '▶️',
      items: [
        { label: 'Notifications', type: 'switch', value: notifications, onValueChange: setNotifications },
        { label: 'Autoplay next episode', type: 'switch', value: autoplay, onValueChange: setAutoplay },
        { label: 'Download Quality', value: downloadQuality, type: 'select' },
      ],
    },
    {
      id: 3,
      title: 'Parental Controls',
      icon: '👪',
      items: [
        { label: 'Profile PIN', type: 'link' },
        { label: 'Viewing Restrictions', type: 'link' },
      ],
    },
    {
      id: 4,
      title: 'Support',
      icon: '❓',
      items: [
        { label: 'Help Center', type: 'link' },
        { label: 'Report a Problem', type: 'link' },
        { label: 'Terms of Service', type: 'link' },
        { label: 'Privacy Policy', type: 'link' },
      ],
    },
  ];

  return (
    <LinearGradient
      colors={['#000000', '#141414', '#000000']}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Profile</Text>
          </View>

          {/* Profile Header */}
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarEmoji}>👤</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{user?.username || 'User'}</Text>
              <Text style={styles.profileEmail}>{user?.email || 'email@example.com'}</Text>
              <View style={styles.memberBadge}>
                <Text style={styles.memberText}>Premium Member</Text>
              </View>
            </View>
          </View>

          {/* Menu Sections */}
          {menuItems.map((section) => (
            <View key={section.id} style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionIcon}>{section.icon}</Text>
                <Text style={styles.sectionTitle}>{section.title}</Text>
              </View>
              <View style={styles.sectionContent}>
                {section.items.map((item, index) => (
                  <View key={index} style={styles.menuItem}>
                    <Text style={styles.menuLabel}>{item.label}</Text>
                    {item.type === 'info' && (
                      <Text style={styles.menuValue}>{item.value}</Text>
                    )}
                    {item.type === 'switch' && (
                      <Switch
                        value={!!item.value}
                        onValueChange={(v) => {
                          if ('onValueChange' in item && typeof item.onValueChange === 'function') {
                            item.onValueChange(v);
                          }
                        }}
                        trackColor={{ false: '#767577', true: '#E50914' }}
                        thumbColor={!!item.value ? '#FFFFFF' : '#f4f3f4'}
                      />
                    )}
                    {item.type === 'link' && (
                      <Text style={styles.menuLink}>›</Text>
                    )}
                    {item.type === 'select' && (
                      <View style={styles.selectContainer}>
                        <Text style={styles.selectValue}>{item.value}</Text>
                        <Text style={styles.menuLink}>›</Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            </View>
          ))}

          {/* Logout Button */}
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogoutPress}>
            <Text style={styles.logoutButtonText}>Sign Out</Text>
          </TouchableOpacity>

          <Text style={styles.version}>Version 1.0.0</Text>
        </ScrollView>
      </SafeAreaView>

      {/* Logout Confirmation Modal - Same as DashboardScreen */}
      <Modal
        visible={logoutModalVisible}
        transparent={true}
        animationType="fade"
        statusBarTranslucent={true}
        onRequestClose={handleCancel}
      >
        <View style={styles.modalOverlay}>
          <Animated.View 
            style={[
              styles.modalContainer,
              {
                transform: [
                  { scale: scaleAnim },
                  { translateY: scaleAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [50, 0]
                  })}
                ],
                opacity: scaleAnim,
              }
            ]}
          >
            <View style={styles.modalContent}>
              {/* Modal Icon */}
              <View style={styles.modalIconContainer}>
                <Text style={styles.modalIcon}>🚪</Text>
              </View>

              {/* Modal Title */}
              <Text style={styles.modalTitle}>Sign Out</Text>
              
              {/* Modal Message */}
              <Text style={styles.modalMessage}>
                Are you sure you want to sign out?{'\n'}
                You'll need to sign in again to access your account.
              </Text>

              {/* Modal Buttons */}
              <View style={styles.modalButtonContainer}>
                <TouchableOpacity
                  style={styles.modalCancelButton}
                  onPress={handleCancel}
                  disabled={loading}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalConfirmButton}
                  onPress={handleConfirmLogout}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.modalConfirmText}>Sign Out</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
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
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    marginTop: 40,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
    backgroundColor: 'rgba(51, 51, 51, 0.3)',
    padding: 20,
    borderRadius: 16,
  },
  avatarContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(229, 9, 20, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarEmoji: {
    fontSize: 32,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: '#CCCCCC',
    marginBottom: 8,
  },
  memberBadge: {
    backgroundColor: 'rgba(229, 9, 20, 0.2)',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  memberText: {
    color: '#E50914',
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    marginBottom: 25,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  sectionContent: {
    backgroundColor: 'rgba(51, 51, 51, 0.3)',
    borderRadius: 12,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  menuLabel: {
    fontSize: 15,
    color: '#FFFFFF',
    flex: 1,
  },
  menuValue: {
    fontSize: 14,
    color: '#CCCCCC',
    marginRight: 8,
  },
  menuLink: {
    fontSize: 20,
    color: '#999999',
  },
  selectContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectValue: {
    fontSize: 14,
    color: '#CCCCCC',
    marginRight: 8,
  },
  logoutButton: {
    backgroundColor: 'rgba(229, 9, 20, 0.1)',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E50914',
  },
  logoutButtonText: {
    color: '#E50914',
    fontSize: 16,
    fontWeight: '600',
  },
  version: {
    color: '#666666',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 100,
  },
  // Modal Styles - Same as DashboardScreen
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

export default ProfileScreen;