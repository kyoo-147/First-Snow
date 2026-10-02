# Snow Design Tokens

## Color tokens

```css
--snow-bg: #F7FAFF;
--snow-foreground: #20165F;
--snow-muted: #6B6A93;
--snow-surface: #FFFFFF;
--snow-surface-soft: #F2F5FF;
--snow-border: #E2E7FF;

--snow-primary: #6D5DFB;
--snow-primary-dark: #24146F;
--snow-primary-soft: #E9E4FF;

--snow-ice: #DDF3FF;
--snow-aqua: #7DE3EA;
--snow-lavender: #E9E4FF;
--snow-peach: #FFC7A8;
--snow-pink: #FF9BC1;

--snow-success: #27C884;
--snow-warning: #FFB84D;
--snow-danger: #FF6B7A;
```

## Radius

```css
--radius-sm: 10px;
--radius-md: 16px;
--radius-lg: 24px;
--radius-xl: 32px;
--radius-2xl: 40px;
--radius-full: 9999px;
```

## Shadows

```css
--shadow-soft: 0 16px 40px rgba(60, 70, 130, 0.10);
--shadow-card: 0 10px 30px rgba(67, 56, 202, 0.10);
--shadow-stage: 0 24px 70px rgba(92, 94, 180, 0.18);
```

## Typography

Recommended font stack:

```css
font-family: Nunito, Outfit, Geist, Inter, system-ui, sans-serif;
```

## Sizing

```txt
Sidebar width: 248px to 280px
Right panel width: 320px to 380px
Desktop content max width: 1440px
Child card radius: 24px to 32px
Minimum touch target: 44px preferred
```

## Rule

If a style is not represented as a token, do not use it in implementation without adding it here first.
