// 🎓 REACT CONCEPT: Utility functions for unit conversions
// In SwiftUI: static func convert(amount: Double, from: Unit, to: Unit) -> Double
// In React: export const convertAmount = (amount: number, from: Unit, to: Unit) => number

export type MeasureUnit = 'ml' | 'oz' | 'cup' | 'bottle';

// Conversion rates to ml (milliliters as base unit)
const CONVERSION_RATES: Record<MeasureUnit, number> = {
  ml: 1,
  oz: 29.5735, // 1 fluid ounce = 29.5735 ml
  cup: 236.588, // 1 US cup = 236.588 ml
  bottle: 500, // Standard water bottle = 500ml
};

// Convert any unit to milliliters
export const toMilliliters = (amount: number, unit: MeasureUnit): number => {
  return amount * CONVERSION_RATES[unit];
};

// Convert milliliters to any unit
export const fromMilliliters = (ml: number, unit: MeasureUnit): number => {
  return ml / CONVERSION_RATES[unit];
};

// Convert between any two units
export const convertAmount = (amount: number, from: MeasureUnit, to: MeasureUnit): number => {
  if (from === to) return amount;
  const ml = toMilliliters(amount, from);
  return fromMilliliters(ml, to);
};

// Format amount with unit for display
export const formatAmount = (amount: number, unit: MeasureUnit): string => {
  const rounded = Math.round(amount * 10) / 10; // Round to 1 decimal place
  return `${rounded}${unit}`;
};

// Get display name for unit
export const getUnitDisplayName = (unit: MeasureUnit): string => {
  const names: Record<MeasureUnit, string> = {
    ml: 'Milliliters',
    oz: 'Fluid Ounces',
    cup: 'Cups',
    bottle: 'Bottles',
  };
  return names[unit];
};

// Get short display name for unit
export const getUnitShortName = (unit: MeasureUnit): string => {
  const names: Record<MeasureUnit, string> = {
    ml: 'ml',
    oz: 'oz',
    cup: 'cup',
    bottle: 'bottle',
  };
  return names[unit];
};

// Common amounts in different units for quick selection
export const getQuickAmounts = (unit: MeasureUnit): number[] => {
  const amounts: Record<MeasureUnit, number[]> = {
    ml: [250, 500, 1000, 2000],
    oz: [8.5, 16.9, 33.8, 67.6], // ~250ml, 500ml, 1000ml, 2000ml
    cup: [1, 2, 4, 8], // ~250ml, 500ml, 1000ml, 2000ml
    bottle: [0.5, 1, 2, 4], // ~250ml, 500ml, 1000ml, 2000ml
  };
  return amounts[unit];
};

// Get recommended daily goal in user's preferred unit
export const getRecommendedGoal = (unit: MeasureUnit): number => {
  const recommendedMl = 2000; // 2L is the general recommendation
  return fromMilliliters(recommendedMl, unit);
};

// Height conversion utilities
export type HeightUnit = 'cm' | 'ft' | 'in';

const HEIGHT_CONVERSION_RATES: Record<HeightUnit, number> = {
  cm: 1,
  ft: 30.48, // 1 foot = 30.48 cm
  in: 2.54,  // 1 inch = 2.54 cm
};

export const convertHeight = (value: number, from: HeightUnit, to: HeightUnit): number => {
  if (from === to) return value;
  const cm = value * HEIGHT_CONVERSION_RATES[from];
  const result = cm / HEIGHT_CONVERSION_RATES[to];
  // Round to 2 decimal places to avoid floating point precision issues
  return Math.round(result * 100) / 100;
};

export const formatHeight = (value: number, unit: HeightUnit): string => {
  if (unit === 'ft') {
    const feet = Math.floor(value);
    const inches = Math.round((value - feet) * 12);
    return `${feet}'${inches}"`;
  }
  return `${Math.round(value * 10) / 10}${unit}`;
};

// Weight conversion utilities
export type WeightUnit = 'kg' | 'lbs';

const WEIGHT_CONVERSION_RATES: Record<WeightUnit, number> = {
  kg: 1,
  lbs: 0.453592, // 1 pound = 0.453592 kg
};

export const convertWeight = (value: number, from: WeightUnit, to: WeightUnit): number => {
  if (from === to) return value;
  const kg = value * WEIGHT_CONVERSION_RATES[from];
  const result = kg / WEIGHT_CONVERSION_RATES[to];
  // Round to 2 decimal places to avoid floating point precision issues
  return Math.round(result * 100) / 100;
};

export const formatWeight = (value: number, unit: WeightUnit): string => {
  return `${Math.round(value * 10) / 10} ${unit}`;
};
