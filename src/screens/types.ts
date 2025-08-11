// types.ts

export type RootStackParamList = {
  Cart: undefined;
  Buy: { cartItems: CartItem[] };
  AddAddress: undefined;
  BottomTabs: undefined;
  OrderSuccess: undefined;
  Allusers: undefined;
  UserProfile: undefined;
  OrdersDashboard: undefined;
  FilteredOrders: { statusFilter: 'pending' | 'shipped' | 'delivered'| 'not_delivered'|'all' };
};

export type CartItem = {
  id: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
};
