import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "./index";

export const uploadImageForDiagnosis = async (image: {
  fileBuffer: ArrayBuffer;
  contentType: string;
}, userId: string): Promise<string> => {
    if (!image || !image.fileBuffer || !image.contentType) throw new Error("No valid image data provided for upload.");
    if (!userId) throw new Error("User ID is required for upload.");

    const { fileBuffer, contentType } = image;

    const fileExtension = contentType.split('/')[1] || 'jpg';
    const filePath = `diagnoses/${userId}/${Date.now()}.${fileExtension}`;
    const storageRef = ref(storage, filePath);

    try {
        const snapshot = await uploadBytes(storageRef, fileBuffer, { contentType });
        const downloadURL = await getDownloadURL(snapshot.ref);
        return downloadURL;
    } catch (error) {
        console.error("Error uploading image to Firebase Storage:", error);
        throw new Error("Failed to upload image.");
    }
};
