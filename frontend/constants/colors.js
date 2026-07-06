export const colors = {
  primary: '#2E7D32',
  primaryHover: '#1b5e20',
  primaryLight: '#E8F5E9',
  bgPrimary: '#F0F4F8',
  bgCard: '#FFFFFF',
  textMain: '#1B2B1C',
  textMuted: '#546E7A',
  border: '#C8E6C9',
  success: '#2E7D32',
  warning: '#f59e0b',
  warningLight: '#fef3c7',
  danger: '#d32f2f',
  dangerHover: '#b71c1c',
  dangerLight: '#ffebee',
  grayOut: '#b0bec5',
  grayOutBg: '#eceff1',
  white: '#FFFFFF',
  // Keep original references mapping to new tokens for backwards compatibility temporarily
  background: '#F0F4F8', 
  textDark: '#1B2B1C',
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  full: 9999,
};

export const shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 15,
    elevation: 8,
  }
};
