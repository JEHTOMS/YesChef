// Google Analytics 4 tracking utilities
// This file provides easy-to-use functions for tracking user interactions

// Track page views (automatically handled by GA4, but useful for SPA routing)
export const trackPageView = (page_title, page_location) => {
  if (typeof window.gtag !== 'undefined') {
    window.gtag('event', 'page_view', {
      page_title: page_title,
      page_location: page_location
    });
  }
};

// Track recipe extractions
export const trackRecipeExtraction = (source_type, success = true) => {
  if (typeof window.gtag !== 'undefined') {
    window.gtag('event', 'recipe_extraction', {
      event_category: 'Recipe',
      event_label: source_type, // 'youtube', 'url', 'manual'
      success: success,
      value: success ? 1 : 0
    });
  }
};

// Track recipe interactions
export const trackRecipeInteraction = (action, recipe_type = '') => {
  if (typeof window.gtag !== 'undefined') {
    window.gtag('event', action, {
      event_category: 'Recipe_Interaction',
      event_label: recipe_type,
      custom_event: true
    });
  }
};

// Track timer usage
export const trackTimerUsage = (action, duration_seconds = 0) => {
  if (typeof window.gtag !== 'undefined') {
    window.gtag('event', action, {
      event_category: 'Timer',
      duration: duration_seconds,
      value: duration_seconds
    });
  }
};

// Track user engagement with specific features
export const trackFeatureUsage = (feature_name, interaction_type = 'click') => {
  if (typeof window.gtag !== 'undefined') {
    window.gtag('event', 'feature_usage', {
      event_category: 'User_Engagement',
      event_label: feature_name,
      interaction_type: interaction_type
    });
  }
};

// Track errors for debugging
export const trackError = (error_type, error_message, page_location = '') => {
  if (typeof window.gtag !== 'undefined') {
    window.gtag('event', 'exception', {
      description: `${error_type}: ${error_message}`,
      fatal: false,
      page_location: page_location
    });
  }
};

// Track conversion events (successful recipe completions)
export const trackConversion = (conversion_type, value = 1) => {
  if (typeof window.gtag !== 'undefined') {
    window.gtag('event', 'conversion', {
      event_category: 'Goal_Completion',
      event_label: conversion_type,
      value: value
    });
  }
};