// types.ts

export type RootStackParamList = {
  Cart: undefined;
  Buy: { cartItems: CartItem[] };
  AddAddress: undefined;
  BottomTabs: undefined;
  OrderSuccess: undefined;
};

export type CartItem = {
  id: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
};
