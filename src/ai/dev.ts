
import { config } from 'dotenv';
config();

import '@/ai/flows/diagnose-crop-disease.ts';
import '@/ai/flows/generate-preventative-measures.ts';
import '@/ai/flows/get-localized-farming-tips.ts';
import '@/ai/flows/agri-bot-chat.ts';
