export const basicShapes = [
  { 
    id: 'rect', 
    name: 'Rectangle', 
    render: 'crop_square', 
    payload: { type: 'shape', shapeType: 'rectangle', width: 120, height: 80, bgColor: '#f1f5f9', borderColor: '#94a3b8', borderWidth: 2, borderRadius: 0 } 
  },
  { 
    id: 'circ', 
    name: 'Circle', 
    render: 'radio_button_unchecked', 
    payload: { type: 'shape', shapeType: 'circle', width: 80, height: 80, bgColor: '#f1f5f9', borderColor: '#94a3b8', borderWidth: 2, borderRadius: 50 } 
  },
  { 
    id: 'line', 
    name: 'Divider Line', 
    render: 'horizontal_rule', 
    payload: { type: 'shape', shapeType: 'line', width: 250, height: 4, bgColor: '#191c1e', borderColor: 'transparent', borderWidth: 0, borderRadius: 0 } 
  },
  { 
    id: 'pill', 
    name: 'Pill / Badge', 
    render: 'medication', 
    payload: { type: 'shape', shapeType: 'rectangle', width: 150, height: 40, bgColor: '#f1f5f9', borderColor: '#94a3b8', borderWidth: 2, borderRadius: 20 } 
  },
  { 
    id: 'square', 
    name: 'Square', 
    render: 'square', 
    payload: { type: 'shape', shapeType: 'rectangle', width: 100, height: 100, bgColor: '#e2e8f0', borderColor: '#64748b', borderWidth: 2, borderRadius: 0 } 
  },
];

export const geometricIcons = [
  "change_history", "details", "pentagon", "hexagon", "emergency", "star", "star_half", "star_outline", "favorite", 
  "favorite_border", "heart_plus", "heart_minus", "diamond", "shield"
];

export const medicalIcons = [
  "medication", "prescriptions", "vaccines", "healing", "medical_services", "bloodtype", "local_hospital", "health_and_safety", 
  "science", "biotech", "coronavirus", "sanitizer", "thermometer", "monitor_heart", "cardiology", "neurology", 
  "pulmonology", "gastroenterology", "ophthalmology", "dentistry", "orthopedics", "pediatrics", "vital_signs", "medical_information",
  "egg", "psychology", "water_drop", "humidity_percentage"
];

export const warningAndInfoIcons = [
  "warning", "error", "info", "help", "dangerous", "gpp_bad", "gpp_good", "gpp_maybe", "verified", "verified_user",
  "eco", "recycling", "cruelty_free", "fire_extinguisher", "electric_bolt", "bolt", "flare", "lightbulb",
  "sunny", "nights_stay", "thermostat", "air", "water", "toys", "thumb_up", "thumb_down", "recommend"
];

export const uiAndLayoutIcons = [
  "add", "remove", "close", "check", "done", "done_all", "add_circle", "remove_circle", 
  "cancel", "check_circle", "unpublished", "published_with_changes", "arrow_back", "arrow_forward", "arrow_upward", "arrow_downward",
  "chevron_left", "chevron_right", "expand_less", "expand_more", "subdirectory_arrow_right", "subdirectory_arrow_left", "refresh", "sync",
  "home", "person", "group", "pets", "elderly", "pregnant_woman", "accessible", "blind", 
  "deaf", "hearing", "visibility", "visibility_off", "settings", "build", "handyman", "pan_tool",
  "shopping_cart", "local_shipping", "store", "restaurant", "local_cafe", "local_dining", "local_drink", "local_pizza",
  "bookmark", "label", "sell", "paid", "credit_card", "account_balance", "account_balance_wallet", "receipt", "qr_code", "barcode_scanner"
];

export const allIcons = [
  ...geometricIcons,
  ...medicalIcons,
  ...warningAndInfoIcons,
  ...uiAndLayoutIcons
];
