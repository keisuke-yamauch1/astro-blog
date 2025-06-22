
const handleToggleClick = () => {
  const element = document.documentElement;
  element.classList.toggle('dark');

  const isDark = element.classList.contains('dark');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
};

// Setup click listener
const setupToggleListener = () => {
  const toggleButton = document.getElementById('themeToggle');
  if (toggleButton) {
    toggleButton.addEventListener('click', handleToggleClick);
  }
};

document.addEventListener('DOMContentLoaded', setupToggleListener);
document.addEventListener('astro:page-load', setupToggleListener);
