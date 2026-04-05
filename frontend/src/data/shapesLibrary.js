export const basicShapes = [
  { 
    id: 'rect', 
    name: 'Rectangle', 
    render: 'crop_square', 
    payload: { type: 'shape', shapeType: 'rectangle', width: 120, height: 80, bgColor: 'transparent', borderColor: '#191c1e', borderWidth: 2, borderStyle: 'solid', borderRadius: 0 } 
  },
  { 
    id: 'circ', 
    name: 'Circle', 
    render: 'radio_button_unchecked', 
    payload: { type: 'shape', shapeType: 'circle', width: 80, height: 80, bgColor: 'transparent', borderColor: '#191c1e', borderWidth: 2, borderStyle: 'solid', borderRadius: 50 } 
  },
  { 
    id: 'line', 
    name: 'Divider Line', 
    render: 'horizontal_rule', 
    payload: { type: 'shape', shapeType: 'line', width: 250, height: 4, bgColor: '#191c1e', borderColor: 'transparent', borderWidth: 0, borderStyle: 'solid', borderRadius: 0 } 
  },
  { 
    id: 'pill', 
    name: 'Pill / Badge', 
    render: 'medication', 
    payload: { type: 'shape', shapeType: 'rectangle', width: 150, height: 40, bgColor: 'transparent', borderColor: '#191c1e', borderWidth: 2, borderStyle: 'solid', borderRadius: 20 } 
  },
  { 
    id: 'square', 
    name: 'Square', 
    render: 'square', 
    payload: { type: 'shape', shapeType: 'rectangle', width: 100, height: 100, bgColor: 'transparent', borderColor: '#191c1e', borderWidth: 2, borderStyle: 'solid', borderRadius: 0 } 
  },
];

export const geometricIcons = [
  "change_history", "details", "pentagon", "hexagon", "emergency", "star", "star_half", "star_outline", "favorite", 
  "favorite_border", "heart_plus", "heart_minus", "diamond", "shield"
];

export const medicalIcons = [
  // Standard symbols only
  "medication", "pill", "vaccines", "healing", "medical_services", "bloodtype", "local_hospital", "health_and_safety", 
  "science", "biotech", "coronavirus", "sanitizer", "thermometer", "monitor_heart", "cardiology", "neurology", 
  "pulmonology", "gastroenterology", "ophthalmology", "dentistry", "orthopedics", "pediatrics", "vital_signs", "medical_information",
  "psychology", "water_drop", "humidity_percentage", "warning", "error", "dangerous", "inventory", "verified", "eco", "recycling"
];




export const warningAndInfoIcons = [
  "warning", "error", "info", "help", "dangerous", "gpp_good", "verified",
  "eco", "recycling", "bolt", "sunny", "thermostat", "air", "water", "thumb_up"
];

export const uiAndLayoutIcons = [
  "add", "remove", "close", "check", "done", "add_circle", "remove_circle", 
  "cancel", "check_circle", "arrow_back", "arrow_forward", "arrow_upward", "arrow_downward",
  "refresh", "sync", "home", "person", "group", "visibility", "visibility_off", "settings", 
  "shopping_cart", "local_shipping", "store", "label", "sell", "paid", "credit_card", "receipt", "qr_code"
];


export const allIcons = [
  ...new Set([
    ...geometricIcons,
    ...medicalIcons,
    ...warningAndInfoIcons,
    ...uiAndLayoutIcons
  ])
];

