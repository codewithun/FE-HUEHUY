module.exports = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#EFEFEF',
        'background-secondary': '#DADFDF',
        primary: '#2C4720',
        'light-primary': '#8FB5B2',
        secondary: '#172554',
        'light-secondary': '#9ae9f9',
        danger: '#AA2B1D',
        'light-danger': '#fececf',
        warning: '#f57e2c',
        'light-warning': '#ffd7bc',
        success: '#15803D',
        'light-success': '#BEDC74',
        disable: '#c4c3c3',
        'light-disable': '#f4f4f4',
      },
      fontSize: {
        md: '1rem',
        '2xs': '8px',
      },
    },
  },
  plugins: [],
};
