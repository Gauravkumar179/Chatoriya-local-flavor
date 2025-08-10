import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  PermissionsAndroid,
  Modal,
  Image,
  ScrollView,
  Dimensions,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import Icon from 'react-native-vector-icons/Ionicons';
import { captureRef } from 'react-native-view-shot';

const { width } = Dimensions.get('window');

const OrdersScreen = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const userId = auth().currentUser?.uid;

  // Modal & capture state
  const [modalVisible, setModalVisible] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const invoiceRef = useRef<View>(null);

  useEffect(() => {
    if (userId) {
      const unsubscribe = firestore()
        .collection('orders')
        .where('userId', '==', userId)
        .onSnapshot(snapshot => {
          if (!snapshot) {
            setOrders([]);
            return;
          }

          const fetchedOrders = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          }));

          setOrders(fetchedOrders);
        });

      return () => unsubscribe();
    }
  }, [userId]);

  // Request WRITE_EXTERNAL_STORAGE permission for Android <= API 32
  const requestWritePermission = async () => {
    if (Platform.OS !== 'android') return true;

    if (Platform.Version >= 33) {
      // Android 13+ storage permissions changed, WRITE_EXTERNAL_STORAGE not needed
      return true;
    }

    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        {
          title: 'Storage Permission Required',
          message: 'App needs access to your storage to save images',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn('Storage permission error:', err);
      return false;
    }
  };

  const generateImageFromInvoice = async (order: any) => {
    const hasPermission = await requestWritePermission();
    if (!hasPermission) {
      Alert.alert('Permission denied', 'Cannot generate image without permission.');
      return;
    }

    setSelectedOrder(order);
    setCapturedImage(null);
    setModalVisible(true);

    setTimeout(async () => {
      if (invoiceRef.current) {
        try {
          const uri = await captureRef(invoiceRef.current, {
            format: 'png',
            quality: 1,
          });
          setCapturedImage(uri);
        } catch (error) {
          Alert.alert('Error', 'Failed to capture invoice image.');
          setModalVisible(false);
          console.error(error);
        }
      }
    }, 500);
  };

  const renderStatusTracker = (status: string) => {
    const statuses = ['Pending', 'Shipped', 'Delivered'];
    const currentIndex = statuses.findIndex(
      s => s.toLowerCase() === status.toLowerCase()
    );

    return (
      <View style={styles.statusTrackerContainer}>
        {statuses.map((s, i) => (
          <View key={i} style={styles.statusItem}>
            <View
              style={[
                styles.statusCircle,
                i <= currentIndex ? styles.statusActive : styles.statusInactive,
              ]}
            />
            <Text
              style={[
                styles.statusLabel,
                i <= currentIndex ? styles.statusActiveText : styles.statusInactiveText,
              ]}
            >
              {s}
            </Text>
            {i < statuses.length - 1 && (
              <View
                style={[
                  styles.statusLine,
                  i < currentIndex ? styles.statusActive : styles.statusInactive,
                ]}
              />
            )}
          </View>
        ))}
      </View>
    );
  };

  const InvoiceView = React.forwardRef<View, { order: any }>((props, ref) => {
    const { order } = props;
    if (!order) return <Text>No order data</Text>;

    const orderDate = order.createdAt?.toDate
      ? order.createdAt.toDate().toLocaleString()
      : 'N/A';

    return (
      <View
        ref={ref}
        style={{
          backgroundColor: '#fff',
          padding: 20,
          borderRadius: 8,
          width: width - 40,
          alignSelf: 'center',
          elevation: 3,
        }}
      >
        <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' }}>
          Order Invoice
        </Text>
        <View style={{ marginBottom: 20 }}>
          <Text><Text style={{ fontWeight: 'bold' }}>Order ID:</Text> {order.id}</Text>
          <Text><Text style={{ fontWeight: 'bold' }}>Date:</Text> {orderDate}</Text>
          <Text><Text style={{ fontWeight: 'bold' }}>Status:</Text> {order.status}</Text>
        </View>

        <View style={{ borderWidth: 1, borderColor: '#ddd' }}>
          <View
            style={{
              flexDirection: 'row',
              backgroundColor: '#f2f2f2',
              paddingVertical: 8,
              borderBottomWidth: 1,
              borderColor: '#ddd',
            }}
          >
            <Text style={[styles.tableCell, { flex: 4, fontWeight: 'bold' }]}>Item</Text>
            <Text style={[styles.tableCell, { flex: 1, fontWeight: 'bold' }]}>Qty</Text>
            <Text style={[styles.tableCell, { flex: 2, fontWeight: 'bold' }]}>Price</Text>
            <Text style={[styles.tableCell, { flex: 2, fontWeight: 'bold' }]}>Total</Text>
          </View>
          {order.cartItems?.map((item: any, index: number) => (
            <View
              key={index}
              style={{
                flexDirection: 'row',
                paddingVertical: 8,
                borderBottomWidth: index === order.cartItems.length - 1 ? 0 : 1,
                borderColor: '#ddd',
              }}
            >
              <Text style={[styles.tableCell, { flex: 4 }]}>{item.name}</Text>
              <Text style={[styles.tableCell, { flex: 1 }]}>{item.quantity}</Text>
              <Text style={[styles.tableCell, { flex: 2 }]}>₹{item.price}</Text>
              <Text style={[styles.tableCell, { flex: 2 }]}>₹{item.price * item.quantity}</Text>
            </View>
          ))}

          <View
            style={{
              flexDirection: 'row',
              paddingVertical: 8,
              backgroundColor: '#f9f9f9',
            }}
          >
            <Text style={[styles.tableCell, { flex: 7, fontWeight: 'bold' }]}>Total Amount</Text>
            <Text style={[styles.tableCell, { flex: 2, fontWeight: 'bold' }]}>₹{order.totalAmount}</Text>
          </View>
        </View>
      </View>
    );
  });

  const renderOrder = ({ item }: { item: any }) => {
    return (
      <View style={styles.orderCard}>
        <View style={styles.orderHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.orderId}>Order ID: {item.id}</Text>
            <Text style={styles.totalAmount}>Total: ₹{item.totalAmount}</Text>
            <Text style={styles.orderDate}>
              Date:{' '}
              {item.createdAt?.toDate
                ? item.createdAt.toDate().toLocaleString()
                : 'N/A'}
            </Text>
          </View>
          <TouchableOpacity onPress={() => generateImageFromInvoice(item)}>
            <Icon name="download-outline" size={24} color="#007bff" />
          </TouchableOpacity>
        </View>

        <Text style={styles.cartLabel}>Items:</Text>
        {item.cartItems?.map((cartItem: any, index: number) => (
          <Text key={index}>
            - {cartItem.name} × {cartItem.quantity}
          </Text>
        ))}

        <Text style={styles.statusHeading}>Status:</Text>
        {renderStatusTracker(item.status || 'pending')}
      </View>
    );
  };

  return (
    <>
      <FlatList
        contentContainerStyle={styles.container}
        data={orders}
        keyExtractor={item => item.id}
        renderItem={renderOrder}
        ListEmptyComponent={<Text>No orders found.</Text>}
        ListHeaderComponent={<Text style={styles.heading}>📦 Your Orders</Text>}
      />

      <Modal visible={modalVisible} animationType="slide" transparent={false}>
        <View style={styles.modalContainer}>
          <ScrollView
            contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center' }}
          >
            {capturedImage ? (
              <Image
                source={{ uri: capturedImage }}
                style={{ width: width - 40, height: (width - 40) * 1.5, marginVertical: 10 }}
                resizeMode="contain"
              />
            ) : selectedOrder ? (
              <InvoiceView ref={invoiceRef} order={selectedOrder} />
            ) : (
              <Text>Loading invoice...</Text>
            )}
          </ScrollView>

          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => {
              setModalVisible(false);
              setCapturedImage(null);
              setSelectedOrder(null);
            }}
          >
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
    flexGrow: 1,
  },
  heading: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  orderCard: {
    backgroundColor: '#f9f9f9',
    padding: 14,
    borderRadius: 8,
    marginBottom: 20,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderId: {
    fontWeight: 'bold',
    marginBottom: 6,
  },
  totalAmount: {
    marginBottom: 6,
  },
  orderDate: {
    marginBottom: 8,
  },
  cartLabel: {
    marginTop: 8,
    fontWeight: 'bold',
  },
  statusHeading: {
    marginTop: 12,
    fontWeight: 'bold',
  },
  statusTrackerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    flexWrap: 'wrap',
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusCircle: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginHorizontal: 4,
  },
  statusLabel: {
    fontSize: 12,
    marginRight: 8,
  },
  statusLine: {
    width: 20,
    height: 2,
    marginHorizontal: 2,
  },
  statusActive: {
    backgroundColor: '#27ae60',
  },
  statusInactive: {
    backgroundColor: 'rgba(173, 216, 230, 0.5)',
  },
  statusActiveText: {
    color: '#27ae60',
    fontWeight: 'bold',
  },
  statusInactiveText: {
    color: 'rgba(173, 216, 230, 1)',
  },
  modalContainer: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
  },
  closeButton: {
    backgroundColor: '#007bff',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 25,
    alignSelf: 'center',
    marginBottom: 20,
  },
  closeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  tableCell: {
    paddingHorizontal: 8,
    textAlign: 'left',
  },
});

export default OrdersScreen;
