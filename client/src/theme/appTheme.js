import { createTheme, alpha } from '@mui/material/styles';

/* ─────────────────────────────────────────────────────────────────────────
   WASSEL "FLUENT" DESIGN SYSTEM
   Inspired by Microsoft Dynamics 365 (Fluent UI) + Windows 11 (Mica/Fluent).

   - Dynamics 365 uses Fluent UI: clean neutral surfaces, an indigo/purple
     brand accent (#464775 / #6264A7), 4px control radius, thin 1px borders
     instead of heavy shadows, and Segoe UI typography.
   - Windows 11 "windows" (dialogs, flyouts, cards) use: 8px rounded corners,
     a distinct title-bar strip, soft layered depth-shadows, and an accent
     color system the user can personalize — exactly what we replicate here.
   ───────────────────────────────────────────────────────────────────────── */

// Windows 11 style accent-color palette (also used by Fluent/D365 apps)
export const ACCENT_COLORS = [
  { id: 'd365',   name: 'D365 Purple',  nameAr: 'بنفسجي D365', hex: '#6264A7' }, // Dynamics 365 / Teams brand
  { id: 'blue',   name: 'Windows Blue', nameAr: 'أزرق ويندوز', hex: '#0078D4' }, // Win11 default accent
  { id: 'teal',   name: 'Teal',         nameAr: 'تركواز',      hex: '#008272' },
  { id: 'green',  name: 'Green',        nameAr: 'أخضر',        hex: '#107C10' },
  { id: 'red',    name: 'Red',          nameAr: 'أحمر',        hex: '#D13438' },
  { id: 'orange', name: 'Orange',       nameAr: 'برتقالي',     hex: '#CA5010' },
  { id: 'pink',   name: 'Pink',         nameAr: 'وردي',        hex: '#E3008C' },
  { id: 'violet', name: 'Violet',       nameAr: 'بنفسجي غامق', hex: '#5C2D91' },
];

export const DEFAULT_ACCENT = ACCENT_COLORS[0].hex; // D365 purple by default

// Fluent depth shadows (Microsoft's official "ambient + key light" formula)
const fluentShadow = {
  2:  '0 1.6px 3.6px rgba(0,0,0,0.13), 0 0.3px 0.9px rgba(0,0,0,0.10)',
  4:  '0 3.2px 7.2px rgba(0,0,0,0.13), 0 0.6px 1.8px rgba(0,0,0,0.10)',
  8:  '0 6.4px 14.4px rgba(0,0,0,0.18), 0 1.2px 3.6px rgba(0,0,0,0.12)',
  16: '0 12.8px 28.8px rgba(0,0,0,0.22), 0 2.4px 7.2px rgba(0,0,0,0.14)', // window/dialog depth
};
const fluentShadowDark = {
  2:  '0 1.6px 3.6px rgba(0,0,0,0.42), 0 0.3px 0.9px rgba(0,0,0,0.36)',
  4:  '0 3.2px 7.2px rgba(0,0,0,0.44), 0 0.6px 1.8px rgba(0,0,0,0.36)',
  8:  '0 6.4px 14.4px rgba(0,0,0,0.50), 0 1.2px 3.6px rgba(0,0,0,0.40)',
  16: '0 12.8px 28.8px rgba(0,0,0,0.58), 0 2.4px 7.2px rgba(0,0,0,0.44)',
};

export const buildAppTheme = (dir = 'ltr', mode = 'light', accent = DEFAULT_ACCENT) => {
  const isDark = mode === 'dark';
  const sh = isDark ? fluentShadowDark : fluentShadow;

  // Fluent neutral surfaces
  const bgDefault = isDark ? '#1f1f1f' : '#faf9f8'; // Win11 desktop/app background
  const bgPaper   = isDark ? '#2b2b2b' : '#ffffff';  // Win11 "Card" / window body
  const bgTitleBar= isDark ? '#282828' : '#f3f2f1';  // Win11 title-bar strip tone
  const borderCol = isDark ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.08)';

  return createTheme({
    direction: dir,
    palette: {
      mode: isDark ? 'dark' : 'light',
      primary:   { main: accent },
      secondary: { main: '#34a853' },
      background: { default: bgDefault, paper: bgPaper },
      divider: borderCol,
      ...(isDark && {
        text: { primary: 'rgba(255,255,255,0.92)', secondary: 'rgba(255,255,255,0.62)' },
      }),
    },
    typography: {
      fontFamily: dir === 'rtl'
        ? '"Segoe UI Variable","Segoe UI","Tahoma","Arial",sans-serif'
        : '"Segoe UI Variable","Segoe UI","Helvetica Neue","Arial",sans-serif',
      h4: { fontWeight: 800 }, h5: { fontWeight: 700 }, h6: { fontWeight: 600 },
    },
    shape: { borderRadius: 8 }, // Windows 11 standard corner radius
    custom: {
      accent, isDark, bgTitleBar, borderCol,
      windowShadow: sh[16],
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: bgDefault,
            scrollbarColor: `${borderCol} transparent`,
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: { textTransform: 'none', borderRadius: 4, fontWeight: 600 }, // Fluent controls = 4px
          contained: { boxShadow: 'none', '&:hover': { boxShadow: sh[2] } },
        },
      },
      MuiTextField: { defaultProps: { size: 'small' } },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 4,
            backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
            '& .MuiOutlinedInput-notchedOutline': { borderColor: borderCol },
            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: alpha(accent, 0.6) },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: accent, borderWidth: 2 },
          },
        },
      },

      // ── Cards / panels styled as "Fluent surfaces" ──────────────────────
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            border: `1px solid ${borderCol}`,
          },
          elevation1: { boxShadow: sh[2] },
          elevation2: { boxShadow: sh[4] },
          elevation3: { boxShadow: sh[4] },
          rounded: { borderRadius: 8 },
        },
      },

      // ── Dialogs styled as real Windows-11 "windows" ─────────────────────
      MuiBackdrop: {
        styleOverrides: {
          root: {
            backgroundColor: isDark ? 'rgba(0,0,0,0.55)' : 'rgba(0,0,0,0.28)',
            backdropFilter: 'blur(6px)', // acrylic-style backdrop behind the window
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: 8,
            border: `1px solid ${borderCol}`,
            boxShadow: sh[16],
            overflow: 'hidden',
            backgroundColor: bgPaper,
            // subtle accent hairline across the very top, like an active
            // window's accent-colored focus border in Windows 11
            borderTop: `2px solid ${accent}`,
          },
        },
      },
      MuiDialogTitle: {
        styleOverrides: {
          root: {
            backgroundColor: bgTitleBar,
            borderBottom: `1px solid ${borderCol}`,
            minHeight: 52,
            display: 'flex',
            alignItems: 'center',
            fontSize: '1rem',
          },
        },
      },
      MuiDialogActions: {
        styleOverrides: {
          root: { backgroundColor: bgPaper, borderTop: `1px solid ${borderCol}` },
        },
      },
      MuiMenu: {
        styleOverrides: {
          paper: { borderRadius: 8, border: `1px solid ${borderCol}`, boxShadow: sh[8] },
        },
      },
      MuiPopover: {
        styleOverrides: {
          paper: { borderRadius: 8, border: `1px solid ${borderCol}`, boxShadow: sh[8] },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: { backgroundColor: isDark ? '#3b3b3b' : '#1f1f1f', borderRadius: 4, fontSize: '0.72rem' },
        },
      },
      MuiChip: { styleOverrides: { root: { borderRadius: 4, fontWeight: 600 } } },
      MuiSwitch: {
        styleOverrides: {
          switchBase: { '&.Mui-checked': { color: accent }, '&.Mui-checked + .MuiSwitch-track': { backgroundColor: accent } },
        },
      },
      MuiTab: { styleOverrides: { root: { textTransform: 'none', fontWeight: 600 } } },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: bgTitleBar,
            color: isDark ? '#fff' : '#1f1f1f',
            boxShadow: 'none',
            borderBottom: `1px solid ${borderCol}`,
          },
        },
      },
    },
  });
};

export default buildAppTheme;
