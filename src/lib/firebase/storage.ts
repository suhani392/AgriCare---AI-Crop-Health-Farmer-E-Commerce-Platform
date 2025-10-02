
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "./index";

export const uploadImageForDiagnosis = async (file: File, userId: string): Promise<string> => {
    if (!file) throw new Error("No file provided for upload.");
    if (!userId) throw new Error("User ID is required for upload.");

    const filePath = `diagnoses/${userId}/${Date.now()}-${file.name}`;
    const storageRef = ref(storage, filePath);

    try {
        const snapshot = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);
        return downloadURL;
    } catch (error) {
        console.error("Error uploading image to Firebase Storage:", error);
        throw new Error("Failed to upload image.");
    }
};
