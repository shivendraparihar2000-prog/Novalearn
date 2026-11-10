export const PAGE_PATHS = Object.freeze({
  'Landing Page': '/',
  'Sign Up / Login': '/auth',
  Onboarding: '/onboarding',
  'Student Dashboard': '/dashboard',
  Home: '/dashboard',
  Explore: '/explore',
  'Explore Courses': '/explore',
  'My Learning': '/my-learning',
  'Course / Learning View': '/learn',
  'Quiz / Assessment': '/assessment',
  Diagnostic: '/diagnostic',
  'Learner Profile': '/profile',
  Profile: '/profile',
  Recommendations: '/recommendations',
  'Learning Journey': '/journey',
  Journey: '/journey',
  Progress: '/progress',
  'Progress Analytics': '/progress',
  'Focus Mode': '/focus',
  'Guardian Dashboard': '/guardian',
  'How It Works / About': '/about',
});

const PATH_PAGES = Object.freeze({
  '/': 'Landing Page',
  '/auth': 'Sign Up / Login',
  '/onboarding': 'Onboarding',
  '/dashboard': 'Student Dashboard',
  '/explore': 'Explore',
  '/my-learning': 'My Learning',
  '/learn': 'Course / Learning View',
  '/assessment': 'Quiz / Assessment',
  '/diagnostic': 'Diagnostic',
  '/profile': 'Profile',
  '/recommendations': 'Recommendations',
  '/journey': 'Learning Journey',
  '/progress': 'Progress',
  '/focus': 'Focus Mode',
  '/guardian': 'Guardian Dashboard',
  '/about': 'How It Works / About',
});

export function pathForPage(page) {
  return PAGE_PATHS[page] || '/dashboard';
}

export function pageForPath(pathname, fallback = 'Landing Page') {
  const path = pathname.replace(/\/+$/, '') || '/';
  return PATH_PAGES[path] || fallback;
}
