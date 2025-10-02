
'use server';

import { diagnoseCropDisease, type DiagnoseCropDiseaseInput } from '@/ai/flows/diagnose-crop-disease';
import { generatePreventativeMeasures, type GeneratePreventativeMeasuresInput, type GeneratePreventativeMeasuresOutput } from '@/ai/flows/generate-preventative-measures';
import { getLocalizedFarmingTips, type GetLocalizedFarmingTipsInput, type GetLocalizedFarmingTipsOutput } from '@/ai/flows/get-localized-farming-tips';
import { agriBotChat } from '@/ai/flows/agri-bot-chat';
import type { LocalizedFarmingTip, DiagnosisResult, ChatMessage, DiagnosisHistoryEntry, UserProfile, UserRole, ProductCategory, AdminDashboardStats, CartItem, ShippingAddress, AgriBotChatInput, AgriBotChatOutput, Product, Order } from '@/types';
import { 
    saveDiagnosisEntryToDb,
    saveChatMessage as saveMessageToDb,
    updateDiagnosisHistoryEntry,
    getAllUsers as getAllUsersFromDb,
    updateUserByAdmin as updateUserByAdminInDb,
    getPendingExpertQueries as getPendingExpertQueriesFromDb,
    getProductCategories as getProductCategoriesFromDb,
    addProductCategory as addProductCategoryToDb,
    deleteProductCategory as deleteProductCategoryFromDb,
    getAllDiagnosisEntries as getAllDiagnosisEntriesFromDb,
    saveOrder as saveOrderToDb,
    getProducts as getProductsFromDb,
    getUserOrders as getUserOrdersFromDb,
    addProduct as addProductToDb,
    updateProduct as updateProductInDb,
    deleteProduct as deleteProductFromDb,
    getPendingOrders as getPendingOrdersFromDb,
    updateOrderStatus as updateOrderStatusInDb,
    updateUserInDb,
} from './firebase/firestore';

interface DiagnoseCropActionResult {
  diagnosis?: DiagnosisResult;
  error?: string;
}

// This action is now simplified to only perform AI diagnosis without saving to DB.
export async function diagnoseCropAction(
  input: DiagnoseCropDiseaseInput
): Promise<DiagnoseCropActionResult> {
  try {
    const aiResult = await diagnoseCropDisease(input);
    
    if (aiResult.diagnosis) {
      return { diagnosis: aiResult.diagnosis };
    }
    return { error: 'Unknown error from AI diagnosis. The model may have returned an unexpected format.' };
  } catch (error: any) {
    console.error('Error in diagnoseCropAction:', error);
    return { error: `Failed to diagnose crop. ${error.message || ''}`.trim() };
  }
}

export async function submitDirectExpertQueryAction(
  input: { photoURL: string, description: string },
  userId: string
): Promise<{ success: boolean; historyId?: string; error?: string }> {
  if (!userId) {
    return { success: false, error: 'User is not authenticated.' };
  }
  try {
    const entryToSave = {
      userId,
      photoURL: input.photoURL,
      description: input.description,
      diagnosis: null,
      expertReviewRequested: true,
      status: 'pending_expert' as const,
    };
    const historyId = await saveDiagnosisEntryToDb(entryToSave);
    return { success: true, historyId };
  } catch (error: any) {
    console.error('Error in submitDirectExpertQueryAction:', error);
    return { success: false, error: `Failed to submit query. ${error.message || ''}`.trim() };
  }
}


export async function generatePreventativeMeasuresAction(
  input: GeneratePreventativeMeasuresInput
): Promise<GeneratePreventativeMeasuresOutput | { error: string }> {
  try {
    const result = await generatePreventativeMeasures(input);
    return result;
  } catch (error: any) {
    console.error('Error in generatePreventativeMeasuresAction:', error);
    return { error: `Failed to generate preventative measures. ${error.message || ''}`.trim() };
  }
}

export async function getLocalizedFarmingTipsAction(
  input: GetLocalizedFarmingTipsInput
): Promise<(GetLocalizedFarmingTipsOutput & { tips: LocalizedFarmingTip[] }) | { error: string }> {
  try {
    const result = await getLocalizedFarmingTips(input);
    return result;
  } catch (error: any) {
    console.error('Error in getLocalizedFarmingTipsAction:', error);
    const errorMessage = (typeof error === 'object' && error !== null && 'message' in error) ? (error as {message: string}).message : 'An unknown error occurred';
    return { error: `Failed to generate farming tips: ${errorMessage}. Please try again.` };
  }
}

export async function saveChatMessageAction(
  message: Omit<ChatMessage, 'id' | 'timestamp'>
): Promise<{ messageId?: string; error?: string }> {
  if (!message.userId) {
    // Silently fail for guests, don't return an error to the UI
    return {};
  }
  try {
    const messageId = await saveMessageToDb(message);
    return { messageId };
  } catch (error: any) {
    console.error('Error in saveChatMessageAction:', error);
    return { error: `Failed to save chat message. ${error.message || ''}`.trim() };
  }
}

export async function getAgriBotResponseAction(
  input: AgriBotChatInput
): Promise<AgriBotChatOutput | { error: string }> {
  try {
    const result = await agriBotChat(input);
    return result;
  } catch (error: any) {
    console.error('Error in getAgriBotResponseAction:', error);
    return { error: `Failed to get response from AgriBot. ${error.message || ''}`.trim() };
  }
}

export async function requestExpertReviewAction(
  diagnosisId: string,
  userId: string
): Promise<{ success?: boolean; error?: string; message?: string }> {
  if (!userId) {
    return { error: "User not authenticated.", success: false };
  }
  if (!diagnosisId) {
    return { error: "Diagnosis ID is required.", success: false };
  }

  try {
    await updateDiagnosisHistoryEntry(diagnosisId, { 
      expertReviewRequested: true,
      status: 'pending_expert'
    });
    return { success: true, message: "Expert review requested successfully." };
  } catch (error: any) {
    console.error("Error requesting expert review:", error);
    return { error: `Failed to request expert review. ${error.message || ''}`.trim(), success: false };
  }
}

// User-facing profile update
export async function updateUserProfileAction(
  userId: string, 
  displayName: string
): Promise<{ success: boolean; error?: string }> {
    try {
        await updateUserInDb(userId, { displayName });
        return { success: true };
    } catch (error: any) {
        return { success: false, error: `Failed to update profile. ${error.message || ''}`.trim() };
    }
}

// User-facing order history
export async function getUserOrdersAction(userId: string): Promise<{ orders?: Order[]; error?: string }> {
    try {
        const orders = await getUserOrdersFromDb(userId);
        return { orders };
    } catch (error: any) {
        return { error: `Failed to fetch order history. ${error.message || ''}`.trim() };
    }
}


// Admin Actions
export async function fetchAllUsersAction(adminId: string): Promise<{ users?: UserProfile[]; error?: string }> {
  try {
    const users = await getAllUsersFromDb();
    return { users };
  } catch (error: any)
   {
    console.error('Error in fetchAllUsersAction:', error);
    let errorMessage = "Failed to fetch users.";
    if (error && typeof error === 'object' && 'message' in error) {
      errorMessage += ` Details: ${error.message}`;
    }
    return { error: errorMessage.trim() };
  }
}

export async function updateUserByAdminAction(
  targetUserId: string, 
  updates: { role: UserRole; status: 'active' | 'inactive' },
  adminId: string,
): Promise<{ success?: boolean; error?: string }> {
    try {
      await updateUserByAdminInDb(targetUserId, updates);
      return { success: true };
    } catch (error: any) {
      console.error('Error updating user profile action:', error);
      const specificError = error.message || 'An unknown error occurred.';
      return { error: `Failed to update user profile. ${specificError}`.trim() };
    }
}

export async function fetchPendingExpertQueriesAction(): Promise<{ queries?: DiagnosisHistoryEntry[]; error?: string }> {
  try {
    const queries = await getPendingExpertQueriesFromDb();
    return { queries };
  } catch (error: any) {
    console.error('Error in fetchPendingExpertQueriesAction:', error);
    const specificError = error.message || 'An unknown error occurred.';
    return { error: `Failed to fetch pending expert queries. ${specificError}`.trim() };
  }
}

export async function submitExpertDiagnosisAction(
  reviewerUserId: string,
  queryId: string,
  expertDiagnosis: string,
  expertComments: string
): Promise<{ success?: boolean; error?: string; message?: string }> {
  if (!reviewerUserId) {
    return { success: false, error: 'An authenticated user is required.' };
  }
  if (!queryId) {
    return { error: "Query ID is required.", success: false };
  }
  if (!expertDiagnosis.trim()) {
    return { error: "Expert diagnosis cannot be empty.", success: false };
  }

  try {
    await updateDiagnosisHistoryEntry(queryId, {
      expertDiagnosis,
      expertComments: expertComments.trim() || null, // Store null if empty
      expertReviewedBy: reviewerUserId,
      status: 'expert_reviewed',
      expertReviewedAt: new Date().toISOString()
    });
    return { success: true, message: "Expert review submitted successfully." };
  } catch (error: any) {
    console.error("Error submitting expert diagnosis:", error);
    return { error: `Failed to submit expert review. ${error.message || ''}`.trim(), success: false };
  }
}

export async function getProductCategoriesAction(adminId?: string): Promise<{ categories?: ProductCategory[]; error?: string }> {
    try {
        const categories = await getProductCategoriesFromDb();
        return { categories };
    } catch (error: any) {
        return { error: `Failed to fetch product categories. ${error.message || ''}`.trim() };
    }
}

export async function addProductCategoryAction(adminId: string, name: string): Promise<{ category?: ProductCategory; error?: string }> {
    if (!name || name.trim().length < 2) {
        return { error: "Category name must be at least 2 characters long." };
    }
    try {
        const newId = await addProductCategoryToDb(name);
        return { category: { id: newId, name } };
    } catch (error: any) {
        return { error: `Failed to add product category. ${error.message || ''}`.trim() };
    }
}

export async function deleteProductCategoryAction(adminId: string, id: string): Promise<{ success?: boolean; error?: string }> {
    try {
        await deleteProductCategoryFromDb(id);
        return { success: true };
    } catch (error: any) {
        return { error: `Failed to delete product category. ${error.message || ''}`.trim() };
    }
}

export async function getAdminDashboardStatsAction(adminId: string): Promise<{ stats?: AdminDashboardStats; error?: string }> {
  try {
    const [users, diagnoses, categories] = await Promise.all([
      getAllUsersFromDb(),
      getAllDiagnosisEntriesFromDb(),
      getProductCategoriesFromDb(),
    ]);

    const usersByRole = users.reduce(
      (acc, user) => {
        acc[user.role] = (acc[user.role] || 0) + 1;
        return acc;
      },
      { farmer: 0, expert: 0, admin: 0 }
    );
    
    const pendingQueries = diagnoses.filter(d => d.status === 'pending_expert' && d.timestamp);

    const stats: AdminDashboardStats = {
      totalUsers: users.length,
      usersByRole,
      totalDiagnoses: diagnoses.length,
      pendingQueries: pendingQueries.length,
      totalCategories: categories.length,
    };

    return { stats };
  } catch (error: any) {
    console.error('Error in getAdminDashboardStatsAction:', error);
    return { error: `Failed to fetch dashboard stats. ${error.message || ''}`.trim() };
  }
}

export async function getProductsAction(adminId?: string): Promise<{ products?: Product[]; error?: string }> {
    try {
        const products = await getProductsFromDb();
        return { products };
    } catch (error: any) {
        return { error: `Failed to fetch products. ${error.message || ''}`.trim() };
    }
}

export async function addProductAction(adminId: string, productData: Omit<Product, 'id'>): Promise<{ product?: Product; error?: string }> {
    try {
        const newId = await addProductToDb(productData);
        return { product: { ...productData, id: newId } };
    } catch (error: any) {
        return { error: `Failed to add product. ${error.message || ''}`.trim() };
    }
}

export async function updateProductAction(adminId: string, product: Product): Promise<{ product?: Product; error?: string }> {
    try {
        await updateProductInDb(product.id, product);
        return { product };
    } catch (error: any) {
        return { error: `Failed to update product. ${error.message || ''}`.trim() };
    }
}

export async function deleteProductAction(adminId: string, productId: string): Promise<{ success?: boolean; error?: string }> {
    try {
        await deleteProductFromDb(productId);
        return { success: true };
    } catch (error: any) {
        return { error: `Failed to delete product. ${error.message || ''}`.trim() };
    }
}

export async function getPendingOrdersAction(adminId: string): Promise<{ orders?: Order[]; error?: string }> {
    try {
        const orders = await getPendingOrdersFromDb();
        return { orders };
    } catch (error: any) {
        return { error: `Failed to fetch pending orders. ${error.message || ''}`.trim() };
    }
}

export async function updateOrderStatusAction(adminId: string, orderId: string, status: Order['status']): Promise<{ success?: boolean; error?: string }> {
    try {
        await updateOrderStatusInDb(orderId, status);
        return { success: true };
    } catch (error: any) {
        return { error: `Failed to update order status. ${error.message || ''}`.trim() };
    }
}


// E-commerce Actions

interface PlaceOrderInput {
    userId: string;
    items: CartItem[];
    totalAmount: number;
    shippingAddress: ShippingAddress;
}

export async function placeOrderAction(input: PlaceOrderInput): Promise<{ success: boolean; orderId?: string; error?: string }> {
    if (!input.userId) {
        return { success: false, error: 'User is not authenticated.' };
    }
    if (!input.items || input.items.length === 0) {
        return { success: false, error: 'Cannot place an order with an empty cart.' };
    }

    try {
        const orderId = await saveOrderToDb({
            ...input,
            status: 'placed',
        });
        
        return { success: true, orderId };
    } catch (error: any) {
        console.error('Error in placeOrderAction:', error);
        return { success: false, error: `Failed to place order. ${error.message || ''}`.trim() };
    }
}
