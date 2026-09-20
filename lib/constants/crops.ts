export interface CropDefinition {
  key: string
  en: string
  hi: string
}

export const CROPS: CropDefinition[] = [
  // Cereals & Grains
  { key: 'Wheat', en: 'Wheat', hi: 'गेहूं' },
  { key: 'Wheat (Sharbati)', en: 'Wheat (Sharbati)', hi: 'गेहूं (शरबती)' },
  { key: 'Rice', en: 'Rice', hi: 'चावल' },
  { key: 'Rice (Basmati)', en: 'Rice (Basmati)', hi: 'चावल (बासमती)' },
  { key: 'Rice (Paddy)', en: 'Rice (Paddy)', hi: 'धान' },
  { key: 'Maize', en: 'Maize', hi: 'मक्का' },
  { key: 'Bajra', en: 'Bajra (Pearl Millet)', hi: 'बाजरा' },
  { key: 'Jowar', en: 'Jowar (Sorghum)', hi: 'ज्वार' },
  { key: 'Barley', en: 'Barley', hi: 'जौ' },

  // Pulses & Legumes
  { key: 'Gram (Chana)', en: 'Gram (Chana)', hi: 'चना' },
  { key: 'Soybean', en: 'Soybean', hi: 'सोयाबीन' },
  { key: 'Mustard', en: 'Mustard', hi: 'सरसों' },
  { key: 'Moong Dal', en: 'Moong Dal (Green Gram)', hi: 'मूंग दाल' },
  { key: 'Urad Dal', en: 'Urad Dal (Black Gram)', hi: 'उड़द दाल' },
  { key: 'Tur Dal', en: 'Tur Dal (Pigeon Pea)', hi: 'अरहर / तुअर दाल' },
  { key: 'Groundnut', en: 'Groundnut (Peanut)', hi: 'मूंगफली' },

  // Vegetables
  { key: 'Onion', en: 'Onion', hi: 'प्याज' },
  { key: 'Potato', en: 'Potato', hi: 'आलू' },
  { key: 'Tomato', en: 'Tomato', hi: 'टमाटर' },
  { key: 'Garlic', en: 'Garlic', hi: 'लहसुन' },
  { key: 'Ginger', en: 'Ginger', hi: 'अदरक' },
  { key: 'Chilli', en: 'Green Chilli', hi: 'हरी मिर्च' },
  { key: 'Dry Red Chilli', en: 'Dry Red Chilli', hi: 'लाल मिर्च' },
  { key: 'Turmeric', en: 'Turmeric', hi: 'हल्दी' },
  { key: 'Cabbage', en: 'Cabbage', hi: 'पत्तागोभी' },
  { key: 'Cauliflower', en: 'Cauliflower', hi: 'फूलगोभी' },
  { key: 'Brinjal', en: 'Brinjal (Eggplant)', hi: 'बैंगन' },
  { key: 'Okra', en: 'Okra (Bhindi)', hi: 'भिंडी' },
  { key: 'Carrot', en: 'Carrot', hi: 'गाजर' },
  { key: 'Radish', en: 'Radish', hi: 'मूली' },
  { key: 'Peas', en: 'Green Peas', hi: 'मटर' },
  { key: 'Coriander', en: 'Coriander', hi: 'धनिया' },
  { key: 'Fenugreek', en: 'Fenugreek (Methi)', hi: 'मेथी' },

  // Fruits
  { key: 'Apple', en: 'Apple', hi: 'सेब' },
  { key: 'Banana', en: 'Banana', hi: 'केला' },
  { key: 'Mango', en: 'Mango', hi: 'आम' },
  { key: 'Pomegranate', en: 'Pomegranate', hi: 'अनार' },
  { key: 'Orange', en: 'Orange', hi: 'संतरा' },
  { key: 'Grapes', en: 'Grapes', hi: 'अंगूर' },
  { key: 'Papaya', en: 'Papaya', hi: 'पपीता' },
  { key: 'Guava', en: 'Guava', hi: 'अमरूद' },
  { key: 'Lemon', en: 'Lemon', hi: 'नींबू' },
  { key: 'Watermelon', en: 'Watermelon', hi: 'तरबूज' },

  // Cash Crops & Spices
  { key: 'Cotton', en: 'Cotton', hi: 'कपास' },
  { key: 'Sugarcane', en: 'Sugarcane', hi: 'गन्ना' },
  { key: 'Tea', en: 'Tea', hi: 'चायपत्ती' },
  { key: 'Coffee', en: 'Coffee', hi: 'कॉफ़ी' },
  { key: 'Coconut', en: 'Coconut', hi: 'नारियल' },
  { key: 'Cumin', en: 'Cumin (Jeera)', hi: 'जीरा' },
  { key: 'Cardamom', en: 'Cardamom (Elaichi)', hi: 'इलायची' },
  { key: 'Black Pepper', en: 'Black Pepper (Kali Mirch)', hi: 'काली मिर्च' }
]

const CROP_MAP = new Map<string, CropDefinition>()
for (const crop of CROPS) {
  CROP_MAP.set(crop.key.toLowerCase(), crop)
  CROP_MAP.set(crop.en.toLowerCase(), crop)
}

/**
 * Returns localized name for a crop key or English name.
 * Falls back to original input string if not found.
 */
export function getCropDisplayName(cropName: string | undefined | null, locale: string): string {
  if (!cropName) return ''
  const trimmed = cropName.trim()
  const match = CROP_MAP.get(trimmed.toLowerCase())
  if (!match) return trimmed
  return locale === 'hi' ? match.hi : match.en
}
