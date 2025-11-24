/**
 * Theme Manager
 */
class ThemeManager {
    constructor() {
        this.currentTheme = localStorage.getItem('theme') || 'monochrome';
        this.init();
    }

    init() {
        // Apply the saved theme
        this.applyTheme(this.currentTheme);

        // Set up theme toggle button
        const themeToggle = document.getElementById('theme-toggle');
        const themeDropdown = document.getElementById('theme-dropdown');

        // Toggle dropdown
        themeToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            themeDropdown.classList.toggle('hidden');
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!themeToggle.contains(e.target) && !themeDropdown.contains(e.target)) {
                themeDropdown.classList.add('hidden');
            }
        });

        // Handle theme option clicks
        document.querySelectorAll('.theme-option').forEach(button => {
            button.addEventListener('click', () => {
                const theme = button.dataset.theme;
                this.setTheme(theme);
                themeDropdown.classList.add('hidden');
            });

            // Highlight current theme
            if (button.dataset.theme === this.currentTheme) {
                button.classList.add('bg-white/20');
            }
        });
    }

    setTheme(themeName) {
        this.currentTheme = themeName;
        localStorage.setItem('theme', themeName);
        this.applyTheme(themeName);

        // Update active state in dropdown
        document.querySelectorAll('.theme-option').forEach(button => {
            if (button.dataset.theme === themeName) {
                button.classList.add('bg-white/20');
            } else {
                button.classList.remove('bg-white/20');
            }
        });
    }

    applyTheme(themeName) {
        // Remove all theme attributes
        document.body.removeAttribute('data-theme');
        document.documentElement.classList.remove('dark');

        // Apply the selected theme
        document.body.setAttribute('data-theme', themeName);

        // For monochrome, always use dark mode
        if (themeName === 'monochrome') {
            document.documentElement.classList.add('dark');
        }
    }

    getTheme() {
        return this.currentTheme;
    }
}

// Initialize theme manager when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.themeManager = new ThemeManager();
    });
} else {
    window.themeManager = new ThemeManager();
}
