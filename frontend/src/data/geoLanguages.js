/**
 * Geo-Language Map: Country → States → Languages
 * Used by the Translation page for the 3-tier dropdown.
 * langCode follows ISO 639-1 and is used by MyMemory translation API.
 */

export const GLOBAL_LANGUAGES = [
  { code: 'en', name: 'English (Global)' },
];

export const GEO_LANGUAGE_DATA = [
  {
    country: 'India',
    code: 'IN',
    states: [
      { name: 'All India', languages: [
        { code: 'hi', name: 'Hindi' },
        { code: 'en', name: 'English' },
        { code: 'ur', name: 'Urdu' },
      ]},
      { name: 'Andhra Pradesh', languages: [{ code: 'te', name: 'Telugu' }, { code: 'en', name: 'English' }]},
      { name: 'Arunachal Pradesh', languages: [{ code: 'as', name: 'Assamese' }, { code: 'en', name: 'English' }]},
      { name: 'Assam', languages: [{ code: 'as', name: 'Assamese' }, { code: 'bn', name: 'Bengali' }, { code: 'en', name: 'English' }]},
      { name: 'Bihar', languages: [{ code: 'hi', name: 'Hindi' }, { code: 'en', name: 'English' }]},
      { name: 'Chhattisgarh', languages: [{ code: 'hi', name: 'Hindi' }, { code: 'en', name: 'English' }]},
      { name: 'Goa', languages: [{ code: 'kok', name: 'Konkani' }, { code: 'en', name: 'English' }]},
      { name: 'Gujarat', languages: [{ code: 'gu', name: 'Gujarati' }, { code: 'en', name: 'English' }]},
      { name: 'Haryana', languages: [{ code: 'hi', name: 'Hindi' }, { code: 'en', name: 'English' }]},
      { name: 'Himachal Pradesh', languages: [{ code: 'hi', name: 'Hindi' }, { code: 'en', name: 'English' }]},
      { name: 'Jharkhand', languages: [{ code: 'hi', name: 'Hindi' }, { code: 'en', name: 'English' }]},
      { name: 'Karnataka', languages: [{ code: 'kn', name: 'Kannada' }, { code: 'en', name: 'English' }]},
      { name: 'Kerala', languages: [{ code: 'ml', name: 'Malayalam' }, { code: 'en', name: 'English' }]},
      { name: 'Madhya Pradesh', languages: [{ code: 'hi', name: 'Hindi' }, { code: 'en', name: 'English' }]},
      { name: 'Maharashtra', languages: [{ code: 'mr', name: 'Marathi' }, { code: 'hi', name: 'Hindi' }, { code: 'en', name: 'English' }]},
      { name: 'Manipur', languages: [{ code: 'mni', name: 'Meitei' }, { code: 'en', name: 'English' }]},
      { name: 'Meghalaya', languages: [{ code: 'kha', name: 'Khasi' }, { code: 'en', name: 'English' }]},
      { name: 'Mizoram', languages: [{ code: 'lus', name: 'Mizo' }, { code: 'en', name: 'English' }]},
      { name: 'Nagaland', languages: [{ code: 'en', name: 'English' }]},
      { name: 'Odisha', languages: [{ code: 'or', name: 'Odia' }, { code: 'en', name: 'English' }]},
      { name: 'Punjab', languages: [{ code: 'pa', name: 'Punjabi' }, { code: 'hi', name: 'Hindi' }, { code: 'en', name: 'English' }]},
      { name: 'Rajasthan', languages: [{ code: 'hi', name: 'Hindi' }, { code: 'en', name: 'English' }]},
      { name: 'Sikkim', languages: [{ code: 'ne', name: 'Nepali' }, { code: 'en', name: 'English' }]},
      { name: 'Tamil Nadu', languages: [{ code: 'ta', name: 'Tamil' }, { code: 'en', name: 'English' }]},
      { name: 'Telangana', languages: [{ code: 'te', name: 'Telugu' }, { code: 'ur', name: 'Urdu' }, { code: 'en', name: 'English' }]},
      { name: 'Tripura', languages: [{ code: 'bn', name: 'Bengali' }, { code: 'en', name: 'English' }]},
      { name: 'Uttar Pradesh', languages: [{ code: 'hi', name: 'Hindi' }, { code: 'ur', name: 'Urdu' }, { code: 'en', name: 'English' }]},
      { name: 'Uttarakhand', languages: [{ code: 'hi', name: 'Hindi' }, { code: 'en', name: 'English' }]},
      { name: 'West Bengal', languages: [{ code: 'bn', name: 'Bengali' }, { code: 'hi', name: 'Hindi' }, { code: 'en', name: 'English' }]},
      { name: 'Delhi (NCT)', languages: [{ code: 'hi', name: 'Hindi' }, { code: 'ur', name: 'Urdu' }, { code: 'pa', name: 'Punjabi' }, { code: 'en', name: 'English' }]},
      { name: 'Jammu & Kashmir', languages: [{ code: 'ks', name: 'Kashmiri' }, { code: 'ur', name: 'Urdu' }, { code: 'hi', name: 'Hindi' }, { code: 'en', name: 'English' }]},
      { name: 'Ladakh', languages: [{ code: 'bo', name: 'Tibetan' }, { code: 'ur', name: 'Urdu' }, { code: 'en', name: 'English' }]},
    ]
  },
  {
    country: 'United States',
    code: 'US',
    states: [
      { name: 'All States', languages: [{ code: 'en', name: 'English' }, { code: 'es', name: 'Spanish' }]},
      { name: 'California', languages: [{ code: 'en', name: 'English' }, { code: 'es', name: 'Spanish' }, { code: 'zh', name: 'Chinese' }]},
      { name: 'Florida', languages: [{ code: 'en', name: 'English' }, { code: 'es', name: 'Spanish' }, { code: 'ht', name: 'Haitian Creole' }]},
      { name: 'New York', languages: [{ code: 'en', name: 'English' }, { code: 'es', name: 'Spanish' }, { code: 'zh', name: 'Chinese' }]},
      { name: 'Texas', languages: [{ code: 'en', name: 'English' }, { code: 'es', name: 'Spanish' }]},
      { name: 'Illinois', languages: [{ code: 'en', name: 'English' }, { code: 'es', name: 'Spanish' }, { code: 'pl', name: 'Polish' }]},
    ]
  },
  {
    country: 'United Kingdom',
    code: 'GB',
    states: [
      { name: 'All Regions', languages: [{ code: 'en', name: 'English' }]},
      { name: 'England', languages: [{ code: 'en', name: 'English' }]},
      { name: 'Scotland', languages: [{ code: 'en', name: 'English' }, { code: 'gd', name: 'Scottish Gaelic' }]},
      { name: 'Wales', languages: [{ code: 'en', name: 'English' }, { code: 'cy', name: 'Welsh' }]},
      { name: 'Northern Ireland', languages: [{ code: 'en', name: 'English' }, { code: 'ga', name: 'Irish' }]},
    ]
  },
  {
    country: 'Germany',
    code: 'DE',
    states: [
      { name: 'All States', languages: [{ code: 'de', name: 'German' }, { code: 'en', name: 'English' }]},
      { name: 'Bavaria', languages: [{ code: 'de', name: 'German' }, { code: 'en', name: 'English' }]},
      { name: 'Berlin', languages: [{ code: 'de', name: 'German' }, { code: 'en', name: 'English' }]},
      { name: 'Hamburg', languages: [{ code: 'de', name: 'German' }, { code: 'en', name: 'English' }]},
    ]
  },
  {
    country: 'France',
    code: 'FR',
    states: [
      { name: 'All Regions', languages: [{ code: 'fr', name: 'French' }, { code: 'en', name: 'English' }]},
      { name: 'Île-de-France', languages: [{ code: 'fr', name: 'French' }, { code: 'en', name: 'English' }]},
      { name: 'Occitanie', languages: [{ code: 'fr', name: 'French' }, { code: 'oc', name: 'Occitan' }, { code: 'en', name: 'English' }]},
      { name: 'Bretagne', languages: [{ code: 'fr', name: 'French' }, { code: 'br', name: 'Breton' }, { code: 'en', name: 'English' }]},
    ]
  },
  {
    country: 'China',
    code: 'CN',
    states: [
      { name: 'All Provinces', languages: [{ code: 'zh', name: 'Mandarin (Simplified)' }]},
      { name: 'Beijing', languages: [{ code: 'zh', name: 'Mandarin (Simplified)' }, { code: 'en', name: 'English' }]},
      { name: 'Shanghai', languages: [{ code: 'zh', name: 'Mandarin (Simplified)' }, { code: 'en', name: 'English' }]},
      { name: 'Guangdong', languages: [{ code: 'zh', name: 'Mandarin (Simplified)' }, { code: 'zh-TW', name: 'Cantonese' }, { code: 'en', name: 'English' }]},
      { name: 'Hong Kong (SAR)', languages: [{ code: 'zh-TW', name: 'Cantonese (Traditional)' }, { code: 'en', name: 'English' }]},
      { name: 'Tibet (Xizang)', languages: [{ code: 'bo', name: 'Tibetan' }, { code: 'zh', name: 'Mandarin' }]},
    ]
  },
  {
    country: 'Japan',
    code: 'JP',
    states: [
      { name: 'All Prefectures', languages: [{ code: 'ja', name: 'Japanese' }, { code: 'en', name: 'English' }]},
      { name: 'Tokyo', languages: [{ code: 'ja', name: 'Japanese' }, { code: 'en', name: 'English' }]},
      { name: 'Osaka', languages: [{ code: 'ja', name: 'Japanese' }, { code: 'en', name: 'English' }]},
    ]
  },
  {
    country: 'Brazil',
    code: 'BR',
    states: [
      { name: 'All States', languages: [{ code: 'pt', name: 'Portuguese' }, { code: 'en', name: 'English' }]},
      { name: 'São Paulo', languages: [{ code: 'pt', name: 'Portuguese' }, { code: 'en', name: 'English' }]},
      { name: 'Rio de Janeiro', languages: [{ code: 'pt', name: 'Portuguese' }, { code: 'en', name: 'English' }]},
      { name: 'Amazonas', languages: [{ code: 'pt', name: 'Portuguese' }]},
    ]
  },
  {
    country: 'Spain',
    code: 'ES',
    states: [
      { name: 'All Regions', languages: [{ code: 'es', name: 'Spanish' }, { code: 'en', name: 'English' }]},
      { name: 'Catalonia', languages: [{ code: 'es', name: 'Spanish' }, { code: 'ca', name: 'Catalan' }, { code: 'en', name: 'English' }]},
      { name: 'Galicia', languages: [{ code: 'es', name: 'Spanish' }, { code: 'gl', name: 'Galician' }, { code: 'en', name: 'English' }]},
      { name: 'Basque Country', languages: [{ code: 'es', name: 'Spanish' }, { code: 'eu', name: 'Basque' }, { code: 'en', name: 'English' }]},
      { name: 'Madrid', languages: [{ code: 'es', name: 'Spanish' }, { code: 'en', name: 'English' }]},
    ]
  },
  {
    country: 'Russia',
    code: 'RU',
    states: [
      { name: 'All Federal Subjects', languages: [{ code: 'ru', name: 'Russian' }, { code: 'en', name: 'English' }]},
      { name: 'Moscow', languages: [{ code: 'ru', name: 'Russian' }, { code: 'en', name: 'English' }]},
      { name: 'Saint Petersburg', languages: [{ code: 'ru', name: 'Russian' }, { code: 'en', name: 'English' }]},
      { name: 'Tatarstan', languages: [{ code: 'ru', name: 'Russian' }, { code: 'tt', name: 'Tatar' }]},
    ]
  },
  {
    country: 'South Korea',
    code: 'KR',
    states: [
      { name: 'All Provinces', languages: [{ code: 'ko', name: 'Korean' }, { code: 'en', name: 'English' }]},
      { name: 'Seoul', languages: [{ code: 'ko', name: 'Korean' }, { code: 'en', name: 'English' }]},
      { name: 'Busan', languages: [{ code: 'ko', name: 'Korean' }, { code: 'en', name: 'English' }]},
    ]
  },
  {
    country: 'Saudi Arabia',
    code: 'SA',
    states: [
      { name: 'All Regions', languages: [{ code: 'ar', name: 'Arabic' }, { code: 'en', name: 'English' }]},
      { name: 'Riyadh', languages: [{ code: 'ar', name: 'Arabic' }, { code: 'en', name: 'English' }]},
      { name: 'Makkah', languages: [{ code: 'ar', name: 'Arabic' }, { code: 'en', name: 'English' }]},
      { name: 'Eastern Province', languages: [{ code: 'ar', name: 'Arabic' }, { code: 'en', name: 'English' }]},
    ]
  },
  {
    country: 'United Arab Emirates',
    code: 'AE',
    states: [
      { name: 'All Emirates', languages: [{ code: 'ar', name: 'Arabic' }, { code: 'en', name: 'English' }]},
      { name: 'Dubai', languages: [{ code: 'ar', name: 'Arabic' }, { code: 'en', name: 'English' }]},
      { name: 'Abu Dhabi', languages: [{ code: 'ar', name: 'Arabic' }, { code: 'en', name: 'English' }]},
      { name: 'Sharjah', languages: [{ code: 'ar', name: 'Arabic' }, { code: 'en', name: 'English' }]},
    ]
  },
  {
    country: 'Australia',
    code: 'AU',
    states: [
      { name: 'All States', languages: [{ code: 'en', name: 'English' }]},
      { name: 'New South Wales', languages: [{ code: 'en', name: 'English' }, { code: 'zh', name: 'Chinese' }]},
      { name: 'Victoria', languages: [{ code: 'en', name: 'English' }, { code: 'el', name: 'Greek' }]},
      { name: 'Queensland', languages: [{ code: 'en', name: 'English' }]},
      { name: 'Western Australia', languages: [{ code: 'en', name: 'English' }]},
    ]
  },
  {
    country: 'Canada',
    code: 'CA',
    states: [
      { name: 'All Provinces', languages: [{ code: 'en', name: 'English' }, { code: 'fr', name: 'French' }]},
      { name: 'Ontario', languages: [{ code: 'en', name: 'English' }, { code: 'fr', name: 'French' }]},
      { name: 'Quebec', languages: [{ code: 'fr', name: 'French' }, { code: 'en', name: 'English' }]},
      { name: 'British Columbia', languages: [{ code: 'en', name: 'English' }, { code: 'zh', name: 'Chinese' }]},
      { name: 'Alberta', languages: [{ code: 'en', name: 'English' }]},
    ]
  },
  {
    country: 'Mexico',
    code: 'MX',
    states: [
      { name: 'All States', languages: [{ code: 'es', name: 'Spanish' }, { code: 'en', name: 'English' }]},
      { name: 'Mexico City (CDMX)', languages: [{ code: 'es', name: 'Spanish' }, { code: 'en', name: 'English' }]},
      { name: 'Oaxaca', languages: [{ code: 'es', name: 'Spanish' }, { code: 'za', name: 'Zapotec' }]},
      { name: 'Jalisco', languages: [{ code: 'es', name: 'Spanish' }, { code: 'en', name: 'English' }]},
    ]
  },
  {
    country: 'Italy',
    code: 'IT',
    states: [
      { name: 'All Regions', languages: [{ code: 'it', name: 'Italian' }, { code: 'en', name: 'English' }]},
      { name: 'Lombardy', languages: [{ code: 'it', name: 'Italian' }, { code: 'en', name: 'English' }]},
      { name: 'Lazio', languages: [{ code: 'it', name: 'Italian' }, { code: 'en', name: 'English' }]},
      { name: 'Sicily', languages: [{ code: 'it', name: 'Italian' }, { code: 'scn', name: 'Sicilian' }, { code: 'en', name: 'English' }]},
    ]
  },
  {
    country: 'Turkey',
    code: 'TR',
    states: [
      { name: 'All Provinces', languages: [{ code: 'tr', name: 'Turkish' }, { code: 'en', name: 'English' }]},
      { name: 'Istanbul', languages: [{ code: 'tr', name: 'Turkish' }, { code: 'en', name: 'English' }]},
      { name: 'Ankara', languages: [{ code: 'tr', name: 'Turkish' }, { code: 'en', name: 'English' }]},
      { name: 'Izmir', languages: [{ code: 'tr', name: 'Turkish' }, { code: 'en', name: 'English' }]},
    ]
  },
  {
    country: 'Egypt',
    code: 'EG',
    states: [
      { name: 'All Governorates', languages: [{ code: 'ar', name: 'Arabic' }, { code: 'en', name: 'English' }]},
      { name: 'Cairo', languages: [{ code: 'ar', name: 'Arabic' }, { code: 'en', name: 'English' }]},
      { name: 'Alexandria', languages: [{ code: 'ar', name: 'Arabic' }, { code: 'en', name: 'English' }]},
    ]
  },
  {
    country: 'Bangladesh',
    code: 'BD',
    states: [
      { name: 'All Divisions', languages: [{ code: 'bn', name: 'Bengali' }, { code: 'en', name: 'English' }]},
      { name: 'Dhaka', languages: [{ code: 'bn', name: 'Bengali' }, { code: 'en', name: 'English' }]},
      { name: 'Chittagong', languages: [{ code: 'bn', name: 'Bengali' }, { code: 'en', name: 'English' }]},
    ]
  },
  {
    country: 'Pakistan',
    code: 'PK',
    states: [
      { name: 'All Provinces', languages: [{ code: 'ur', name: 'Urdu' }, { code: 'en', name: 'English' }]},
      { name: 'Punjab', languages: [{ code: 'pa', name: 'Punjabi' }, { code: 'ur', name: 'Urdu' }, { code: 'en', name: 'English' }]},
      { name: 'Sindh', languages: [{ code: 'sd', name: 'Sindhi' }, { code: 'ur', name: 'Urdu' }, { code: 'en', name: 'English' }]},
      { name: 'Khyber Pakhtunkhwa', languages: [{ code: 'ps', name: 'Pashto' }, { code: 'ur', name: 'Urdu' }, { code: 'en', name: 'English' }]},
      { name: 'Balochistan', languages: [{ code: 'bal', name: 'Balochi' }, { code: 'ur', name: 'Urdu' }, { code: 'en', name: 'English' }]},
      { name: 'Islamabad', languages: [{ code: 'ur', name: 'Urdu' }, { code: 'en', name: 'English' }]},
    ]
  },
  {
    country: 'South Africa',
    code: 'ZA',
    states: [
      { name: 'All Provinces', languages: [{ code: 'af', name: 'Afrikaans' }, { code: 'en', name: 'English' }, { code: 'zu', name: 'Zulu' }]},
      { name: 'Gauteng', languages: [{ code: 'af', name: 'Afrikaans' }, { code: 'en', name: 'English' }, { code: 'zu', name: 'Zulu' }]},
      { name: 'KwaZulu-Natal', languages: [{ code: 'zu', name: 'Zulu' }, { code: 'en', name: 'English' }]},
      { name: 'Western Cape', languages: [{ code: 'af', name: 'Afrikaans' }, { code: 'en', name: 'English' }, { code: 'xh', name: 'Xhosa' }]},
    ]
  },
  {
    country: 'Nigeria',
    code: 'NG',
    states: [
      { name: 'All States', languages: [{ code: 'en', name: 'English' }, { code: 'yo', name: 'Yoruba' }, { code: 'ha', name: 'Hausa' }, { code: 'ig', name: 'Igbo' }]},
      { name: 'Lagos', languages: [{ code: 'en', name: 'English' }, { code: 'yo', name: 'Yoruba' }]},
      { name: 'Kano', languages: [{ code: 'en', name: 'English' }, { code: 'ha', name: 'Hausa' }]},
      { name: 'Abuja (FCT)', languages: [{ code: 'en', name: 'English' }]},
    ]
  },
  {
    country: 'Indonesia',
    code: 'ID',
    states: [
      { name: 'All Provinces', languages: [{ code: 'id', name: 'Indonesian' }, { code: 'en', name: 'English' }]},
      { name: 'Java', languages: [{ code: 'id', name: 'Indonesian' }, { code: 'jv', name: 'Javanese' }, { code: 'en', name: 'English' }]},
      { name: 'Bali', languages: [{ code: 'id', name: 'Indonesian' }, { code: 'ban', name: 'Balinese' }, { code: 'en', name: 'English' }]},
      { name: 'Sumatra', languages: [{ code: 'id', name: 'Indonesian' }, { code: 'en', name: 'English' }]},
    ]
  },
  {
    country: 'Thailand',
    code: 'TH',
    states: [
      { name: 'All Provinces', languages: [{ code: 'th', name: 'Thai' }, { code: 'en', name: 'English' }]},
      { name: 'Bangkok', languages: [{ code: 'th', name: 'Thai' }, { code: 'en', name: 'English' }]},
      { name: 'Chiang Mai', languages: [{ code: 'th', name: 'Thai' }, { code: 'en', name: 'English' }]},
    ]
  },
  {
    country: 'Argentina',
    code: 'AR',
    states: [
      { name: 'All Provinces', languages: [{ code: 'es', name: 'Spanish' }, { code: 'en', name: 'English' }]},
      { name: 'Buenos Aires', languages: [{ code: 'es', name: 'Spanish' }, { code: 'en', name: 'English' }]},
      { name: 'Córdoba', languages: [{ code: 'es', name: 'Spanish' }, { code: 'en', name: 'English' }]},
    ]
  },
  {
    country: 'Poland',
    code: 'PL',
    states: [
      { name: 'All Voivodeships', languages: [{ code: 'pl', name: 'Polish' }, { code: 'en', name: 'English' }]},
      { name: 'Masovian', languages: [{ code: 'pl', name: 'Polish' }, { code: 'en', name: 'English' }]},
      { name: 'Silesian', languages: [{ code: 'pl', name: 'Polish' }, { code: 'szl', name: 'Silesian' }, { code: 'en', name: 'English' }]},
    ]
  },
  {
    country: 'Netherlands',
    code: 'NL',
    states: [
      { name: 'All Provinces', languages: [{ code: 'nl', name: 'Dutch' }, { code: 'en', name: 'English' }]},
      { name: 'North Holland', languages: [{ code: 'nl', name: 'Dutch' }, { code: 'en', name: 'English' }]},
      { name: 'Friesland', languages: [{ code: 'nl', name: 'Dutch' }, { code: 'fy', name: 'Frisian' }, { code: 'en', name: 'English' }]},
    ]
  },
  {
    country: 'Sweden',
    code: 'SE',
    states: [
      { name: 'All Counties', languages: [{ code: 'sv', name: 'Swedish' }, { code: 'en', name: 'English' }]},
      { name: 'Stockholm', languages: [{ code: 'sv', name: 'Swedish' }, { code: 'en', name: 'English' }]},
    ]
  },
  {
    country: 'Belgium',
    code: 'BE',
    states: [
      { name: 'All Regions', languages: [{ code: 'nl', name: 'Dutch' }, { code: 'fr', name: 'French' }, { code: 'de', name: 'German' }, { code: 'en', name: 'English' }]},
      { name: 'Flanders', languages: [{ code: 'nl', name: 'Dutch' }, { code: 'en', name: 'English' }]},
      { name: 'Wallonia', languages: [{ code: 'fr', name: 'French' }, { code: 'de', name: 'German' }, { code: 'en', name: 'English' }]},
      { name: 'Brussels', languages: [{ code: 'nl', name: 'Dutch' }, { code: 'fr', name: 'French' }, { code: 'en', name: 'English' }]},
    ]
  },
  {
    country: 'Switzerland',
    code: 'CH',
    states: [
      { name: 'All Cantons', languages: [{ code: 'de', name: 'German' }, { code: 'fr', name: 'French' }, { code: 'it', name: 'Italian' }, { code: 'en', name: 'English' }]},
      { name: 'Zurich', languages: [{ code: 'de', name: 'German' }, { code: 'en', name: 'English' }]},
      { name: 'Geneva', languages: [{ code: 'fr', name: 'French' }, { code: 'en', name: 'English' }]},
      { name: 'Bern', languages: [{ code: 'de', name: 'German' }, { code: 'fr', name: 'French' }, { code: 'en', name: 'English' }]},
    ]
  },
  {
    country: 'Israel',
    code: 'IL',
    states: [
      { name: 'All Districts', languages: [{ code: 'he', name: 'Hebrew' }, { code: 'ar', name: 'Arabic' }, { code: 'en', name: 'English' }]},
      { name: 'Tel Aviv', languages: [{ code: 'he', name: 'Hebrew' }, { code: 'en', name: 'English' }]},
      { name: 'Jerusalem', languages: [{ code: 'he', name: 'Hebrew' }, { code: 'ar', name: 'Arabic' }, { code: 'en', name: 'English' }]},
    ]
  },
  {
    country: 'Iran',
    code: 'IR',
    states: [
      { name: 'All Provinces', languages: [{ code: 'fa', name: 'Persian' }, { code: 'en', name: 'English' }]},
      { name: 'Tehran', languages: [{ code: 'fa', name: 'Persian' }, { code: 'en', name: 'English' }]},
      { name: 'Isfahan', languages: [{ code: 'fa', name: 'Persian' }, { code: 'en', name: 'English' }]},
    ]
  },
  {
    country: 'Sri Lanka',
    code: 'LK',
    states: [
      { name: 'All Provinces', languages: [{ code: 'si', name: 'Sinhala' }, { code: 'ta', name: 'Tamil' }, { code: 'en', name: 'English' }]},
      { name: 'Western Province', languages: [{ code: 'si', name: 'Sinhala' }, { code: 'ta', name: 'Tamil' }, { code: 'en', name: 'English' }]},
      { name: 'Northern Province', languages: [{ code: 'ta', name: 'Tamil' }, { code: 'en', name: 'English' }]},
    ]
  },
  {
    country: 'Nepal',
    code: 'NP',
    states: [
      { name: 'All Provinces', languages: [{ code: 'ne', name: 'Nepali' }, { code: 'en', name: 'English' }]},
      { name: 'Bagmati Province', languages: [{ code: 'ne', name: 'Nepali' }, { code: 'en', name: 'English' }]},
    ]
  },
  {
    country: 'Myanmar',
    code: 'MM',
    states: [
      { name: 'All States', languages: [{ code: 'my', name: 'Burmese' }, { code: 'en', name: 'English' }]},
      { name: 'Yangon', languages: [{ code: 'my', name: 'Burmese' }, { code: 'en', name: 'English' }]},
    ]
  },
  {
    country: 'Vietnam',
    code: 'VN',
    states: [
      { name: 'All Provinces', languages: [{ code: 'vi', name: 'Vietnamese' }, { code: 'en', name: 'English' }]},
      { name: 'Hanoi', languages: [{ code: 'vi', name: 'Vietnamese' }, { code: 'en', name: 'English' }]},
      { name: 'Ho Chi Minh City', languages: [{ code: 'vi', name: 'Vietnamese' }, { code: 'en', name: 'English' }]},
    ]
  },
  {
    country: 'Philippines',
    code: 'PH',
    states: [
      { name: 'All Regions', languages: [{ code: 'tl', name: 'Filipino (Tagalog)' }, { code: 'en', name: 'English' }]},
      { name: 'NCR (Manila)', languages: [{ code: 'tl', name: 'Filipino' }, { code: 'en', name: 'English' }]},
      { name: 'Cebu', languages: [{ code: 'ceb', name: 'Cebuano' }, { code: 'en', name: 'English' }]},
    ]
  },
  {
    country: 'Malaysia',
    code: 'MY',
    states: [
      { name: 'All States', languages: [{ code: 'ms', name: 'Malay' }, { code: 'en', name: 'English' }, { code: 'zh', name: 'Chinese' }, { code: 'ta', name: 'Tamil' }]},
      { name: 'Kuala Lumpur', languages: [{ code: 'ms', name: 'Malay' }, { code: 'en', name: 'English' }, { code: 'zh', name: 'Chinese' }]},
      { name: 'Sarawak', languages: [{ code: 'ms', name: 'Malay' }, { code: 'en', name: 'English' }]},
    ]
  },
  {
    country: 'Singapore',
    code: 'SG',
    states: [
      { name: 'Singapore', languages: [{ code: 'en', name: 'English' }, { code: 'ms', name: 'Malay' }, { code: 'zh', name: 'Chinese (Mandarin)' }, { code: 'ta', name: 'Tamil' }]},
    ]
  },
  {
    country: 'Kenya',
    code: 'KE',
    states: [
      { name: 'All Counties', languages: [{ code: 'sw', name: 'Swahili' }, { code: 'en', name: 'English' }]},
      { name: 'Nairobi', languages: [{ code: 'sw', name: 'Swahili' }, { code: 'en', name: 'English' }]},
    ]
  },
  {
    country: 'Ethiopia',
    code: 'ET',
    states: [
      { name: 'All Regions', languages: [{ code: 'am', name: 'Amharic' }, { code: 'en', name: 'English' }]},
      { name: 'Addis Ababa', languages: [{ code: 'am', name: 'Amharic' }, { code: 'en', name: 'English' }]},
    ]
  },
  {
    country: 'Ukraine',
    code: 'UA',
    states: [
      { name: 'All Oblasts', languages: [{ code: 'uk', name: 'Ukrainian' }, { code: 'en', name: 'English' }]},
      { name: 'Kyiv', languages: [{ code: 'uk', name: 'Ukrainian' }, { code: 'en', name: 'English' }]},
    ]
  },
  {
    country: 'Portugal',
    code: 'PT',
    states: [
      { name: 'All Districts', languages: [{ code: 'pt', name: 'Portuguese' }, { code: 'en', name: 'English' }]},
      { name: 'Lisbon', languages: [{ code: 'pt', name: 'Portuguese' }, { code: 'en', name: 'English' }]},
    ]
  },
  {
    country: 'Greece',
    code: 'GR',
    states: [
      { name: 'All Regions', languages: [{ code: 'el', name: 'Greek' }, { code: 'en', name: 'English' }]},
      { name: 'Attica', languages: [{ code: 'el', name: 'Greek' }, { code: 'en', name: 'English' }]},
    ]
  },
  {
    country: 'Czech Republic',
    code: 'CZ',
    states: [
      { name: 'All Regions', languages: [{ code: 'cs', name: 'Czech' }, { code: 'en', name: 'English' }]},
      { name: 'Prague', languages: [{ code: 'cs', name: 'Czech' }, { code: 'en', name: 'English' }]},
    ]
  },
  {
    country: 'Hungary',
    code: 'HU',
    states: [
      { name: 'All Counties', languages: [{ code: 'hu', name: 'Hungarian' }, { code: 'en', name: 'English' }]},
      { name: 'Budapest', languages: [{ code: 'hu', name: 'Hungarian' }, { code: 'en', name: 'English' }]},
    ]
  },
  {
    country: 'Romania',
    code: 'RO',
    states: [
      { name: 'All Counties', languages: [{ code: 'ro', name: 'Romanian' }, { code: 'en', name: 'English' }]},
      { name: 'Bucharest', languages: [{ code: 'ro', name: 'Romanian' }, { code: 'en', name: 'English' }]},
    ]
  },
  {
    country: 'Denmark',
    code: 'DK',
    states: [
      { name: 'All Regions', languages: [{ code: 'da', name: 'Danish' }, { code: 'en', name: 'English' }]},
      { name: 'Capital Region', languages: [{ code: 'da', name: 'Danish' }, { code: 'en', name: 'English' }]},
    ]
  },
  {
    country: 'Norway',
    code: 'NO',
    states: [
      { name: 'All Counties', languages: [{ code: 'no', name: 'Norwegian' }, { code: 'en', name: 'English' }]},
      { name: 'Oslo', languages: [{ code: 'no', name: 'Norwegian' }, { code: 'en', name: 'English' }]},
    ]
  },
  {
    country: 'Finland',
    code: 'FI',
    states: [
      { name: 'All Regions', languages: [{ code: 'fi', name: 'Finnish' }, { code: 'sv', name: 'Swedish' }, { code: 'en', name: 'English' }]},
      { name: 'Uusimaa', languages: [{ code: 'fi', name: 'Finnish' }, { code: 'en', name: 'English' }]},
    ]
  },
];

export const ELEMENT_TYPE_LABELS = {
  text: 'Text',
  table: 'Table',
  subtext: 'Sub Text',
  warnings: 'Warning',
  dosage: 'Dosage',
  expiry: 'Expiry / Batch',
  manufacturing: 'Manufacturing',
  storage: 'Storage',
};

export const TRANSLATABLE_TYPES = Object.keys(ELEMENT_TYPE_LABELS);
