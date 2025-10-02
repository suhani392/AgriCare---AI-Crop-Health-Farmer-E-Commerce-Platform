
export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  imageUrl: string;
  description?: string;
  dataAiHint?: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface ProductCategory {
  id: string;
  name: string;
}

export interface DiagnosisResult {
  disease: string;
  confidence: number;
  treatmentRecommendations: string;
}

export interface PreventativeMeasure {
  title: string;
  content: string;
}

export interface PreventativeMeasuresResult {
  measures: PreventativeMeasure[];
}

export type UserRole = 'farmer' | 'admin' | 'expert';

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
  createdAt: string | null;
  role: UserRole;
  status?: 'active' | 'inactive';
}

export interface WeatherData {
  condition: string;
  temperature: string;
  humidity: string;
  wind: string;
  iconName: string; // Lucide icon name
  locationName: string;
  dataAiHint?: string;
}

export interface LocalizedFarmingTip {
  title: string;
  content: string;
  category: string;
  iconName?: string; // Optional: Lucide icon name based on category
}

export interface LocalizedFarmingTipsOutput {
  tips: LocalizedFarmingTip[];
  generalAdvice?: string;
}

export interface DiagnosisHistoryEntry {
  id?: string; // Firestore document ID
  userId: string;
  photoURL?: string; // URL from Firebase Storage
  description: string;
  diagnosis?: DiagnosisResult | null; // Optional to support direct-to-expert queries
  timestamp: string | null;
  expertReviewRequested?: boolean;
  expertDiagnosis?: string | null;
  expertComments?: string | null;
  expertReviewedBy?: string | null; // UID of the expert/admin who reviewed
  expertReviewedAt?: string | null;
  status?: 'ai_diagnosed' | 'pending_expert' | 'expert_reviewed' | 'closed' | 'ai_skipped';
}

export interface ChatMessage {
  id?: string; // Firestore document ID
  userId: string;
  sessionId: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string | null;
}

export interface ChatMessageHistory {
  role: 'user' | 'model';
  parts: { text: string }[];
}


export interface AdminDashboardStats {
  totalUsers: number;
  usersByRole: {
    farmer: number;
    expert: number;
    admin: number;
  };
  totalDiagnoses: number;
  pendingQueries: number;
  totalCategories: number;
}

export interface ShippingAddress {
    fullName: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    pincode: string;
}

export interface OrderBase {
    userId: string;
    items: CartItem[];
    totalAmount: number;
    shippingAddress: ShippingAddress;
    status: 'placed' | 'approved' | 'shipped' | 'delivered' | 'cancelled';
}

export interface Order extends OrderBase {
    id: string; // Firestore Document ID
    createdAt: string | null;
}

export interface AgriBotChatInput {
  message: string;
  history: ChatMessageHistory[];
  language?: 'en' | 'mr' | 'hi';
}

export interface AgriBotChatOutput {
  response: string;
}
