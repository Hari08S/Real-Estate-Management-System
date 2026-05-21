import indiaData from './india-districts.json';

export const STATES = [
    { value: 'Andhra Pradesh', label: 'Andhra Pradesh' },
    { value: 'Arunachal Pradesh', label: 'Arunachal Pradesh' },
    { value: 'Assam', label: 'Assam' },
    { value: 'Bihar', label: 'Bihar' },
    { value: 'Chhattisgarh', label: 'Chhattisgarh' },
    { value: 'Goa', label: 'Goa' },
    { value: 'Gujarat', label: 'Gujarat' },
    { value: 'Haryana', label: 'Haryana' },
    { value: 'Himachal Pradesh', label: 'Himachal Pradesh' },
    { value: 'Jharkhand', label: 'Jharkhand' },
    { value: 'Karnataka', label: 'Karnataka' },
    { value: 'Kerala', label: 'Kerala' },
    { value: 'Madhya Pradesh', label: 'Madhya Pradesh' },
    { value: 'Maharashtra', label: 'Maharashtra' },
    { value: 'Manipur', label: 'Manipur' },
    { value: 'Meghalaya', label: 'Meghalaya' },
    { value: 'Mizoram', label: 'Mizoram' },
    { value: 'Nagaland', label: 'Nagaland' },
    { value: 'Odisha', label: 'Odisha' },
    { value: 'Punjab', label: 'Punjab' },
    { value: 'Rajasthan', label: 'Rajasthan' },
    { value: 'Sikkim', label: 'Sikkim' },
    { value: 'Tamil Nadu', label: 'Tamil Nadu' },
    { value: 'Telangana', label: 'Telangana' },
    { value: 'Tripura', label: 'Tripura' },
    { value: 'Uttar Pradesh', label: 'Uttar Pradesh' },
    { value: 'Uttarakhand', label: 'Uttarakhand' },
    { value: 'West Bengal', label: 'West Bengal' },
    { value: 'Andaman and Nicobar Islands', label: 'Andaman and Nicobar Islands' },
    { value: 'Chandigarh', label: 'Chandigarh' },
    { value: 'Dadra and Nagar Haveli and Daman and Diu', label: 'Dadra and Nagar Haveli and Daman and Diu' },
    { value: 'Delhi', label: 'Delhi' },
    { value: 'Jammu and Kashmir', label: 'Jammu and Kashmir' },
    { value: 'Ladakh', label: 'Ladakh' },
    { value: 'Lakshadweep', label: 'Lakshadweep' },
    { value: 'Puducherry', label: 'Puducherry' },
];

/** Map app state names to keys in india-districts.json */
const JSON_STATE_ALIASES = {
    'Delhi': 'Delhi (NCT)',
    'Chandigarh': 'Chandigarh (UT)',
    'Puducherry': 'Puducherry (UT)',
    'Lakshadweep': 'Lakshadweep (UT)',
    'Dadra and Nagar Haveli and Daman and Diu': 'Dadra and Nagar Haveli (UT)',
};

/** Districts for states/UTs not in or split across the JSON file */
const EXTRA_STATE_DISTRICTS = {
    'Andaman and Nicobar Islands': ['Nicobar', 'North and Middle Andaman', 'South Andaman'],
    'Ladakh': ['Kargil', 'Leh'],
    'Dadra and Nagar Haveli and Daman and Diu': [
        'Dadra & Nagar Haveli', 'Daman', 'Diu',
    ],
};

const jsonDistrictMap = {};
indiaData.states.forEach(({ state, districts }) => {
    const cleaned = districts.map((d) => d.replace(/&amp;/g, '&').trim());
    jsonDistrictMap[state] = cleaned;
});

/** All districts keyed by app state name */
export const STATE_DISTRICTS = {};

STATES.forEach(({ value: stateName }) => {
    const jsonKey = JSON_STATE_ALIASES[stateName] || stateName;
    let districts = jsonDistrictMap[jsonKey] || [];

    if (stateName === 'Dadra and Nagar Haveli and Daman and Diu') {
        const dadra = jsonDistrictMap['Dadra and Nagar Haveli (UT)'] || [];
        const daman = jsonDistrictMap['Daman and Diu (UT)'] || [];
        districts = [...new Set([...dadra, ...daman])];
    }

    if (EXTRA_STATE_DISTRICTS[stateName]) {
        districts = EXTRA_STATE_DISTRICTS[stateName];
    }

    STATE_DISTRICTS[stateName] = [...districts].sort((a, b) => a.localeCompare(b));
});

/** @deprecated Use STATE_DISTRICTS — kept for backward compatibility */
export const STATE_CITIES = STATE_DISTRICTS;

export const getDistrictsForState = (state) => {
    if (!state) return [];
    return STATE_DISTRICTS[state] || [];
};

export const getAllDistricts = () => {
    const all = new Set();
    Object.values(STATE_DISTRICTS).forEach((list) => list.forEach((d) => all.add(d)));
    return Array.from(all).sort((a, b) => a.localeCompare(b));
};

/** @deprecated Use getAllDistricts */
export const getAllCities = getAllDistricts;

export const districtOptionsForState = (state) =>
    getDistrictsForState(state).map((d) => ({ value: d, label: d }));
